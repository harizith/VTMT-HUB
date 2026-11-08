/**
 * Comprehensive Parser for College Timetable Word Documents (.docx / .doc)
 * 
 * Supports:
 * 1. Multi-Faculty Individual Timetable Packets (e.g. 33 Faculty sections in one docx,
 *    each containing Faculty Info header, Day Order vs Periods 1-8 matrix with merged cells,
 *    and Sub-1 / Lab-1 / Sub-2 / Sub-3 with Sem/Sec mapping tables).
 * 2. Class Master Timetable Period Grid Matrix (DO in rows, Periods 1-8 in cols).
 * 3. Traditional tabular lists (Class ID, Day Order, Period, Subject Code, Subject Name, Faculty Name, Room No).
 */

import mammoth from "mammoth";

export interface ParsedDocTimetableSlot {
  classId: string | null;
  dayOrder: string | null;
  period: number | null;
  timeRange: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  facultyName: string | null;
  vmsNo?: string | null;
  roomNo: string | null;
  category?: string | null;
  semType?: string | null;
}

const DEFAULT_TIMINGS: Record<number, string> = {
  1: "08:05 - 08:55",
  2: "08:55 - 09:45",
  3: "10:00 - 10:50",
  4: "10:50 - 11:40",
  5: "12:20 - 01:05",
  6: "01:05 - 01:50",
  7: "02:00 - 02:45",
  8: "02:45 - 03:30",
};

const HEADER_ALIASES: Record<string, string[]> = {
  classId: ["class", "classid", "classidentifier", "section"],
  dayOrder: ["day", "dayorder", "day_order"],
  period: ["period", "slot", "periodno"],
  timeRange: ["time", "timerange", "timing", "time_range"],
  subjectCode: ["code", "subjectcode", "coursecode", "subject_code"],
  subjectName: ["subject", "subjectname", "coursename", "subject_name"],
  facultyName: ["faculty", "facultyname", "teacher", "teachername", "instructor", "faculty_name"],
  vmsNo: ["vmsno", "vmno", "staffid", "facultynumber", "mtsno", "vms_no"],
  roomNo: ["room", "roomno", "classroom", "room_no"],
  category: ["category", "subjectcategory", "subject_category", "type"],
  semType: ["semtype", "sem", "semester", "semestertype"],
};

const HEADER_BY_ALIAS = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) => aliases.map((alias) => [alias, field]))
);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseDay(value: string | undefined | null): string | null {
  const raw = String(value ?? "").trim().toUpperCase().replace(/^DAY\s+/, "");
  if (!raw) return null;
  const numberToRoman: Record<string, string> = { "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V" };
  const day = numberToRoman[raw] || raw;
  return ["I", "II", "III", "IV", "V"].includes(day) ? day : (value ? String(value).trim() : null);
}

