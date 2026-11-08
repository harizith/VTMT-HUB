import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Groq from 'groq-sdk';
import { hashPassword } from '@/lib/encryption';
import { requireAdmin } from '@/lib/adminAuth';

const apiKeys = [
  process.env.GROQ_API_KEY,
  process.env.FALLBACK_GROQ_API_KEY,
  process.env.FALLBACK_GROQ_API_KEY_2
].filter(Boolean) as string[];

// High-efficiency model ladder for Groq Free Tier:
// llama-3.1-8b-instant has 30,000 TPM / 30 RPM (5x higher limit than 70b models)
const MODELS_TO_TRY = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
];

// Short in-memory cache for frequent read queries to prevent redundant Groq calls
const queryCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function createCompletionWithFailover(messages: any[], tools?: any[]) {
  let lastError: any;
  for (const apiKey of apiKeys) {
    try {
      const groqClient = new Groq({ apiKey });
      
      let clientError: any;
      for (const model of MODELS_TO_TRY) {
        try {
          const options: any = {
            messages,
            model,
            max_tokens: 350, // optimal concise output length to conserve TPM/limit
            temperature: 0.1, // low temperature: deterministic, concise, token-efficient
          };
          if (tools) {
            options.tools = tools;
            options.tool_choice = 'auto';
          }
          return await groqClient.chat.completions.create(options);
        } catch (modelErr: any) {
          clientError = modelErr;
          const msg = modelErr?.message || String(modelErr);
          if (msg.includes('model') || msg.includes('decommissioned') || msg.includes('not found')) {
            continue;
          }
          if (msg.includes('rate_limit') || msg.includes('tokens per minute') || modelErr?.status === 429) {
            continue;
          }
          throw modelErr;
        }
      }
      throw clientError;
    } catch (error: any) {
      const errStr = error?.message || String(error);
      if (errStr.includes('rate_limit') || errStr.includes('tokens per minute') || error?.status === 429 || error?.status === 413) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("All Groq API keys hit rate limits or none were provided. Please add FALLBACK_GROQ_API_KEY to your .env");
}

// Disallow dangerous SQL commands in AI queries
const DESTRUCTIVE_SQL_PATTERN = /\b(DROP|TRUNCATE|ALTER|GRANT|REVOKE|DATABASE|SCHEMA|SHUTDOWN|INSERT|UPDATE|DELETE|MERGE|COPY|CALL|EXECUTE|SET|DO|LOCK|VACUUM|pg_[a-z_]+)\b/i;

// Ultra-compact system prompt minimizing input tokens
const SYSTEM_PROMPT = `Admin assistant for VM-HUB academic portal.
Models:
- User(id,vmNo,email,name,role[STUDENT,FACULTY,HOD,ADMIN],status)
- StudentProfile(userEmail,rollNumber,department,semester,batch)
- FacultyProfile(vmNo,department,designation)
- Department(id,code,name,hodName)
- Subject(id,code,name,credits,semester,departmentCode)
- Notice(id,title,content,category,audience,postedBy)
- TimetableEntry(id,classId,dayOrder,period,timeRange,subjectCode,subjectName,facultyName,roomNo)

Rules:
1. Concise & direct responses (max 2-3 sentences or bullet points).
2. Use read_query for SELECT queries. Never access passwords.
3. Passwords are safe bcrypt hashes; offer to reset instead.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_query',
      description: 'Execute read-only SELECT SQL query.',
      parameters: {
        type: 'object',
        properties: {
          sqlQuery: { type: 'string', description: 'SELECT query.' }
        },
        required: ['sqlQuery']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_user',
      description: 'Create user with bcrypt password.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN'] },
          vmNo: { type: 'string' }
        },
        required: ['email', 'name', 'password', 'role']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_user_password',
      description: 'Reset user password with bcrypt.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          newPassword: { type: 'string' }
        },
        required: ['email', 'newPassword']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_notice',
      description: 'Publish academic notice.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string', enum: ['GENERAL', 'URGENT', 'EXAM'] },
          audience: { type: 'string', enum: ['ALL', 'STUDENT', 'FACULTY'] }
        },
        required: ['title', 'content']
      }
    }
  }
];

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const { query, attachedData, history } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, reply: 'No query provided.' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const cacheKey = trimmedQuery.toLowerCase();

    // Check fast cache for identical queries within TTL (saves 100% of tokens on repeated questions)
    if (!attachedData && (!history || history.length === 0)) {
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return NextResponse.json({ success: true, reply: cached.reply, cached: true });
      }
    }

    let dynamicSystem = SYSTEM_PROMPT;
    if (attachedData) {
      // Limit attached data preview to 200 chars to prevent token spikes
      dynamicSystem += `\nData: ${JSON.stringify(attachedData).substring(0, 200)}`;
    }

    // Keep only the last 2 conversation turns, compacting strings to max 200 chars
    const recentHistory = (history || []).slice(-2).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' && msg.content.length > 200 
        ? msg.content.substring(0, 200) + '...' 
        : (msg.content || '')
    }));

    const messages: any[] = [
      { role: 'system', content: dynamicSystem },
      ...recentHistory,
      { role: 'user', content: trimmedQuery.substring(0, 300) }
    ];

    let currentCompletion = await createCompletionWithFailover(messages, TOOLS);
    let currentMessage = currentCompletion.choices[0]?.message;

    let iterations = 0;
    const MAX_ITERATIONS = 2; // Reduced to 2 iterations max to prevent runaway token expenditure

    while (currentMessage?.tool_calls?.length && iterations < MAX_ITERATIONS) {
      const toolCall = currentMessage.tool_calls[0];
      let dbResult: any;
      let errorStr: string | null = null;
      let toolName = toolCall.function.name;

      if (toolName === 'read_query') {
        const { sqlQuery } = JSON.parse(toolCall.function.arguments);
        const trimmed = sqlQuery.trim();
        
        // Security checks: enforce read-only SELECT queries and block destructive keywords
        if (!trimmed.toLowerCase().startsWith('select') && !trimmed.toLowerCase().startsWith('with')) {
          dbResult = 'Error: Only SELECT queries permitted.';
        } else if (DESTRUCTIVE_SQL_PATTERN.test(trimmed)) {
          dbResult = 'Error: Destructive SQL forbidden.';
        } else if (/password/i.test(trimmed) || /\bselect\s+(distinct\s+)?\*|\w\.\*/i.test(trimmed)) {
          // "SELECT *" is rejected too, since it would return the password column
          dbResult = 'Error: Select explicit columns; password hashes are restricted.';
        } else if (trimmed.replace(/;\s*$/, '').includes(';')) {
          dbResult = 'Error: Only a single statement is permitted.';
        } else {
          try {
            // Enforce read-only at the database level, regardless of the keyword filter above
            dbResult = await prisma.$transaction(async (tx) => {
              await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
              return tx.$queryRawUnsafe(trimmed.replace(/;\s*$/, ''));
            });
          } catch (err: any) {
            errorStr = err.message;
            dbResult = `DB error: ${errorStr}`;
          }
        }
      } else if (toolName === 'create_user') {
        const { email, name, password, role, vmNo } = JSON.parse(toolCall.function.arguments);
        try {
          const hashedPassword = await hashPassword(password);
          const cleanEmail = email.toLowerCase().trim();
          const cleanName = name.trim();
          const cleanVmNo = vmNo ? vmNo.trim() : null;

          const newUser = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: cleanName,
              password: hashedPassword,
              role: role as any,
              status: "ACTIVE",
              vmNo: cleanVmNo
            }
          });

          if (cleanVmNo) {
            await prisma.userMode.upsert({
              where: { vmno: cleanVmNo },
              update: { emailid: cleanEmail, password: hashedPassword, usermode: role },
              create: { vmno: cleanVmNo, emailid: cleanEmail, password: hashedPassword, usermode: role }
            }).catch(() => null);
          }

          dbResult = `User ${newUser.id} created.`;
        } catch (err: any) {
          errorStr = err.message;
          dbResult = `Error: ${errorStr}`;
        }
      } else if (toolName === 'update_user_password') {
        const { email, newPassword } = JSON.parse(toolCall.function.arguments);
        try {
          const hashedPassword = await hashPassword(newPassword);
          const cleanEmail = email.toLowerCase().trim();

          await prisma.user.update({
            where: { email: cleanEmail },
            data: { password: hashedPassword }
          });

          const um = await prisma.userMode.findUnique({ where: { emailid: cleanEmail } }).catch(() => null);
          if (um) {
            await prisma.userMode.update({
              where: { emailid: cleanEmail },
              data: { password: hashedPassword }
            }).catch(() => null);
          }

          dbResult = `Password reset for ${cleanEmail}.`;
        } catch (err: any) {
          errorStr = err.message;
          dbResult = `Error: ${errorStr}`;
        }
      } else if (toolName === 'create_notice') {
        const { title, content, category, audience } = JSON.parse(toolCall.function.arguments);
        try {
          const notice = await prisma.notice.create({
            data: {
              title: title.trim(),
              content: content.trim(),
              category: category || "GENERAL",
              audience: audience || "ALL",
              postedBy: "Admin"
            }
          });
          dbResult = `Notice ${notice.id} created.`;
        } catch (err: any) {
          errorStr = err.message;
          dbResult = `Error: ${errorStr}`;
        }
      } else {
        dbResult = `Unknown tool: ${toolName}`;
      }

      messages.push(currentMessage);
      
      // Limit DB result output fed back to Groq to 600 characters (down from 2000)
      let resultString = typeof dbResult === 'string'
        ? dbResult
        : JSON.stringify(dbResult, (_k, v) => (typeof v === 'bigint' ? Number(v) : v));
      if (resultString.length > 600) {
        resultString = resultString.substring(0, 600) + '... [truncated]';
      }

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content: resultString
      });

      // No tools in the follow-up completion: forces immediate concise answer with zero extra tool tokens
      currentCompletion = await createCompletionWithFailover(messages);
      currentMessage = currentCompletion.choices[0]?.message;
      iterations++;
    }

    const reply = currentMessage?.content || "Request processed.";

    // Store in cache for TTL
    if (!attachedData) {
      queryCache.set(cacheKey, { reply, timestamp: Date.now() });
      if (queryCache.size > 100) {
        // Prune older entries
        const firstKey = queryCache.keys().next().value;
        if (firstKey) queryCache.delete(firstKey);
      }
    }

    return NextResponse.json({
      success: true,
      reply
    });

  } catch (error: any) {
    console.error('Agent error:', error);
    const errText = error?.message || String(error);
    const isRateLimit = errText.includes('rate limit') || errText.includes('429') || errText.includes('tokens per minute');
    const userFriendlyMessage = isRateLimit
      ? "AI token limit reached briefly on the free tier. Please wait 15 seconds, or configure a fallback key in your .env."
      : `Unable to process request: ${errText}`;

    return NextResponse.json({ success: false, reply: userFriendlyMessage }, { status: 200 });
  }
}
