import fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

async function main() {
  const filePath = 'C:/Users/hariz/.gemini/antigravity-ide/brain/e954d074-3d2c-4281-96fe-5314b28aee31/.user_uploaded/media_1791814653341.pdf';
  const buf = fs.readFileSync(filePath);

  const pagesData: any[] = [];
  let pageCounter = 0;

  await pdf(buf, {
    pagerender: (pageData: any) => {
      pageCounter++;
      const curPage = pageCounter;
      return pageData.getTextContent().then((textContent: any) => {
        pagesData.push({ page: curPage, items: textContent.items });
        return '';
      });
    }
  });

  const DAY_ORDERS = ['I', 'II', 'III', 'IV', 'V'];

  for (const p of pagesData) {
    const sorted = [...p.items].sort((a, b) => {
      if (Math.abs(a.transform[5] - b.transform[5]) > 4) return b.transform[5] - a.transform[5];
      return a.transform[4] - b.transform[4];
    });

    const fullText = sorted.map((i: any) => i.str.trim()).filter(Boolean).join(' ');
    const nameMatch = fullText.match(/Name of the Faculty\s*:\s*([^:]+?)(?:MTS No|Designation|$)/i);
    const facultyName = nameMatch ? nameMatch[1].trim() : `Page ${p.page}`;

    // Find DO items
    const doItems = sorted.filter(i => {
      const s = i.str.trim();
      const x = i.transform[4];
      const y = i.transform[5];
      return DAY_ORDERS.includes(s) && x < 40 && y > 350 && y < 600;
    });

    // Check if any DO are missing or y coordinates
    const daysFound = doItems.map(i => `${i.str.trim()}@y=${Math.round(i.transform[5])}`);
    
    // Find all text items in grid area: y between 400 and 560, x between 40 and 580
    const gridTokens = sorted.filter(i => {
      const x = i.transform[4];
      const y = i.transform[5];
      const s = i.str.trim();
      return y >= 400 && y <= 580 && x >= 40 && x <= 585 && s && !/^(DO|[1-8]|L|U|N|C|H|B|R|E|A|K|8\.05|8\.55|10\.00|10\.50|12\.20|1\.05|2\.00|2\.45|to)$/i.test(s);
    });

    if (doItems.length < 5 || gridTokens.length === 0) {
      console.log(`Page ${p.page} (${facultyName}): Days found (${doItems.length}): [${daysFound.join(', ')}], Grid tokens: ${gridTokens.length}`);
      if (gridTokens.length > 0) {
        console.log('   Tokens in grid:', gridTokens.map(i => `${i.str.trim()}@(x=${Math.round(i.transform[4])}, y=${Math.round(i.transform[5])})`));
      }
    }
  }
}

main().catch(console.error);