function parsePeriod(value: string | undefined | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const period = Number.parseInt(match[0], 10);
  return period >= 1 && period <= 8 ? period : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Standardize academic year / semester notation to normalized class identifier
 * e.g., "III / C" -> "II-CSE-C" (3rd Sem = 2nd Year)
 * "VII / A" -> "IV-CSE-A" (7th Sem = 4th Year)
 * "V / B" -> "III-CSE-B" (5th Sem = 3rd Year)
 */
function normalizeClassString(rawSec: string, fallbackDept = "CSE"): string | null {
  if (!rawSec) return null;
  const clean = rawSec.trim();

  // If already full format like "II-CSE-A" or "IV-CSE-C"
  if (/^[I|V|X]+-[A-Z]+-[A-Z0-9]+$/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Matches "III / C", "VII/A", "V / A,B,C", "3 / A", "III /A"
  const match = clean.match(/^([I|V|X]+|[1-8])\s*[\/-]?\s*([A-Za-z0-9,\s]+)?$/i);
  if (match) {
    const semOrYear = match[1].toUpperCase();
    let secPart = (match[2] || "").trim().toUpperCase();
    if (secPart.includes(",")) {
      secPart = secPart.split(",")[0].trim();
    }
    const section = secPart || "A";

    // Convert semester to Year Roman
    let yearPrefix = semOrYear;
    if (semOrYear === "1" || semOrYear === "2" || semOrYear === "I") yearPrefix = "I";
    else if (semOrYear === "3" || semOrYear === "4" || semOrYear === "II" || semOrYear === "III") yearPrefix = (semOrYear === "III" || semOrYear === "3" || semOrYear === "4") ? "II" : semOrYear;
    else if (semOrYear === "5" || semOrYear === "6" || semOrYear === "V") yearPrefix = "III";
    else if (semOrYear === "7" || semOrYear === "8" || semOrYear === "VII") yearPrefix = "IV";

    return `${yearPrefix}-${fallbackDept}-${section}`;
  }

  return clean;
}

/**
 * Extract embedded room / lab / bay from slot cell string
 */
function extractRoomFromText(text: string): { roomNo: string | null; cleanedText: string } {
  let roomNo: string | null = null;
  let cleaned = text;

  // Patterns: (Bay 4), (Research Lab), (Seminar Hall), BAY 3, I305/ I306, N201 / N202, LH-201, CS-LAB-1
  const patterns = [
    /\((Research\s*Lab|Seminar\s*Hall|Bay\s*\d+|LH[-\s]*\d+|CS[-\s]*LAB[-\s]*\d+)\)/i,
    /\b(Bay\s*\d+|BAY\s*\d+|Research\s*Lab|Seminar\s*Hall|LH[-\s]*\d+|N\d{3}\s*\/\s*N\d{3}|I\d{3}\s*\/\s*I\d{3})\b/i,
  ];

  for (const regex of patterns) {
    const m = cleaned.match(regex);
    if (m) {
      roomNo = m[1].replace(/\s+/g, " ").trim();
      cleaned = cleaned.replace(m[0], "").replace(/\(\s*\)/g, "").trim();
      break;
    }
  }

  // Check if "LAB" in cleaned text -> default to Lab room if none found
  if (!roomNo) {
    if (cleaned.toUpperCase().includes("LAB")) {
      roomNo = "CS-LAB-1";
    }
  }

  return { roomNo, cleanedText: cleaned };
}

/**
 * Extract embedded section or class from text (e.g. "AIML LAB SEC B", "PPT SEC B", "LIB II-B", "LIB III A SEC")
 */
function extractSectionFromText(text: string): { classId: string | null; cleanedText: string } {
  let classId: string | null = null;
  let cleaned = text;

  // Pattern: "SEC B", "SEC C", "Sec B", "A Sec", "B Sec"
  const secMatch = cleaned.match(/\b(?:SEC\s*([A-C])|([A-C])\s*SEC)\b/i);
  if (secMatch) {
    const secLetter = (secMatch[1] || secMatch[2]).toUpperCase();
    cleaned = cleaned.replace(secMatch[0], "").trim();
    classId = `II-CSE-${secLetter}`; // Default to Year II if no year specified
  }

  // Pattern: "LIB II-B", "LIB II-A", "LIB III-B", "LIB –II A"
  const libMatch = cleaned.match(/LIB\s*[-–]?\s*([I|V|X]+|[1-4])\s*[-–\s]?\s*([A-C])/i);
  if (libMatch) {
    const yr = libMatch[1].toUpperCase();
    const sec = libMatch[2].toUpperCase();
    classId = `${yr}-CSE-${sec}`;
  }

  // Pattern: "PPT-B", "PPT- C", "PPT- A Sec"
  const pptMatch = cleaned.match(/PPT\s*[-–]?\s*([A-C])(?:\s*SEC)?/i);
  if (pptMatch) {
    const sec = pptMatch[1].toUpperCase();
    classId = `II-CSE-${sec}`;
  }

  return { classId, cleanedText: cleaned };
}

/**
 * Parses full 2D HTML table handling rowspans and colspans accurately
 */
function parseHtmlTableMatrix(tableHtml: string): {
  grid: { rawText: string; isOrigin: boolean }[][];
  periodCols: Record<number, number>;
  dayRows: { dayOrder: string; r: number }[];
} {
  const trMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const grid: { rawText: string; isOrigin: boolean }[][] = [];

  for (let r = 0; r < trMatches.length; r++) {
    if (!grid[r]) grid[r] = [];
    const cellMatches = trMatches[r].match(/<(td|th)[\s\S]*?<\/(td|th)>/gi) || [];

    let currentC = 0;
    for (const cellHtml of cellMatches) {
      while (grid[r][currentC] !== undefined) {
        currentC++;
      }

      const colspanMatch = cellHtml.match(/colspan=["']?(\d+)["']?/i);
      const rowspanMatch = cellHtml.match(/rowspan=["']?(\d+)["']?/i);
      const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;
      const rowspan = rowspanMatch ? parseInt(rowspanMatch[1], 10) : 1;

      const text = cellHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      for (let ro = 0; ro < rowspan; ro++) {
        const targetR = r + ro;
        if (!grid[targetR]) grid[targetR] = [];
        for (let co = 0; co < colspan; co++) {
          grid[targetR][currentC + co] = {
            rawText: text,
            isOrigin: (ro === 0 && co === 0),
          };
        }
      }
      currentC += colspan;
    }
  }

  // Identify Period Columns 1..8
  const periodCols: Record<number, number> = {};
  for (let r = 0; r < Math.min(2, grid.length); r++) {
    for (let c = 0; c < (grid[r] || []).length; c++) {
      const val = grid[r][c]?.rawText || "";
      const match = val.match(/^([1-8])$/);
      if (match) {
        const p = parseInt(match[1], 10);
        if (periodCols[p] === undefined) {
          periodCols[p] = c;
        }
      }
    }
  }

  // Identify Day Order rows (I, II, III, IV, V)
  const dayRows: { dayOrder: string; r: number }[] = [];
  for (let r = 0; r < grid.length; r++) {
    const firstCell = grid[r][0]?.rawText || "";
    if (["I", "II", "III", "IV", "V"].includes(firstCell.toUpperCase())) {
      dayRows.push({ dayOrder: firstCell.toUpperCase(), r });
    }
  }

  return { grid, periodCols, dayRows };
}

/**
 * Main parser entry point for .docx/.doc timetable buffers
 */
export async function parseTimetableDocBuffer(buffer: Buffer): Promise<{
  allSlots: ParsedDocTimetableSlot[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  let result: { value: string; messages: any[] };
  try {
    result = await mammoth.convertToHtml({ buffer });
  } catch (err: any) {
    throw new Error(`Failed to read Word document: ${err.message || "Invalid or encrypted document format"}`);
  }

  const html = result.value;
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];

  if (tableMatches.length === 0) {
    throw new Error("No tables found in Word document.");
  }

  const allSlots: ParsedDocTimetableSlot[] = [];

  // 1. Check if document has Multi-Faculty Individual Timetable structure (contains "Name of the Faculty")
  const facultyIndices: number[] = [];
  for (let i = 0; i < tableMatches.length; i++) {
    if (tableMatches[i].includes("Name of the Faculty")) {
      facultyIndices.push(i);
    }
  }

  if (facultyIndices.length > 0) {
    // Process Each Faculty's Timetable Section
    for (let fIdx = 0; fIdx < facultyIndices.length; fIdx++) {
      const headerTableIdx = facultyIndices[fIdx];
      const nextHeaderIdx = fIdx + 1 < facultyIndices.length ? facultyIndices[fIdx + 1] : tableMatches.length;

      const headerTable = tableMatches[headerTableIdx];
      let gridTable = "";
      let subjectTable = "";

      for (let t = headerTableIdx + 1; t < nextHeaderIdx; t++) {
        const tHtml = tableMatches[t];
        if (!gridTable && (tHtml.includes("DO") || tHtml.includes(">1<") || tHtml.includes("8.05"))) {
          gridTable = tHtml;
        } else if (!subjectTable && (tHtml.includes("Sub-1") || tHtml.includes("Sem / Sec") || tHtml.includes("Branch"))) {
          subjectTable = tHtml;
        }
      }

      // 1. Extract Faculty Details
      const nameMatch = headerTable.match(/Name of the Faculty:[\s\S]*?<strong>([^<]+)<\/strong>/i) ||
                        headerTable.match(/Name of the Faculty:[\s\S]*?<p>([^<]+)<\/p>/i) ||
                        headerTable.match(/Name of the Faculty:[\s\S]*?<td>([^<]+)<\/td>/i);
      const facultyName = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : `Faculty ${fIdx + 1}`;

      const mtsMatch = headerTable.match(/MTS No:[\s\S]*?<strong>([^<]+)<\/strong>/i) ||
                       headerTable.match(/MTS No:[\s\S]*?<p>([^<]+)<\/p>/i) ||
                       headerTable.match(/MTS No:[\s\S]*?<td>([^<]+)<\/td>/i);
      let vmsNo = mtsMatch ? mtsMatch[1].replace(/<[^>]+>/g, "").trim() : "";
      if (vmsNo.toLowerCase().includes("designation")) vmsNo = "";

      // 2. Extract Subject and Class Mapping from Subject Table (Sub-1, Lab-1, Sub-2, Sub-3)
      const facultySubjectMap = new Map<string, { code?: string; name: string; classId?: string; room?: string }>();
      let dominantClassId: string | null = null;

      if (subjectTable) {
        const trs = subjectTable.match(/<tr[\s\S]*?<\/tr>/gi) || [];
        const parsedRows = trs.map((tr) => {
          const tds = tr.match(/<(td|th)[\s\S]*?<\/(td|th)>/gi) || [];
          return tds.map((td) => td.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
        });

        if (parsedRows.length >= 4) {
          const subNames = parsedRows[1] || [];
          const semSecs = parsedRows[3] || [];

          for (let c = 0; c < subNames.length; c++) {
            const rawSub = subNames[c];
            const rawSec = semSecs[c] || "";
            if (!rawSub) continue;

            const normalizedClass = normalizeClassString(rawSec);
            if (!dominantClassId && normalizedClass) dominantClassId = normalizedClass;

            const keyFull = rawSub.toUpperCase().trim();
            facultySubjectMap.set(keyFull, { name: rawSub, classId: normalizedClass || undefined });

            // Also map primary keyword/acronym (e.g., "ESIOT", "SPM", "AIML", "CD", "DS")
            const firstToken = rawSub.split(/[\s-]+/)[0].toUpperCase();
            if (firstToken && firstToken.length > 1) {
              facultySubjectMap.set(firstToken, { name: rawSub, classId: normalizedClass || undefined });
            }
          }
        }
      }

      if (!gridTable) {
        warnings.push(`Faculty "${facultyName}" had no recognizable period matrix grid.`);
        continue;
      }

      // 3. Parse Period Grid Matrix with 2D spanning
      const { grid, periodCols, dayRows } = parseHtmlTableMatrix(gridTable);

      let facultySlotCount = 0;
      for (const { dayOrder, r } of dayRows) {
        for (let p = 1; p <= 8; p++) {
          const colIdx = periodCols[p];
          if (colIdx === undefined) continue;

          const cellObj = grid[r][colIdx];
          if (!cellObj) continue;

          const rawText = cellObj.rawText;
          if (!rawText || rawText === "-" || rawText === "—") continue;

          const textUpper = rawText.toUpperCase();
          if (
            textUpper === "LUNCH" ||
            textUpper === "BREAK" ||
            textUpper.includes("LUNCH BREAK") ||
            textUpper.includes("FN BREAK") ||
            textUpper.includes("AN BREAK")
          ) {
            continue;
          }

          // Extract room and section information embedded in the cell
          const { roomNo: extractedRoom, cleanedText: textNoRoom } = extractRoomFromText(rawText);
          const { classId: extractedClass, cleanedText: cleanSubject } = extractSectionFromText(textNoRoom);

          // Lookup in Subject Mapping table
          let finalSubjectName = cleanSubject || rawText;
          let finalClassId = extractedClass || dominantClassId || "II-CSE-A";
          let finalRoom = extractedRoom || (finalSubjectName.toLowerCase().includes("lab") ? "CS-LAB-1" : "LH-201");
          let subjectCode = "";

          const matchedSub = facultySubjectMap.get(cleanSubject.toUpperCase()) ||
                             facultySubjectMap.get(cleanSubject.split(/[\s-]+/)[0].toUpperCase());

          if (matchedSub) {
            finalSubjectName = matchedSub.name;
            if (matchedSub.classId && !extractedClass) {
              finalClassId = matchedSub.classId;
            }
          }

          // Determine category (lab, pe, oe, sub)
          let category = "sub1";
          const subLower = finalSubjectName.toLowerCase();
          if (subLower.includes("lab")) category = "lab1";
          else if (subLower.includes("pe") || subLower.includes("elective")) category = "pe";
          else if (subLower.includes("oe") || subLower.includes("open")) category = "oe";
          else if (subLower.includes("proj")) category = "lab2";

          facultySlotCount++;
          allSlots.push({
            classId: finalClassId,
            dayOrder,
            period: p,
            timeRange: DEFAULT_TIMINGS[p] || `Period ${p}`,
            subjectCode: subjectCode || finalSubjectName,
            subjectName: finalSubjectName,
            facultyName,
            vmsNo: vmsNo || undefined,
            roomNo: finalRoom,
            category,
            semType: "ODD",
          });
        }
      }
    }

    return { allSlots, warnings };
  }

  // 2. Fallback: Parse standard single-class Matrix or Traditional Tabular list
  for (const tableHtml of tableMatches) {
    const { grid, periodCols, dayRows } = parseHtmlTableMatrix(tableHtml);

    if (dayRows.length >= 2 && Object.keys(periodCols).length >= 4) {
      for (const { dayOrder, r } of dayRows) {
        for (let p = 1; p <= 8; p++) {
          const colIdx = periodCols[p];
          if (colIdx === undefined) continue;

          const cellObj = grid[r][colIdx];
          if (!cellObj) continue;

          const rawText = cellObj.rawText;
          if (!rawText || rawText === "-" || rawText === "—") continue;
          if (rawText.toUpperCase().includes("LUNCH") || rawText.toUpperCase().includes("BREAK")) continue;

          const { roomNo, cleanedText } = extractRoomFromText(rawText);
          const { classId, cleanedText: finalSub } = extractSectionFromText(cleanedText);

          allSlots.push({
            classId: classId || "II-CSE-A",
            dayOrder,
            period: p,
            timeRange: DEFAULT_TIMINGS[p],
            subjectCode: finalSub,
            subjectName: finalSub,
            facultyName: null,
            roomNo: roomNo || "LH-201",
            category: finalSub.toLowerCase().includes("lab") ? "lab1" : "sub1",
            semType: "ODD",
          });
        }
      }
    }
  }

  if (allSlots.length === 0) {
    throw new Error(
      "No timetable rows could be parsed from the Word document. Ensure the document contains an individual faculty schedule or standard class schedule matrix."
    );
  }

  return { allSlots, warnings };
}
