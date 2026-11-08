import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma, { inMemoryPrisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/encryption";

// Short-lived verification cache to withstand high concurrency bursts without slamming pooler
interface CachedVerifiedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  cachedAt: number;
}
const verifiedUserCache = new Map<string, CachedVerifiedUser>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 150): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const inputEmail = credentials.email.toLowerCase().trim();
        const inputPassword = credentials.password.trim();

        // 1. Check quick in-memory TTL verification cache
        const cached = verifiedUserCache.get(inputEmail);
        if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
          const isMatch = await verifyPassword(inputPassword, cached.passwordHash);
          if (isMatch) {
            return {
              id: cached.id,
              name: cached.name,
              email: cached.email,
              role: cached.role,
            };
          }
        }

        try {
          // 2. Fetch User and UserMode by either email OR vmNo (case-insensitive)
          const [userRes, modeRes] = await withRetry(async () => {
            return await Promise.all([
              prisma.user.findFirst({
                where: {
                  OR: [
                    { email: { equals: inputEmail, mode: "insensitive" } },
                    { vmNo: { equals: inputEmail, mode: "insensitive" } },
                  ],
                },
              }).catch(() => null),
              prisma.userMode.findFirst({
                where: {
                  OR: [
                    { emailid: { equals: inputEmail, mode: "insensitive" } },
                    { vmno: { equals: inputEmail, mode: "insensitive" } },
                  ],
                },
              }).catch(() => null),
            ]);
          });

          // Check standard User table first
          if (userRes && userRes.password) {
            const isValid = await verifyPassword(inputPassword, userRes.password);
            if (isValid) {
              const matchedUser = {
                id: userRes.id,
                name: userRes.name,
                email: userRes.email,
                role: userRes.role,
              };
              verifiedUserCache.set(inputEmail, {
                ...matchedUser,
                passwordHash: userRes.password,
                cachedAt: Date.now(),
              });
              return matchedUser;
            }
          }

          // Check UserMode table as fallback
          if (modeRes && modeRes.password) {
            const isPasswordValid = await verifyPassword(inputPassword, modeRes.password);
            if (isPasswordValid) {
              const matchedUser = {
                id: modeRes.vmno,
                name: modeRes.emailid.split("@")[0],
                email: modeRes.emailid,
                role: modeRes.usermode.toUpperCase(),
              };
              verifiedUserCache.set(inputEmail, {
                ...matchedUser,
                passwordHash: modeRes.password,
                cachedAt: Date.now(),
              });
              return matchedUser;
            }
          }
        } catch (dbErr) {
          console.error("[Auth Error] Primary database failed, falling back to in-memory store:", dbErr);
          try {
            // Fallback to in-memory store if DB is completely unreachable
            const memMode = await inMemoryPrisma.userMode.findFirst({
              where: { emailid: { equals: inputEmail, mode: "insensitive" } },
            });
            if (memMode && memMode.password) {
              const isMatch = await verifyPassword(inputPassword, memMode.password);
              if (isMatch) {
                return {
                  id: memMode.vmno,
                  name: memMode.emailid.split("@")[0],
                  email: memMode.emailid,
                  role: memMode.usermode.toUpperCase(),
                };
              }
            }

            const memUser = await inMemoryPrisma.user.findFirst({
              where: { email: { equals: inputEmail, mode: "insensitive" } },
            });
            if (memUser && memUser.password) {
              const isMatch = await verifyPassword(inputPassword, memUser.password);
              if (isMatch) {
                return {
                  id: memUser.id,
                  name: memUser.name,
                  email: memUser.email,
                  role: memUser.role,
                };
              }
            }
          } catch (memErr) {
            console.error("[Auth Error] In-memory store fallback also failed:", memErr);
          }
        }

        return null;
      }
    })
  ],
  // No hardcoded fallback in production: a publicly known secret lets anyone forge session tokens.
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret"),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    }
  }
};
