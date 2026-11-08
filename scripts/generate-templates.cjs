const fs = require('fs');
const path = require('path');

function createPdfBuffer(pagesContent) {
  // pagesContent: array of stream string commands
  const objects = [];
  let currentOffset = 9; // '%PDF-1.4\n' is 9 bytes
  const offsets = [];

  function addObject(content) {
    const objNum = objects.length + 1;
    offsets.push(currentOffset);
    const str = `${objNum} 0 obj\n${content}\nendobj\n`;
    currentOffset += Buffer.byteLength(str, 'utf8');
    objects.push(str);
    return objNum;
  }

  // 1: Catalog -> will be added after Pages
  // We'll calculate properly:
  const font1Obj = `${objects.length + 1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const font2Obj = `${objects.length + 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  // We can construct a complete well-formed PDF:
  const font1Num = 3;
  const font2Num = 4;

  const pageObjNums = [];
  const streamObjNums = [];

  // Total objects: 1 (Catalog), 2 (Pages), 3 (Font1), 4 (Font2), then for each page: PageObj, StreamObj
  let nextObjNum = 5;
  for (let i = 0; i < pagesContent.length; i++) {
    pageObjNums.push(nextObjNum++);
    streamObjNums.push(nextObjNum++);
  }

  const catalog = `<< /Type /Catalog /Pages 2 0 R >>`;
  const pagesList = pageObjNums.map(n => `${n} 0 R`).join(' ');
  const pagesParent = `<< /Type /Pages /Kids [${pagesList}] /Count ${pagesContent.length} >>`;

  const font1 = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  const font2 = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

  const allObjStrings = [
    `1 0 obj\n${catalog}\nendobj`,
    `2 0 obj\n${pagesParent}\nendobj`,
    `3 0 obj\n${font1}\nendobj`,
    `4 0 obj\n${font2}\nendobj`,
  ];

  for (let i = 0; i < pagesContent.length; i++) {
    const pageNum = pageObjNums[i];
    const streamNum = streamObjNums[i];
    const content = pagesContent[i];
    const streamLen = Buffer.byteLength(content, 'utf8');

    allObjStrings.push(
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents ${streamNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj`
    );
    allObjStrings.push(
      `${streamNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${content}\nendstream\nendobj`
    );
  }

  // Now assemble with exact byte offsets:
  let body = '%PDF-1.4\n';
  const finalOffsets = [0]; // dummy for 0 65535 f

  for (let i = 0; i < allObjStrings.length; i++) {
    finalOffsets.push(Buffer.byteLength(body, 'utf8'));
    body += allObjStrings[i] + '\n';
  }

  const startxref = Buffer.byteLength(body, 'utf8');
  let xref = `xref\n0 ${allObjStrings.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= allObjStrings.length; i++) {
    xref += String(finalOffsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${allObjStrings.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'utf8');
}

// 1. Generate Individual Faculty Timetable Template matching Google Doc
function generateIndividualTemplateContent() {
  const lines = [
    // Header
    'BT /F2 14 Tf 180 560 Td (VEL TECH MULTI TECH Dr.RANGARAJAN Dr.SAKUNTHALA ENGINEERING COLLEGE) Tj ET',
    'BT /F1 10 Tf 260 545 Td ((An Autonomous Institution - Affiliated to Anna University, Chennai)) Tj ET',
    'BT /F2 12 Tf 230 530 Td (DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING) Tj ET',
    'BT /F2 13 Tf 320 512 Td (INDIVIDUAL TIME TABLE) Tj ET',

    // Details box
    'q 0.5 w 40 440 762 60 re S Q',
    'BT /F2 10 Tf 50 482 Td (Faculty Details) Tj ET',
    'BT /F2 9 Tf 50 465 Td (Name of the Faculty: ) Tj /F1 9 Tf (Dr. M. Victor Jose) Tj ET',
    'BT /F2 9 Tf 260 465 Td (MTS No: ) Tj /F1 9 Tf (2014) Tj ET',
    'BT /F2 9 Tf 420 465 Td (Designation: ) Tj /F1 9 Tf (Associate Professor) Tj ET',
    'BT /F2 9 Tf 630 465 Td (Total hours per week: ) Tj /F1 9 Tf (16 hrs) Tj ET',

    'BT /F2 9 Tf 50 448 Td (Department: ) Tj /F1 9 Tf (Computer Science and Engineering) Tj ET',
    'BT /F2 9 Tf 260 448 Td (Academic Year: ) Tj /F1 9 Tf (2025 - 2026 (Odd Sem)) Tj ET',

    // Grid Table Header
    'q 0.5 w 40 230 762 195 re S Q',
    // Header row background
    'q 0.9 0.92 0.95 rg 40 395 762 30 re f Q',
    'q 0.5 w 40 395 762 30 re S Q',

    // Column headers
    'BT /F2 8 Tf 45 407 Td (Day Order (DO)) Tj ET',
    'BT /F2 8 Tf 135 412 Td (1) Tj /F1 7 Tf 120 402 Td (08:05-08:55) Tj ET',
    'BT /F2 8 Tf 205 412 Td (2) Tj /F1 7 Tf 190 402 Td (08:55-09:45) Tj ET',
    'BT /F2 8 Tf 275 412 Td (3) Tj /F1 7 Tf 260 402 Td (10:00-10:50) Tj ET',
    'BT /F2 8 Tf 345 412 Td (4) Tj /F1 7 Tf 330 402 Td (10:50-11:40) Tj ET',
    'BT /F2 8 Tf 405 407 Td (Lunch Break) Tj ET',
    'BT /F2 8 Tf 485 412 Td (5) Tj /F1 7 Tf 470 402 Td (12:20-01:05) Tj ET',
    'BT /F2 8 Tf 555 412 Td (6) Tj /F1 7 Tf 540 402 Td (01:05-01:50) Tj ET',
    'BT /F2 8 Tf 625 412 Td (7) Tj /F1 7 Tf 610 402 Td (02:00-02:45) Tj ET',
    'BT /F2 8 Tf 695 412 Td (8) Tj /F1 7 Tf 680 402 Td (02:45-03:30) Tj ET',

    // Rows for Day Orders
    // Day I
    'q 0.5 w 40 362 762 33 re S Q',
    'BT /F2 9 Tf 65 375 Td (I) Tj ET',
    'BT /F1 8 Tf 130 375 Td (-) Tj ET',
    'BT /F1 8 Tf 200 375 Td (-) Tj ET',
    'BT /F2 8 Tf 265 378 Td (PE-V) Tj /F1 7 Tf 265 368 Td (IV-CSE-A) Tj ET',
    'BT /F1 8 Tf 340 375 Td (-) Tj ET',
    'BT /F1 7 Tf 405 375 Td (LUNCH) Tj ET',
    'BT /F1 8 Tf 480 375 Td (-) Tj ET',
    'BT /F2 8 Tf 545 378 Td (SPM) Tj /F1 7 Tf 545 368 Td (IV-CSE-A) Tj ET',
    'BT /F1 8 Tf 620 375 Td (-) Tj ET',
    'BT /F1 8 Tf 690 375 Td (-) Tj ET',

    // Day II
    'q 0.5 w 40 329 762 33 re S Q',
    'BT /F2 9 Tf 63 342 Td (II) Tj ET',
    'BT /F1 8 Tf 130 342 Td (-) Tj ET',
    'BT /F1 8 Tf 200 342 Td (-) Tj ET',
    'BT /F1 8 Tf 270 342 Td (-) Tj ET',
    'BT /F2 8 Tf 335 345 Td (SPM) Tj /F1 7 Tf 335 335 Td (IV-CSE-A) Tj ET',
    'BT /F1 7 Tf 405 342 Td (LUNCH) Tj ET',
    'BT /F1 8 Tf 480 342 Td (-) Tj ET',
    'BT /F1 8 Tf 550 342 Td (-) Tj ET',
    'BT /F1 8 Tf 620 342 Td (-) Tj ET',
    'BT /F2 8 Tf 685 345 Td (PE-V) Tj /F1 7 Tf 685 335 Td (IV-CSE-A) Tj ET',

    // Day III
    'q 0.5 w 40 296 762 33 re S Q',
    'BT /F2 9 Tf 61 309 Td (III) Tj ET',
    'BT /F1 8 Tf 130 309 Td (-) Tj ET',
    'BT /F2 8 Tf 195 312 Td (SPM) Tj /F1 7 Tf 195 302 Td (IV-CSE-A) Tj ET',
    'BT /F1 8 Tf 270 309 Td (-) Tj ET',
    'BT /F1 8 Tf 340 309 Td (-) Tj ET',
    'BT /F1 7 Tf 405 309 Td (LUNCH) Tj ET',
    'BT /F1 8 Tf 480 309 Td (-) Tj ET',
    'BT /F1 8 Tf 550 309 Td (-) Tj ET',
    'BT /F1 8 Tf 620 309 Td (-) Tj ET',
    'BT /F1 8 Tf 690 309 Td (-) Tj ET',

    // Day IV
    'q 0.5 w 40 263 762 33 re S Q',
    'BT /F2 9 Tf 62 276 Td (IV) Tj ET',
    'BT /F2 8 Tf 120 279 Td (PE-V LAB) Tj /F1 7 Tf 120 269 Td (Bay 3) Tj ET',
    'BT /F2 8 Tf 190 279 Td (PE-V LAB) Tj /F1 7 Tf 190 269 Td (Bay 3) Tj ET',
    'BT /F1 8 Tf 270 276 Td (-) Tj ET',
    'BT /F1 8 Tf 340 276 Td (-) Tj ET',
    'BT /F1 7 Tf 405 276 Td (LUNCH) Tj ET',
    'BT /F1 8 Tf 480 276 Td (-) Tj ET',
    'BT /F2 8 Tf 545 279 Td (SPM) Tj /F1 7 Tf 545 269 Td (IV-CSE-A) Tj ET',
    'BT /F1 8 Tf 620 276 Td (-) Tj ET',
    'BT /F1 8 Tf 690 276 Td (-) Tj ET',

    // Day V
    'q 0.5 w 40 230 762 33 re S Q',
    'BT /F2 9 Tf 65 243 Td (V) Tj ET',
    'BT /F1 8 Tf 130 243 Td (-) Tj ET',
    'BT /F1 8 Tf 200 243 Td (-) Tj ET',
    'BT /F1 8 Tf 270 243 Td (-) Tj ET',
    'BT /F2 8 Tf 335 246 Td (PE-V) Tj /F1 7 Tf 335 236 Td (IV-CSE-A) Tj ET',
    'BT /F1 7 Tf 405 243 Td (LUNCH) Tj ET',
    'BT /F1 8 Tf 480 243 Td (-) Tj ET',
    'BT /F2 8 Tf 545 246 Td (SPM) Tj /F1 7 Tf 545 236 Td (IV-CSE-A) Tj ET',
    'BT /F1 8 Tf 620 243 Td (-) Tj ET',
    'BT /F1 8 Tf 690 243 Td (-) Tj ET',

    // Subject Details section
    'BT /F2 10 Tf 50 205 Td (Subject Details) Tj ET',
    'BT /F1 9 Tf 50 188 Td (* Sub-1: 231CB721 - Software Project Management (SPM) | Sem/Sec: IV-CSE-A | Branch: CSE) Tj ET',
    'BT /F1 9 Tf 50 173 Td (* Sub-2: 231CSV46 - Professional Elective - V (Network Security) | Sem/Sec: IV-CSE-A | Branch: CSE) Tj ET',
    'BT /F1 9 Tf 50 158 Td (* Lab-1: 231CSV46 - Network Security Laboratory (Bay 3) | Sem/Sec: IV-CSE-A | Branch: CSE) Tj ET',
    'BT /F1 9 Tf 50 143 Td (* Proj-1: 231CS77A - Project Work (Phase - I) | Sem/Sec: IV-CSE-A | Branch: CSE) Tj ET',

    // Signatures
    'BT /F2 9 Tf 50 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 50 60 Td (Faculty Signature: Dr. M. Victor Jose) Tj ET',

    'BT /F2 9 Tf 330 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 350 60 Td (Timetable Coordinator) Tj ET',

    'BT /F2 9 Tf 610 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 620 60 Td (Head of the Department (HOD)) Tj ET',
  ];

  return lines.join('\n');
}

// 2. Generate Master Class Timetable Template (covering class structure)
function generateMasterClassTemplateContent() {
  const lines = [
    // Header
    'BT /F2 14 Tf 180 560 Td (VEL TECH MULTI TECH Dr.RANGARAJAN Dr.SAKUNTHALA ENGINEERING COLLEGE) Tj ET',
    'BT /F1 10 Tf 260 545 Td ((An Autonomous Institution - Affiliated to Anna University, Chennai)) Tj ET',
    'BT /F2 12 Tf 230 530 Td (DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING) Tj ET',
    'BT /F2 13 Tf 270 512 Td (ODD SEMESTER-TIME TABLE (2025 - 2026)) Tj ET',

    // Details box
    'q 0.5 w 40 440 762 60 re S Q',
    'BT /F2 10 Tf 50 482 Td (Class Information) Tj ET',
    'BT /F2 9 Tf 50 465 Td (Department: ) Tj /F1 9 Tf (Computer Science and Engineering) Tj ET',
    'BT /F2 9 Tf 260 465 Td (Year: ) Tj /F1 9 Tf (II) Tj ET',
    'BT /F2 9 Tf 380 465 Td (Semester: ) Tj /F1 9 Tf (3) Tj ET',
    'BT /F2 9 Tf 500 465 Td (Section: ) Tj /F1 9 Tf (A) Tj ET',
    'BT /F2 9 Tf 630 465 Td (Class ID: ) Tj /F1 9 Tf (II-CSE-A) Tj ET',

    'BT /F2 9 Tf 50 448 Td (Room No: ) Tj /F1 9 Tf (N 201) Tj ET',
    'BT /F2 9 Tf 260 448 Td (Class Advisor: ) Tj /F1 9 Tf (Ms A Vinothini) Tj ET',
    'BT /F2 9 Tf 500 448 Td (Total Periods/Week: ) Tj /F1 9 Tf (40 Periods) Tj ET',

    // Grid Table Header
    'q 0.5 w 40 230 762 195 re S Q',
    'q 0.9 0.92 0.95 rg 40 395 762 30 re f Q',
    'q 0.5 w 40 395 762 30 re S Q',

    // Column headers
    'BT /F2 8 Tf 45 407 Td (Day Order (DO)) Tj ET',
    'BT /F2 8 Tf 135 412 Td (1) Tj /F1 7 Tf 120 402 Td (08:05-08:55) Tj ET',
    'BT /F2 8 Tf 205 412 Td (2) Tj /F1 7 Tf 190 402 Td (08:55-09:45) Tj ET',
    'BT /F2 8 Tf 275 412 Td (3) Tj /F1 7 Tf 260 402 Td (10:00-10:50) Tj ET',
    'BT /F2 8 Tf 345 412 Td (4) Tj /F1 7 Tf 330 402 Td (10:50-11:40) Tj ET',
    'BT /F2 8 Tf 405 407 Td (Lunch Break) Tj ET',
    'BT /F2 8 Tf 485 412 Td (5) Tj /F1 7 Tf 470 402 Td (12:20-01:05) Tj ET',
    'BT /F2 8 Tf 555 412 Td (6) Tj /F1 7 Tf 540 402 Td (01:05-01:50) Tj ET',
    'BT /F2 8 Tf 625 412 Td (7) Tj /F1 7 Tf 610 402 Td (02:00-02:45) Tj ET',
    'BT /F2 8 Tf 695 412 Td (8) Tj /F1 7 Tf 680 402 Td (02:45-03:30) Tj ET',

    // Rows
    'q 0.5 w 40 362 762 33 re S Q',
    'BT /F2 9 Tf 65 375 Td (I) Tj ET',
    'BT /F2 7 Tf 115 375 Td (DS/DPCO LAB) Tj ET',
    'BT /F2 7 Tf 185 375 Td (DS/DPCO LAB) Tj ET',
    'BT /F2 8 Tf 270 375 Td (OOPS) Tj ET',
    'BT /F2 8 Tf 345 375 Td (SE) Tj ET',
    'BT /F1 7 Tf 405 375 Td (LUNCH) Tj ET',
    'BT /F2 7 Tf 465 375 Td (SE LAB (Bay 3)) Tj ET',
    'BT /F2 7 Tf 535 375 Td (SE LAB (Bay 3)) Tj ET',
    'BT /F2 8 Tf 620 375 Td (DPCO) Tj ET',
    'BT /F2 8 Tf 690 375 Td (OS) Tj ET',

    'q 0.5 w 40 329 762 33 re S Q',
    'BT /F2 9 Tf 63 342 Td (II) Tj ET',
    'BT /F2 8 Tf 135 342 Td (DS) Tj ET',
    'BT /F2 8 Tf 200 342 Td (OOPS) Tj ET',
    'BT /F2 7 Tf 255 342 Td (DS/DPCO LAB) Tj ET',
    'BT /F2 7 Tf 325 342 Td (DS/DPCO LAB) Tj ET',
    'BT /F1 7 Tf 405 342 Td (LUNCH) Tj ET',
    'BT /F2 8 Tf 480 342 Td (PQT) Tj ET',
    'BT /F2 8 Tf 545 342 Td (LIBRARY) Tj ET',
    'BT /F2 8 Tf 625 342 Td (OS) Tj ET',
    'BT /F2 8 Tf 690 342 Td (SE) Tj ET',

    'q 0.5 w 40 296 762 33 re S Q',
    'BT /F2 9 Tf 61 309 Td (III) Tj ET',
    'BT /F2 8 Tf 130 309 Td (PQT) Tj ET',
    'BT /F2 8 Tf 200 309 Td (OOPS) Tj ET',
    'BT /F2 8 Tf 270 309 Td (DPCO) Tj ET',
    'BT /F2 8 Tf 345 309 Td (SE) Tj ET',
    'BT /F1 7 Tf 405 309 Td (LUNCH) Tj ET',
    'BT /F2 7 Tf 465 309 Td (OS/OOPS LAB) Tj ET',
    'BT /F2 7 Tf 535 309 Td (OS/OOPS LAB) Tj ET',
    'BT /F2 8 Tf 615 309 Td (SPORTS) Tj ET',
    'BT /F2 8 Tf 685 309 Td (SPORTS) Tj ET',

    'q 0.5 w 40 263 762 33 re S Q',
    'BT /F2 9 Tf 62 276 Td (IV) Tj ET',
    'BT /F2 8 Tf 130 276 Td (PPT) Tj ET',
    'BT /F2 8 Tf 205 276 Td (SE) Tj ET',
    'BT /F2 8 Tf 270 276 Td (OOPS) Tj ET',
    'BT /F2 8 Tf 345 276 Td (DS) Tj ET',
    'BT /F1 7 Tf 405 276 Td (LUNCH) Tj ET',
    'BT /F2 8 Tf 480 276 Td (OS) Tj ET',
    'BT /F2 8 Tf 550 276 Td (PQT) Tj ET',
    'BT /F2 8 Tf 620 276 Td (DPCO) Tj ET',
    'BT /F2 8 Tf 690 276 Td (DPCO) Tj ET',

    'q 0.5 w 40 230 762 33 re S Q',
    'BT /F2 9 Tf 65 243 Td (V) Tj ET',
    'BT /F2 8 Tf 125 243 Td (DPCO) Tj ET',
    'BT /F2 8 Tf 205 243 Td (DS) Tj ET',
    'BT /F2 7 Tf 255 243 Td (OS/OOPS LAB) Tj ET',
    'BT /F2 7 Tf 325 243 Td (OS/OOPS LAB) Tj ET',
    'BT /F1 7 Tf 405 243 Td (LUNCH) Tj ET',
    'BT /F2 8 Tf 480 243 Td (OS) Tj ET',
    'BT /F2 8 Tf 550 243 Td (DS) Tj ET',
    'BT /F2 7 Tf 605 243 Td (PQT LAB (Bay 4)) Tj ET',
    'BT /F2 7 Tf 675 243 Td (PQT LAB (Bay 4)) Tj ET',

    // Subject mapping
    'BT /F2 10 Tf 50 205 Td (Subject Distribution) Tj ET',
    'BT /F1 9 Tf 50 188 Td (* 231CS301: Data Structures (DS) - Ms A Vinothini | 4 Hours) Tj ET',
    'BT /F1 9 Tf 50 173 Td (* 231CS302: Operating Systems (OS) - Ms D Parkavi | 4 Hours) Tj ET',
    'BT /F1 9 Tf 50 158 Td (* 231CS303: Software Engineering (SE) - Ms Yerakkamma | 4 Hours) Tj ET',
    'BT /F1 9 Tf 50 143 Td (* 231CS304: Object Oriented Programming (OOPS) - Ms Sandhiya Sree | 4 Hours) Tj ET',

    // Signatures
    'BT /F2 9 Tf 50 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 70 60 Td (Class Advisor) Tj ET',

    'BT /F2 9 Tf 330 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 350 60 Td (Timetable Coordinator) Tj ET',

    'BT /F2 9 Tf 610 75 Td (________________________________) Tj ET',
    'BT /F2 9 Tf 620 60 Td (Head of the Department (HOD)) Tj ET',
  ];

  return lines.join('\n');
}

const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write individual template PDF
const indBuf = createPdfBuffer([generateIndividualTemplateContent()]);
fs.writeFileSync(path.join(templatesDir, 'individual-faculty-timetable-template.pdf'), indBuf);
console.log('Created individual-faculty-timetable-template.pdf, size:', indBuf.length);

// Write master class template PDF
const masterBuf = createPdfBuffer([generateMasterClassTemplateContent()]);
fs.writeFileSync(path.join(templatesDir, 'master-class-timetable-template.pdf'), masterBuf);
console.log('Created master-class-timetable-template.pdf, size:', masterBuf.length);
