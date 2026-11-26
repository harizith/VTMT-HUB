import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const DAYS = ['I', 'II', 'III', 'IV', 'V'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_TIMINGS: Record<number, string> = {
  1: '08:05 - 08:55',
  2: '08:55 - 09:45',
  3: '10:00 - 10:50',
  4: '10:50 - 11:40',
  5: '12:20 - 01:05',
  6: '01:05 - 01:50',
  7: '02:00 - 02:45',
  8: '02:45 - 03:30',
};

function semesterToYearRoman(sem: number): string {
  if (sem <= 2) return 'I';
  if (sem <= 4) return 'II';
  if (sem <= 6) return 'III';
  return 'IV';
}

function inferClassFromCourseCode(courseCode: string, section = 'A'): string {
  const code = courseCode.toUpperCase().replace(/\s+/g, '');
  if (code.includes('CS11') || code.includes('111') || code.includes('11A')) return `I-CSE-${section}`;
  if (code.includes('CS32') || code.includes('CS33') || code.includes('321') || code.includes('322') || code.includes('323') || code.includes('324') || code.includes('325') || code.includes('32A') || code.includes('32B') || code.includes('32C')) return `II-CSE-${section}`;
  if (code.includes('CS52') || code.includes('IT52') || code.includes('MC56') || code.includes('521') || code.includes('522') || code.includes('52A') || code.includes('52B')) return `III-CSE-${section}`;
  if (code.includes('CB72') || code.includes('HS70') || code.includes('C7S7') || code.includes('CSV4') || code.includes('721') || code.includes('701') || code.includes('7S7')) return `IV-CSE-${section}`;
  return `II-CSE-${section}`;
}

function parseCoursesFromCell(cellText: string): { code: string; name: string }[] {
  if (!cellText || typeof cellText !== 'string') return [];
  const lines = cellText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  const results: { code: string; name: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^([0-9]{2,3}[A-Z0-9]+)\s*[-:]*\s*(.*)$/i);
    if (match) {
      const code = match[1].trim();
      const name = match[2]?.trim() || code;
      results.push({ code, name });
    } else {
      results.push({ code: line, name: line });
    }
  }
  return results;
}

