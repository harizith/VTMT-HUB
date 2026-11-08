const fs = require('fs');
const path = require('path');
const { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  TextRun, 
  HeadingLevel, 
  WidthType, 
  AlignmentType, 
  BorderStyle, 
  ShadingType,
  VerticalAlign
} = require('docx');

async function createOfficialPdfStyleDocxTemplate() {
  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "64748B",
  };

  const borders = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
    insideHorizontal: thinBorder,
    insideVertical: thinBorder,
  };

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: "FFFFFF",
  };

  const cellMargins = { top: 100, bottom: 100, left: 100, right: 100 };

  // Period timings
  const periodHeaders = [
    { num: "Day Order", time: "(DO)", width: 12 },
    { num: "1", time: "08:05-08:55", width: 10 },
    { num: "2", time: "08:55-09:45", width: 10 },
    { num: "3", time: "10:00-10:50", width: 10 },
    { num: "4", time: "10:50-11:40", width: 10 },
    { num: "Lunch Break", time: "11:40-12:20", width: 8 },
    { num: "5", time: "12:20-01:05", width: 10 },
    { num: "6", time: "01:05-01:50", width: 10 },
    { num: "7", time: "02:00-02:45", width: 10 },
    { num: "8", time: "02:45-03:30", width: 10 },
  ];

  // 1. Grid Header Row
  const gridHeaderRow = new TableRow({
    tableHeader: true,
    children: periodHeaders.map(ph => new TableCell({
      width: { size: ph.width, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: "1E3A8A" }, // Royal blue header like PDF
      verticalAlign: VerticalAlign.CENTER,
      margins: cellMargins,
      borders,
      children: [
        new Paragraph({
          children: [new TextRun({ text: ph.num, bold: true, color: "FFFFFF", size: 16 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: ph.time, color: "E2E8F0", size: 13 })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    })),
  });

  // Sample schedule rows exactly mirroring the individual faculty timetable
  const days = [
    {
      do: "I",
      slots: [
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "PE-V", sub: "IV-CSE-A" },
        { text: "-", sub: "" },
        { text: "LUNCH", sub: "" },
        { text: "-", sub: "" },
        { text: "SPM", sub: "IV-CSE-A" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
      ]
    },
    {
      do: "II",
      slots: [
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "SPM", sub: "IV-CSE-A" },
        { text: "LUNCH", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "PE-V", sub: "IV-CSE-A" },
      ]
    },
    {
      do: "III",
      slots: [
        { text: "-", sub: "" },
        { text: "SPM", sub: "IV-CSE-A" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "LUNCH", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
      ]
    },
    {
      do: "IV",
      slots: [
        { text: "PE-V LAB", sub: "Bay 3" },
        { text: "PE-V LAB", sub: "Bay 3" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "LUNCH", sub: "" },
        { text: "-", sub: "" },
        { text: "SPM", sub: "IV-CSE-A" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
      ]
    },
    {
      do: "V",
      slots: [
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
        { text: "PE-V", sub: "IV-CSE-A" },
        { text: "LUNCH", sub: "" },
        { text: "-", sub: "" },
        { text: "SPM", sub: "IV-CSE-A" },
        { text: "-", sub: "" },
        { text: "-", sub: "" },
      ]
    },
  ];

  const gridRows = days.map((day, rIdx) => new TableRow({
    children: [
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
        verticalAlign: VerticalAlign.CENTER,
        margins: cellMargins,
        borders,
        children: [
          new Paragraph({
            children: [new TextRun({ text: day.do, bold: true, color: "0F172A", size: 18 })],
            alignment: AlignmentType.CENTER,
          })
        ],
      }),
      ...day.slots.map(s => new TableCell({
        width: { size: s.text === "LUNCH" ? 8 : 10, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: s.text === "LUNCH" ? "F8FAFC" : rIdx % 2 === 0 ? "FFFFFF" : "F8FAFC" },
        verticalAlign: VerticalAlign.CENTER,
        margins: cellMargins,
        borders,
        children: [
          new Paragraph({
            children: [
              new TextRun({ 
                text: s.text, 
                bold: s.text !== "-", 
                color: s.text === "-" ? "94A3B8" : s.text === "LUNCH" ? "64748B" : "1E40AF", 
                size: 16 
              })
            ],
            alignment: AlignmentType.CENTER,
          }),
          ...(s.sub ? [
            new Paragraph({
              children: [new TextRun({ text: s.sub, color: "475569", size: 13, italics: true })],
              alignment: AlignmentType.CENTER,
            })
          ] : [])
        ],
      }))
    ],
  }));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 540, bottom: 540, left: 540, right: 540 },
          size: { orientation: "landscape" }
        }
      },
      children: [
        // College Header
        new Paragraph({
          children: [
            new TextRun({ 
              text: "VEL TECH MULTI TECH Dr.RANGARAJAN Dr.SAKUNTHALA ENGINEERING COLLEGE", 
              bold: true, 
              size: 22,
              color: "1E3A8A"
            })
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "(An Autonomous Institution - Affiliated to Anna University, Chennai)", 
              italics: true, 
              size: 16,
              color: "475569" 
            })
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", 
              bold: true, 
              size: 18,
              color: "0F172A" 
            })
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "INDIVIDUAL TIME TABLE / CLASS TIME TABLE", 
              bold: true, 
              size: 20, 
              color: "2563EB" 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),

        // Metadata box (Matching PDF exactly)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Name of the Faculty: ", bold: true, size: 16 }),
                        new TextRun({ text: "Dr. M. Victor Jose    ", size: 16 }),
                        new TextRun({ text: "MTS No: ", bold: true, size: 16 }),
                        new TextRun({ text: "2014    ", size: 16 }),
                        new TextRun({ text: "Designation: ", bold: true, size: 16 }),
                        new TextRun({ text: "Associate Professor    ", size: 16 }),
                        new TextRun({ text: "Total hours per week: ", bold: true, size: 16 }),
                        new TextRun({ text: "16 hrs", size: 16 }),
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Department: ", bold: true, size: 16 }),
                        new TextRun({ text: "Computer Science and Engineering    ", size: 16 }),
                        new TextRun({ text: "Academic Year: ", bold: true, size: 16 }),
                        new TextRun({ text: "2025 - 2026 (Odd Sem)", size: 16 }),
                      ],
                      spacing: { before: 50 },
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ text: "", spacing: { after: 100 } }),

        // Timetable Grid (Identical to PDF layout)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [gridHeaderRow, ...gridRows],
        }),

        new Paragraph({ text: "", spacing: { after: 120 } }),

        // Subject Details Section
        new Paragraph({
          children: [
            new TextRun({ text: "Subject Details / Course Mapping:", bold: true, size: 17, color: "0F172A" })
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Sub-1: 231CB721 - Software Project Management (SPM) | Sem/Sec: IV-CSE-A | Room: N-201", size: 15, color: "334155" })
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Sub-2: 231CSV46 - Professional Elective - V (Network Security) (PE-V) | Sem/Sec: IV-CSE-A | Room: N-201", size: 15, color: "334155" })
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Lab-1: 231CSV46 - Network Security Laboratory (PE-V LAB) | Sem/Sec: IV-CSE-A | Bay 3", size: 15, color: "334155" })
          ],
          spacing: { after: 180 },
        }),

        // Signatures (Matching PDF footer)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "___________________________", color: "94A3B8" })],
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "Faculty Signature", bold: true, size: 15 })],
                      alignment: AlignmentType.CENTER,
                    })
                  ]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "___________________________", color: "94A3B8" })],
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "Timetable Coordinator", bold: true, size: 15 })],
                      alignment: AlignmentType.CENTER,
                    })
                  ]
                }),
                new TableCell({
                  borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "___________________________", color: "94A3B8" })],
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "Head of the Department (HOD)", bold: true, size: 15 })],
                      alignment: AlignmentType.CENTER,
                    })
                  ]
                })
              ]
            })
          ]
        })
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'public', 'templates', 'timetable-import-template.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Generated official PDF-formatted Word template successfully at:', outPath, 'size:', buffer.length);
}

createOfficialPdfStyleDocxTemplate().catch(console.error);
