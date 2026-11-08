import fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { parseTimetablePdfBuffer } from '../src/utils/timetablePdfParser';

async function main() {
  const filePath = 'C:/Users/hariz/.gemini/antigravity-ide/brain/e954d074-3d2c-4281-96fe-5314b28aee31/.user_uploaded/media_1791814653341.pdf';
  const buf = fs.readFileSync(filePath);

  const { facultySheets, allSlots } = await parseTimetablePdfBuffer(buf);

  console.log(`Total Pages/Sheets: ${facultySheets.length}`);
  console.log(`Total Slots: ${allSlots.length}`);

  for (const f of facultySheets) {
    console.log(`- ${f.facultyName} (MTS: ${f.vmsNo || 'None'}): ${f.slots.length} slots extracted (Expected hours: ${f.totalHoursPerWeek || 'N/A'})`);
  }
}

main().catch(console.error);
