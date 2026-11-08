const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

async function testMap() {
  const filePath = path.join(__dirname, '.agents', 'sub media', 'Individual TT -odd 2026-27 - 11.8.26 (1).docx');
  const buffer = fs.readFileSync(filePath);
  const res = await mammoth.convertToHtml({ buffer });
  const tables = res.value.match(/<table[\s\S]*?<\/table>/gi) || [];
  const subjectsCollected = new Map();

  for (let f = 0; f < 33; f++) {
    const subTable = tables[f * 3 + 2];
    if (subTable) {
      const trs = subTable.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      if (trs.length >= 4) {
        const subNames = (trs[1].match(/<(td|th)[\s\S]*?<\/(td|th)>/gi) || []).map(t => t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        const semSecs = (trs[3].match(/<(td|th)[\s\S]*?<\/(td|th)>/gi) || []).map(t => t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        for (let c = 0; c < subNames.length; c++) {
          const name = subNames[c];
          const sec = semSecs[c] || '';
          if (name) {
            subjectsCollected.set(name.toUpperCase(), { name, sec });
          }
        }
      }
    }
  }

  console.log('Unique Subjects collected from all Subject Tables:', subjectsCollected.size);
  for (const [k, v] of subjectsCollected) {
    console.log(`  "${k}" -> Sec: "${v.sec}"`);
  }
}

testMap().catch(console.error);
