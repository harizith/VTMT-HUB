/**
 * Extracts timetable rows from text-based PDFs with an explicit table header.
 *
 * It intentionally does not infer subjects, faculty, rooms, or a master
 * timetable from the file name/title. If the PDF text is not unambiguous, the
 * import is rejected rather than inserting generated sample data.
 */

// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";

export interface ParsedTimetableSlot {
  classId: string | null;
  dayOrder: string | null;
  period: number | null;
  timeRange: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  facultyName: string | null;
  vmsNo?: string | null;
  designation?: string | null;
  roomNo: string | null;
  category?: string | null;
  sourcePage?: number;
}

export interface ParsedFacultySheet {
  facultyName: string;
  vmsNo: string;
  designation: string;
  totalHoursPerWeek: number;
  department?: string;
  subjectMappings: never[];
  slots: ParsedTimetableSlot[];
}

const HEADER_ALIASES: Record<string, string[]> = {
  classId: ["class", "classid", "classidentifier"],
  dayOrder: ["day", "dayorder"],
  period: ["period", "slot"],
  timeRange: ["time", "timerange", "timing"],
  subjectCode: ["code", "subjectcode", "coursecode"],
  subjectName: ["subject", "subjectname", "coursename"],
  facultyName: ["faculty", "facultyname", "teacher", "teachername", "instructor"],
  vmsNo: ["vmsno", "vmno", "staffid", "facultynumber", "mtsno", "mts_no", "vms_no"],
  roomNo: ["room", "roomno", "classroom"],
  category: ["category", "subjectcategory"],
};

const HEADER_BY_ALIAS = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) => aliases.map((alias) => [alias, field]))
);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitCells(line: string): string[] {
  if (line.includes("|")) return line.split("|").map((cell) => cell.trim());
  if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
  return line.trim().split(/\s{2,}/).map((cell) => cell.trim());
}

function isHeader(cells: string[]) {
  const mapped = cells.map((cell) => HEADER_BY_ALIAS.get(normalize(cell)));
  const recognized = new Set(mapped.filter(Boolean));
  return recognized.size >= 2;
}

function parseDay(value: string | undefined): string | null {
  const raw = (value ?? "").trim().toUpperCase().replace(/^DAY\s+/, "");
  if (!raw) return null;
  const numberToRoman: Record<string, string> = { "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V" };
  const day = numberToRoman[raw] || raw;
  return ["I", "II", "III", "IV", "V"].includes(day) ? day : value?.trim() || null;
}

function parsePeriod(value: string | undefined): number | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const period = Number.parseInt(match[0], 10);
  return period >= 1 && period <= 8 ? period : null;
}

export function parseIndividualTimetablePage(text: string, pageNumber = 1): ParsedFacultySheet | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let headers: string[] | null = null;
  let fieldIndexes: Record<string, number> = {};
  const slots: ParsedTimetableSlot[] = [];

  for (const line of lines) {
    const cells = splitCells(line);
    if (isHeader(cells)) {
      headers = cells;
      fieldIndexes = {};
      cells.forEach((cell, index) => {
        const field = HEADER_BY_ALIAS.get(normalize(cell));
        if (field && fieldIndexes[field] === undefined) fieldIndexes[field] = index;
      });
      continue;
    }
    if (!headers || cells.length !== headers.length) continue;

    const get = (key: string) => {
      const value = cells[fieldIndexes[key]];
      return value?.trim() || null;
    };
    const hasContent = cells.some((cell) => cell.trim() !== "");
    if (!hasContent) continue;

    slots.push({
      classId: get("classId"),
      dayOrder: parseDay(get("dayOrder") ?? undefined),
      period: parsePeriod(get("period") ?? undefined),
      timeRange: get("timeRange"),
      subjectCode: get("subjectCode"),
      subjectName: get("subjectName"),
      facultyName: get("facultyName"),
      vmsNo: get("vmsNo"),
      roomNo: get("roomNo"),
      category: get("category"),
      sourcePage: pageNumber,
    });
  }

  if (slots.length === 0) return null;
  const facultyName = slots.find((slot) => slot.facultyName)?.facultyName || "";
  const vmsNo = slots.find((slot) => slot.vmsNo)?.vmsNo || "";
  return {
    facultyName,
    vmsNo,
    designation: "",
    totalHoursPerWeek: slots.length,
    subjectMappings: [],
    slots,
  };
}

export async function parseTimetablePdfBuffer(buffer: Buffer): Promise<{
  facultySheets: ParsedFacultySheet[];
  allSlots: ParsedTimetableSlot[];
  isMasterClass: boolean;
}> {
  const extracted = await pdf(buffer);
  const pages = String(extracted.text || "").split(/\f/);
  const facultySheets = pages
    .map((text: string, index: number) => parseIndividualTimetablePage(text, index + 1))
    .filter((sheet: ParsedFacultySheet | null): sheet is ParsedFacultySheet => sheet !== null);
  const allSlots = facultySheets.flatMap((sheet) => sheet.slots);

  if (allSlots.length === 0) {
    throw new Error(
      "No timetable rows could be read from this PDF. No records were written. Use a text-based PDF with a row-oriented header (Class ID, Day Order, Period, Subject, Faculty, Room), or import the same data from Excel."
    );
  }

  return { facultySheets, allSlots, isMasterClass: false };
}