interface ExtractedAllocationRow {
  facultyName: string;
  vmsNo?: string;
  department?: string;
  subjectCode: string;
  subjectName?: string;
  targetClass: string;
  semester?: number;
  semType?: 'ODD' | 'EVEN';
  periodsPerWeek: number;
  isLab: boolean;
  roomNo?: string;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let allocations: ExtractedAllocationRow[] = [];
    let writeStrategy: 'replace' | 'append' = 'replace';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      allocations = body.allocations || [];
      if (body.writeStrategy === 'append') writeStrategy = 'append';
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const strategy = formData.get('writeStrategy') as string | null;
      if (strategy === 'append') writeStrategy = 'append';

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No Excel file was uploaded' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rawAoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Find header row
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rawAoa.length, 15); i++) {
        const rowStr = rawAoa[i].map((c) => String(c).toLowerCase()).join(' ');
        if (
          rowStr.includes('subject code') ||
          rowStr.includes('sec a') ||
          rowStr.includes('semester') ||
          rowStr.includes('faculty') ||
          rowStr.includes('theory')
        ) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) headerRowIndex = 0;

      const headers = rawAoa[headerRowIndex].map((h) => String(h).trim().toLowerCase());
      const findCol = (...candidates: string[]) => {
        for (const cand of candidates) {
          const idx = headers.findIndex((h) => h.includes(cand.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      // Check if this is the "SEMESTER | SUBJECT CODE | SUBJECT NAME | SEC A | SEC B | SEC C" format
      const semCol = findCol('semester', 'sem');
      const subCodeCol = findCol('subject code', 'sub code', 'code');
      const subNameCol = findCol('subject name', 'sub name', 'course name', 'name');
      const secACol = findCol('sec a', 'section a', 'seca');
      const secBCol = findCol('sec b', 'section b', 'secb');
      const secCCol = findCol('sec c', 'section c', 'secc');

      const isSectionMatrix = subCodeCol !== -1 && (secACol !== -1 || secBCol !== -1 || secCCol !== -1);

      if (isSectionMatrix) {
        // Parse "SEMESTER | SUBJECT CODE | SUBJECT NAME | SEC A | SEC B | SEC C"
        for (let r = headerRowIndex + 1; r < rawAoa.length; r++) {
          const row = rawAoa[r];
          if (!row || row.length === 0) continue;

          const rawSem = semCol !== -1 ? parseInt(String(row[semCol]).trim()) || 3 : 3;
          const subjectCode = subCodeCol !== -1 ? String(row[subCodeCol]).trim() : '';
          const subjectName = subNameCol !== -1 ? String(row[subNameCol]).trim() : subjectCode;

          if (!subjectCode && !subjectName) continue;

          // 1,2 sem -> I Year | 3,4 sem -> II Year | 5,6 sem -> III Year | 7,8 sem -> IV Year
          const yearRoman = semesterToYearRoman(rawSem);
          const semType: 'ODD' | 'EVEN' = rawSem % 2 !== 0 ? 'ODD' : 'EVEN';

          const isLab =
            subjectCode.toLowerCase().includes('lab') ||
            subjectName.toLowerCase().includes('lab') ||
            subjectCode.endsWith('A') ||
            subjectCode.endsWith('B') ||
            subjectCode.endsWith('C');

          const sectionFacultyPairs = [
            { sec: 'A', col: secACol },
            { sec: 'B', col: secBCol },
            { sec: 'C', col: secCCol },
          ];

          sectionFacultyPairs.forEach(({ sec, col }) => {
            if (col !== -1 && row[col]) {
              const facultyRaw = String(row[col]).trim();
              if (facultyRaw && facultyRaw !== '-' && facultyRaw !== '—' && facultyRaw.toLowerCase() !== 'nil') {
                const targetClass = `${yearRoman}-CSE-${sec}`;

                // Clean names while preserving multiple teachers separated by '/' or ','
                const cleanFacultyNames = facultyRaw
                  .replace(/,\s*ph\.?d/gi, '')
                  .replace(/ph\.?d/gi, '')
                  .split(/[\r\n/]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(' / ');

                allocations.push({
                  facultyName: cleanFacultyNames || facultyRaw,
                  department: 'CSE',
                  subjectCode,
                  subjectName,
                  targetClass,
                  semester: rawSem,
                  semType,
                  periodsPerWeek: isLab ? 3 : 5,
                  isLab,
                  roomNo: isLab ? 'CS-LAB-1' : 'LH-201',
                });
              }
            }
          });
        }
      } else {
        // Fallback: parse standard workload sheet (MTS No | Faculty | Theory | Practical)
        const mtsCol = findCol('mts', 'staff id', 'emp id');
        const facultyCol = findCol('faculty name', 'faculty', 'teacher');
        const theoryCol = findCol('theory', 'subject allotted', 'subject code', 'course');
        const practicalCol = findCol('practical', 'lab');
        const classCol = findCol('class', 'target class', 'section');

        for (let r = headerRowIndex + 1; r < rawAoa.length; r++) {
          const row = rawAoa[r];
          if (!row || row.length === 0) continue;

          const facultyRaw = facultyCol !== -1 ? String(row[facultyCol]).trim() : '';
          const mtsRaw = mtsCol !== -1 ? String(row[mtsCol]).trim() : '';
          const theoryRaw = theoryCol !== -1 ? String(row[theoryCol]).trim() : '';
          const practicalRaw = practicalCol !== -1 ? String(row[practicalCol]).trim() : '';
          const classRaw = classCol !== -1 ? String(row[classCol]).trim() : '';

          const facultyName = facultyRaw.replace(/,\s*ph\.?d/i, '').trim();
          if (!facultyName && !theoryRaw && !practicalRaw) continue;

          if (theoryRaw) {
            const courses = parseCoursesFromCell(theoryRaw);
            courses.forEach((c) => {
              const targetClass = classRaw || inferClassFromCourseCode(c.code);
              allocations.push({
                facultyName: facultyName || 'Faculty Member',
                vmsNo: mtsRaw,
                department: 'CSE',
                subjectCode: c.code,
                subjectName: c.name,
                targetClass,
                periodsPerWeek: 5,
                isLab: false,
                roomNo: 'LH-201',
              });
            });
          }

          if (practicalRaw) {
            const labs = parseCoursesFromCell(practicalRaw);
            labs.forEach((l) => {
              const targetClass = classRaw || inferClassFromCourseCode(l.code);
              allocations.push({
                facultyName: facultyName || 'Faculty Member',
                vmsNo: mtsRaw,
                department: 'CSE',
                subjectCode: l.code,
                subjectName: l.name,
                targetClass,
                periodsPerWeek: 3,
                isLab: true,
                roomNo: 'CS-LAB-1',
              });
            });
          }
        }
      }
    }

    if (allocations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid faculty-subject allocation rows found in spreadsheet.' },
        { status: 400 }
      );
    }

    // 2. Identify all distinct target classes
    const targetClasses = Array.from(new Set(allocations.map((a) => a.targetClass.toUpperCase())));

    // Pre-fetch all faculty/HOD users to map teacher names -> MTS numbers (vmNo)
    const allRegisteredTeachers = await prisma.user.findMany({
      where: { role: { in: ['FACULTY', 'HOD'] } },
      select: { name: true, vmNo: true },
    });

    const stripTitlesAndDegrees = (name: string) =>
      name
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(ph\.?d|m\.?e|m\.?tech|m\.?sc|m\.?phil|b\.?e|b\.?tech|mba|mca)\b\.?/gi, ' ')
        .replace(/\b(dr|prof|professor|asst|assoc|mr|ms|mrs|miss|shri|smt|er|sir|madam)\b[\.\s]*/gi, ' ')
        .replace(/[,]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizeStaffName = (name: string) =>
      stripTitlesAndDegrees(name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const findMtsForName = (teacherName: string): string | null => {
      if (!teacherName || !teacherName.trim()) return null;
      const strippedInput = stripTitlesAndDegrees(teacherName);
      const cleanTarget = normalizeStaffName(strippedInput);
      if (!cleanTarget) return null;

      // 1. Direct or normalized string match
      const exact = allRegisteredTeachers.find((t) => normalizeStaffName(t.name) === cleanTarget);
      if (exact?.vmNo) return exact.vmNo;

      // 2. Token match ignoring initials (like E, P, D, V, N)
      const inputWords = strippedInput
        .toLowerCase()
        .split(/[\s\.\-]+/)
        .filter((w) => w.length >= 3);

      let bestMatch: { vmNo: string; score: number } | null = null;

      for (const t of allRegisteredTeachers) {
        if (!t.vmNo) continue;
        const strippedDb = stripTitlesAndDegrees(t.name);
        const normDb = normalizeStaffName(strippedDb);

        // Direct containment
        if (normDb.includes(cleanTarget) || cleanTarget.includes(normDb)) {
          return t.vmNo;
        }

        const dbWords = strippedDb
          .toLowerCase()
          .split(/[\s\.\-]+/)
          .filter((w) => w.length >= 3);

        // Count overlapping words of length >= 3
        const commonWords = inputWords.filter((iw) =>
          dbWords.some((dw) => dw === iw || dw.includes(iw) || iw.includes(dw))
        );

        if (commonWords.length > 0) {
          const score = commonWords.reduce((acc, w) => acc + w.length, 0);
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { vmNo: t.vmNo, score };
          }
        }
      }

      return bestMatch ? bestMatch.vmNo : null;
    };

    const resolveVmsString = (facultyString: string, existingVms?: string): string | null => {
      if (existingVms && existingVms.trim()) return existingVms.trim();
      if (!facultyString || !facultyString.trim()) return null;

      const individualTeachers = facultyString.split(/[/]+/).map((s) => s.trim()).filter(Boolean);
      const vmsList = individualTeachers.map((t) => findMtsForName(t) || '').filter(Boolean);
      return vmsList.length > 0 ? vmsList.join(' / ') : null;
    };

    // Attach resolved MTS numbers to allocations
    allocations.forEach((a) => {
      if (!a.vmsNo && a.facultyName) {
        a.vmsNo = resolveVmsString(a.facultyName) || undefined;
      }
    });

    // 3. Prepare generation engine:
    const teacherBusy = new Map<string, Map<string, string>>();
    const markBusy = (teacherName: string, day: string, period: number, classId: string) => {
      const names = teacherName.split(/[,/]+/).map((n) => n.trim().toLowerCase()).filter(Boolean);
      names.forEach((t) => {
        if (!teacherBusy.has(t)) teacherBusy.set(t, new Map());
        teacherBusy.get(t)!.set(`${day}-${period}`, classId);
      });
    };
    const isTeacherAvailable = (teacherName: string, day: string, period: number) => {
      if (!teacherName || !teacherName.trim()) return true;
      const names = teacherName.split(/[,/]+/).map((n) => n.trim().toLowerCase()).filter(Boolean);
      return names.every((t) => {
        const map = teacherBusy.get(t);
        return !map || !map.has(`${day}-${period}`);
      });
    };

    if (writeStrategy === 'replace') {
      await prisma.timetableEntry.deleteMany({
        where: {
          classId: { in: targetClasses },
        },
      });
    }

    const generatedSlots: any[] = [];
    let totalAssignedPeriods = 0;

    // 4. Generate schedule class by class
    for (const classId of targetClasses) {
      const classAllocations = allocations.filter((a) => a.targetClass.toUpperCase() === classId);
      const grid: Record<string, Record<number, any>> = {};
      DAYS.forEach((d) => {
        grid[d] = {};
      });

      // A. Reserve standard institution periods
      grid['V'][7] = {
        subjectCode: 'SPORTS',
        subjectName: 'Physical Education / Sports',
        facultyName: 'Physical Director',
        roomNo: 'Grounds',
        category: 'sports',
      };
      grid['V'][8] = {
        subjectCode: 'SPORTS',
        subjectName: 'Physical Education / Sports',
        facultyName: 'Physical Director',
        roomNo: 'Grounds',
        category: 'sports',
      };

      grid['III'][8] = {
        subjectCode: 'LIB',
        subjectName: 'Library & Digital Knowledge Resource',
        facultyName: 'Librarian',
        roomNo: 'Central Library',
        category: 'library',
      };

      // B. Place Labs First
      const labs = classAllocations.filter((a) => a.isLab);
      const labBlocks = [
        { day: 'I', start: 6, end: 8 },
        { day: 'II', start: 6, end: 8 },
        { day: 'III', start: 5, end: 7 },
        { day: 'IV', start: 6, end: 8 },
      ];

      labs.forEach((lab, idx) => {
        const block = labBlocks[idx % labBlocks.length];
        if (block) {
          const canFit = Array.from(
            { length: block.end - block.start + 1 },
            (_, i) => block.start + i
          ).every((p) => !grid[block.day][p] && isTeacherAvailable(lab.facultyName, block.day, p));

          if (canFit) {
            for (let p = block.start; p <= block.end; p++) {
              grid[block.day][p] = {
                subjectCode: lab.subjectCode,
                subjectName: lab.subjectName,
                facultyName: lab.facultyName,
                roomNo: lab.roomNo || 'CS-LAB-1',
                vmsNo: lab.vmsNo || resolveVmsString(lab.facultyName),
                semType: lab.semType || (lab.semester ? (lab.semester % 2 !== 0 ? 'ODD' : 'EVEN') : 'ODD'),
                category: 'lab',
              };
              markBusy(lab.facultyName, block.day, p, classId);
              totalAssignedPeriods++;
            }
          }
        }
      });

      // C. Place Theory Subjects Across Remaining Slots
      const theories = classAllocations.filter((a) => !a.isLab);
      const subjectQueue: ExtractedAllocationRow[] = [];
      theories.forEach((t) => {
        const count = Math.max(1, Math.min(6, t.periodsPerWeek || 5));
        for (let i = 0; i < count; i++) {
          subjectQueue.push(t);
        }
      });

      subjectQueue.sort(() => Math.random() - 0.5);

      for (const day of DAYS) {
        for (const period of PERIODS) {
          if (grid[day][period]) continue;

          const candIndex = subjectQueue.findIndex((cand) => {
            const countToday = Object.values(grid[day]).filter(
              (s: any) => s && s.subjectCode === cand.subjectCode
            ).length;
            if (countToday >= 2) return false;
            const prevSlot = grid[day][period - 1];
            if (prevSlot && prevSlot.subjectCode === cand.subjectCode) return false;
            return isTeacherAvailable(cand.facultyName, day, period);
          });

          if (candIndex !== -1) {
            const chosen = subjectQueue.splice(candIndex, 1)[0];
            grid[day][period] = {
              subjectCode: chosen.subjectCode,
              subjectName: chosen.subjectName,
              facultyName: chosen.facultyName,
              roomNo: chosen.roomNo || 'LH-201',
              vmsNo: chosen.vmsNo || resolveVmsString(chosen.facultyName),
              semType: chosen.semType || (chosen.semester ? (chosen.semester % 2 !== 0 ? 'ODD' : 'EVEN') : 'ODD'),
              category: 'theory',
            };
            markBusy(chosen.facultyName, day, period, classId);
            totalAssignedPeriods++;
          }
        }
      }

      // Derive dominant semType for this class (ODD vs EVEN)
      const classSemTypes = classAllocations.map((a) => a.semType).filter(Boolean);
      const oddCount = classSemTypes.filter((s) => s === 'ODD').length;
      const dominantSemType: 'ODD' | 'EVEN' = oddCount >= (classSemTypes.length - oddCount) ? 'ODD' : 'EVEN';

      for (const day of DAYS) {
        for (const period of PERIODS) {
          const slot = grid[day][period];
          if (slot) {
            generatedSlots.push({
              classId,
              dayOrder: day,
              period,
              timeRange: DEFAULT_TIMINGS[period] || '08:05 - 08:55',
              subjectCode: slot.subjectCode,
              subjectName: slot.subjectName,
              facultyName: slot.facultyName,
              roomNo: slot.roomNo,
              vmsNo: slot.vmsNo || (slot.facultyName ? resolveVmsString(slot.facultyName) : null),
              category: slot.category,
              semType: slot.semType || dominantSemType,
            });
          }
        }
      }
    }

    // 5. Batch insert generated slots into database
    await prisma.timetableEntry.createMany({
      data: generatedSlots,
      skipDuplicates: true,
    });

    // 6. Update Faculty Profiles
    try {
      const allFacultyProfiles = await prisma.facultyProfile.findMany({
        include: { user: { select: { name: true, vmNo: true } } },
      });

      for (const a of allocations) {
        if (!a.facultyName) continue;
        const names = a.facultyName.split(/[,/]+/).map((n) => n.trim().toLowerCase());

        for (const name of names) {
          const matched = allFacultyProfiles.find((fp) => {
            const fpUserName = (fp.user?.name || '').toLowerCase();
            const fpVm = (fp.vmNo || fp.user?.vmNo || '').toLowerCase();
            return (
              fpUserName.includes(name) ||
              name.includes(fpUserName) ||
              (a.vmsNo && fpVm && a.vmsNo.toLowerCase().includes(fpVm))
            );
          });

          if (matched) {
            if (a.isLab && !matched.lab1) {
              await prisma.facultyProfile.update({
                where: { vmNo: matched.vmNo },
                data: { lab1: `${a.subjectCode} ${a.subjectName || ''}`.trim() },
              });
            } else if (!a.isLab && !matched.subject1) {
              await prisma.facultyProfile.update({
                where: { vmNo: matched.vmNo },
                data: { subject1: `${a.subjectCode} ${a.subjectName || ''}`.trim() },
              });
            }
          }
        }
      }
    } catch (profErr) {
      console.warn('Non-blocking faculty profile sync warning:', profErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated conflict-free timetables for ${targetClasses.length} classes across ${totalAssignedPeriods} total periods.`,
      classesCount: targetClasses.length,
      classes: targetClasses,
      totalSlots: generatedSlots.length,
      sampleSlots: generatedSlots.slice(0, 10),
    });
  } catch (err: any) {
    console.error('Error generating batch timetables from Excel allocation:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate timetables from Excel.' },
      { status: 500 }
    );
  }
}
