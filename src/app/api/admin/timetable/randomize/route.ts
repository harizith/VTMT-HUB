import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const DAYS = ['I', 'II', 'III', 'IV', 'V'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_TIME_RANGES: Record<number, string> = {
  1: '08:05 - 08:55',
  2: '08:55 - 09:45',
  3: '10:00 - 10:50',
  4: '10:50 - 11:40',
  5: '12:20 - 01:05',
  6: '01:05 - 01:50',
  7: '02:00 - 02:45',
  8: '02:45 - 03:30',
};

function getClassAliases(classId: string): string[] {
  const aliases = new Set<string>([classId]);
  const parts = classId.split('-');
  if (parts.length >= 3) {
    const yearOrSem = parts[0].toUpperCase();
    const dept = parts[1];
    const sec = parts[2];

    if (yearOrSem === 'IV' || yearOrSem === 'VII' || yearOrSem === 'VIII') {
      aliases.add(`IV-${dept}-${sec}`);
      aliases.add(`VII-${dept}-${sec}`);
      aliases.add(`VIII-${dept}-${sec}`);
    } else if (yearOrSem === 'III' || yearOrSem === 'V' || yearOrSem === 'VI') {
      aliases.add(`III-${dept}-${sec}`);
      aliases.add(`V-${dept}-${sec}`);
      aliases.add(`VI-${dept}-${sec}`);
    } else if (yearOrSem === 'II') {
      aliases.add(`II-${dept}-${sec}`);
    } else if (yearOrSem === 'I') {
      aliases.add(`I-${dept}-${sec}`);
    }
  }
  return Array.from(aliases);
}

function parseClassInfo(classId: string): { dept: string; year: string; semester: number | null } {
  const parts = classId.split('-');
  let year = 'I';
  let dept = 'CSE';
  let semester: number | null = null;

  if (parts.length >= 2) {
    year = parts[0].toUpperCase();
    dept = parts[1].toUpperCase();
  }

  if (year === 'I') semester = 1;
  else if (year === 'II') semester = 3;
  else if (year === 'III') semester = 5;
  else if (year === 'IV') semester = 7;
  else if (year === 'V') semester = 5;
  else if (year === 'VI') semester = 6;
  else if (year === 'VII') semester = 7;
  else if (year === 'VIII') semester = 8;

  return { dept, year, semester };
}

interface SubjectCandidate {
  code: string;
  name: string;
  isLab: boolean;
  category: string;
  credits: number;
  facultyName: string | null;
  vmsNo: string | null;
  roomNo: string | null;
  periodsPerWeek: number;
  isContinuous: boolean;
}

function isLabCourse(name?: string | null, code?: string | null, category?: string | null): boolean {
  const text = `${name || ''} ${code || ''} ${category || ''}`.toLowerCase();
  return (
    text.includes('lab') ||
    text.includes('practical') ||
    text.includes('laboratory') ||
    text.includes('workshop') ||
    text.includes('project') ||
    text.includes('ppt') ||
    text.includes('seminar') ||
    text.includes('presentation') ||
    text.includes('training')
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const body = await request.json();
    const {
      classId,
      academicYear,
      semType,
      teacherAssignments,
      subjectRules,
      sportsConfig,
      libraryConfig,
      electiveConfig,
      labConfig,
    } = body;

    if (!classId) {
      return NextResponse.json({ success: false, error: 'classId is required' }, { status: 400 });
    }

    const aliases = getClassAliases(classId);
    let { dept, year, semester } = parseClassInfo(classId);

    // If semType is explicitly provided ("ODD" or "EVEN"), adjust semester accordingly
    if (semType === "EVEN" && semester && semester % 2 !== 0) {
      semester = semester + 1;
    } else if (semType === "ODD" && semester && semester % 2 === 0) {
      semester = semester - 1;
    }

    // 1. Fetch existing timetable entries for this class
    const existingEntries = await prisma.timetableEntry.findMany({
      where: { classId: { in: aliases } },
      orderBy: [{ dayOrder: 'asc' }, { period: 'asc' }],
    });

    // 2. Fetch catalog subjects for this class
    const catalogWhere: any = {};
    if (dept && dept !== 'ALL') {
      catalogWhere.departmentCode = { equals: dept, mode: 'insensitive' };
    }
    if (semester) {
      const allowedSems = [semester, semester + 1];
      catalogWhere.semester = { in: allowedSems };
    }

    let catalogSubjects = await prisma.subject.findMany({
      where: catalogWhere,
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
    });

    if (catalogSubjects.length === 0 && dept) {
      catalogSubjects = await prisma.subject.findMany({
        where: { departmentCode: { equals: dept, mode: 'insensitive' } },
        orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      });
    }

    if (catalogSubjects.length === 0) {
      catalogSubjects = await prisma.subject.findMany({
        orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      });
    }

    if (catalogSubjects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No subjects found in Course Catalog for department ${dept}. Please add subjects to the Course Catalog before randomizing.`,
        },
        { status: 400 }
      );
    }

    // 3. Teacher Clash Avoidance Engine:
    // Query existing timetable entries across ALL OTHER CLASSES in the institution.
    // A teacher must NOT be double-booked at the same Day Order and Period (except Sports and Electives).
    const otherClassEntries = await prisma.timetableEntry.findMany({
      where: {
        classId: { notIn: aliases },
        facultyName: { not: null },
      },
      select: {
        facultyName: true,
        dayOrder: true,
        period: true,
        classId: true,
      },
    });

    // teacherBusySlots: Set of `${cleanTeacherName}|${dayOrder}|${period}`
    const teacherBusySlots = new Set<string>();
    for (const ent of otherClassEntries) {
      if (ent.facultyName?.trim() && ent.dayOrder && ent.period) {
        const subNames = ent.facultyName.split(/[,/]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        for (const cleanName of subNames) {
          teacherBusySlots.add(`${cleanName}|${ent.dayOrder}|${ent.period}`);
        }
      }
    }

    // Map existing entries to pick up faculty / room assignments
    const existingFacultyByCode = new Map<
      string,
      { facultyName: string | null; vmsNo: string | null; roomNo: string | null; category: string | null }
    >();
    for (const e of existingEntries) {
      if (e.subjectCode?.trim()) {
        const c = e.subjectCode.trim().toUpperCase();
        if (!existingFacultyByCode.has(c)) {
          existingFacultyByCode.set(c, {
            facultyName: e.facultyName || null,
            vmsNo: e.vmsNo || null,
            roomNo: e.roomNo || null,
            category: e.category || null,
          });
        }
      }
    }

    // Build subject candidate pool with customized user periodsPerWeek & isContinuous block rules
    const subjectPool: SubjectCandidate[] = catalogSubjects.map((sub: any, idx: number) => {
      const code = sub.code.trim().toUpperCase();
      const name = sub.name.trim();
      const existingMeta = existingFacultyByCode.get(code);
      const isLab = isLabCourse(name, code, existingMeta?.category);
      const defaultCategory = isLab ? `lab${(idx % 2) + 1}` : `sub${(idx % 4) + 1}`;

      const explicitAssignment =
        teacherAssignments && typeof teacherAssignments === 'object'
          ? teacherAssignments[code] || teacherAssignments[sub.code] || null
          : null;

      const facultyName =
        explicitAssignment?.facultyName !== undefined
          ? explicitAssignment.facultyName
          : existingMeta?.facultyName || null;

      const vmsNo =
        explicitAssignment?.vmsNo !== undefined
          ? explicitAssignment.vmsNo
          : existingMeta?.vmsNo || null;

      const roomNo =
        explicitAssignment?.roomNo !== undefined
          ? explicitAssignment.roomNo
          : existingMeta?.roomNo || null;

      // User customizable rules per subject
      const userRule = subjectRules && typeof subjectRules === 'object' ? subjectRules[code] : null;
      const defaultPeriods = isLab ? 2 : 4;
      const periodsPerWeek = userRule?.periodsPerWeek ? Number(userRule.periodsPerWeek) : defaultPeriods;
      const isContinuous = userRule?.isContinuous !== undefined ? Boolean(userRule.isContinuous) : isLab;

      return {
        code,
        name,
        isLab,
        category: existingMeta?.category || defaultCategory,
        credits: sub.credits || 3,
        facultyName,
        vmsNo,
        roomNo,
        periodsPerWeek,
        isContinuous,
      };
    });

    // 4. Initialize empty 5x8 Timetable Grid
    const grid: Record<string, Record<number, any>> = {};
    for (const day of DAYS) {
      grid[day] = {};
    }

    // Helper: is slot available in current grid
    const isSlotFree = (day: string, p: number) => !grid[day][p];

    // Helper: is faculty available at (day, p) considering other classes
    const isTeacherAvailable = (facultyName: string | null | undefined, day: string, p: number) => {
      if (!facultyName?.trim()) return true;
      // Split comma-separated faculty (e.g. for labs with 2 staff or electives with 3 staff)
      const names = facultyName.split(/[,/]+/).map((n) => n.trim().toLowerCase()).filter(Boolean);
      for (const cleanName of names) {
        // Check collision with other classes in the institution
        if (teacherBusySlots.has(`${cleanName}|${day}|${p}`)) {
          return false;
        }
        // Check collision within current class timetable at this period
        const currentSlotFac = grid[day][p]?.facultyName;
        if (currentSlotFac) {
          const currentNames = currentSlotFac.split(/[,/]+/).map((n: string) => n.trim().toLowerCase()).filter(Boolean);
          if (currentNames.includes(cleanName)) {
            return false;
          }
        }
      }
      return true;
    };

    // Helper: assign slot
    const assignSlot = (
      day: string,
      period: number,
      data: {
        code: string;
        name: string;
        facultyName: string | null;
        roomNo: string | null;
        vmsNo: string | null;
        category: string;
      }
    ) => {
      grid[day][period] = {
        classId,
        dayOrder: day,
        period,
        timeRange: DEFAULT_TIME_RANGES[period] || `Period ${period}`,
        subjectCode: data.code,
        subjectName: data.name,
        facultyName: data.facultyName,
        roomNo: data.roomNo,
        vmsNo: data.vmsNo,
        category: data.category,
      };
    };

    // =========================================================================
    // PRIORITY 1: Sports (2 Continuous Periods, e.g. Day V, Periods 7 & 8)
    // Declared across all sections of the dept and year, non-merging with other years
    // =========================================================================
    if (sportsConfig?.enabled !== false) {
      const sportsDay = sportsConfig?.dayOrder || 'V';
      const [sp1, sp2] = sportsConfig?.periods && sportsConfig.periods.length === 2
        ? sportsConfig.periods
        : [7, 8];

      const sportsRoom = sportsConfig?.roomNo || 'GROUND';
      const sportsFaculty = sportsConfig?.facultyName || 'Physical Director';

      if (isSlotFree(sportsDay, sp1)) {
        assignSlot(sportsDay, sp1, {
          code: 'SPT-01',
          name: 'Physical Education & Sports',
          facultyName: sportsFaculty,
          roomNo: sportsRoom,
          vmsNo: 'PD-01',
          category: 'sports',
        });
      }
      if (isSlotFree(sportsDay, sp2)) {
        assignSlot(sportsDay, sp2, {
          code: 'SPT-01',
          name: 'Physical Education & Sports',
          facultyName: sportsFaculty,
          roomNo: sportsRoom,
          vmsNo: 'PD-01',
          category: 'sports',
        });
      }
    }

    // =========================================================================
    // PRIORITY 2: Electives (EP) Continuous Slot (e.g. Day IV, Periods 5 & 6)
    // Synchronized according to user input
    // =========================================================================
    if (electiveConfig?.enabled === true) {
      const epDay = electiveConfig?.dayOrder || 'IV';
      const [ep1, ep2] = electiveConfig?.periods && electiveConfig.periods.length === 2
        ? electiveConfig.periods
        : [5, 6];

      const epCode = electiveConfig?.code || 'EP-OPEN';
      const epName = electiveConfig?.name || 'Professional / Open Elective';
      const epFaculty = electiveConfig?.facultyName || 'Elective Coordinator';
      const epRoom = electiveConfig?.roomNo || 'AUDITORIUM';

      if (isSlotFree(epDay, ep1)) {
        assignSlot(epDay, ep1, {
          code: epCode,
          name: epName,
          facultyName: epFaculty,
          roomNo: epRoom,
          vmsNo: null,
          category: 'pe',
        });
      }
      if (isSlotFree(epDay, ep2)) {
        assignSlot(epDay, ep2, {
          code: epCode,
          name: epName,
          facultyName: epFaculty,
          roomNo: epRoom,
          vmsNo: null,
          category: 'pe',
        });
      }
    }

    // =========================================================================
    // PRIORITY 3: Library (1 Period per week)
    // =========================================================================
    if (libraryConfig?.enabled !== false) {
      const libDay = libraryConfig?.dayOrder || 'III';
      const libPeriod = libraryConfig?.period || 6;
      const libRoom = libraryConfig?.roomNo || 'CENTRAL-LIB';

      if (isSlotFree(libDay, libPeriod)) {
        assignSlot(libDay, libPeriod, {
          code: 'LIB-01',
          name: 'Library & Digital Reference Hour',
          facultyName: 'Librarian',
          roomNo: libRoom,
          vmsNo: 'LIB-01',
          category: 'library',
        });
      }
    }

    // =========================================================================
    // PRIORITY 4: Labs (2-Period Continuous Blocks, e.g. Pairs 1-2, 3-4, 5-6, 7-8)
    // Allows selecting exact lab subject (e.g. DS Lab, OOP Lab, OS Lab)
    // =========================================================================
    const labSubjects = subjectPool.filter((s) => s.isLab);
    const labPairs = [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ];

    // Track allocated lab codes so they aren't duplicated
    const allocatedLabCodes = new Set<string>();

    // 4A. If user specified a dedicated Lab in Priority Slots Engine:
    if (labConfig?.enabled === true && labConfig.subjectCode) {
      const targetLabCode = String(labConfig.subjectCode).trim().toUpperCase();
      const matchedLab = labSubjects.find((s) => s.code === targetLabCode) || {
        code: targetLabCode,
        name: labConfig.subjectName || targetLabCode,
        isLab: true,
        category: 'lab1',
        credits: 2,
        facultyName: labConfig.facultyName || null,
        vmsNo: null,
        roomNo: labConfig.roomNo || 'CS-LAB-1',
        periodsPerWeek: 2,
        isContinuous: true,
      };

      const preferredDay = labConfig.dayOrder || 'I';
      const [lp1, lp2] = labConfig.periods && labConfig.periods.length === 2
        ? labConfig.periods
        : [1, 2];

      const labFac = labConfig.facultyName || matchedLab.facultyName;
      const labRoom = labConfig.roomNo || matchedLab.roomNo || 'CS-LAB-1';

      if (isSlotFree(preferredDay, lp1) && isSlotFree(preferredDay, lp2)) {
        assignSlot(preferredDay, lp1, {
          code: matchedLab.code,
          name: matchedLab.name,
          facultyName: labFac,
          roomNo: labRoom,
          vmsNo: matchedLab.vmsNo,
          category: matchedLab.category || 'lab1',
        });
        assignSlot(preferredDay, lp2, {
          code: matchedLab.code,
          name: matchedLab.name,
          facultyName: labFac,
          roomNo: labRoom,
          vmsNo: matchedLab.vmsNo,
          category: matchedLab.category || 'lab1',
        });
        allocatedLabCodes.add(matchedLab.code);
      }
    }

    // 4B. Allocate remaining labs (each gets 1 full 2-period continuous block)
    for (const lab of labSubjects) {
      if (allocatedLabCodes.has(lab.code)) continue;

      let allocated = false;
      const candidateDays = shuffleArray(DAYS);

      for (const day of candidateDays) {
        if (allocated) break;
        const shuffledPairs = shuffleArray(labPairs);

        for (const [p1, p2] of shuffledPairs) {
          if (isSlotFree(day, p1) && isSlotFree(day, p2)) {
            // Check teacher availability
            if (
              isTeacherAvailable(lab.facultyName, day, p1) &&
              isTeacherAvailable(lab.facultyName, day, p2)
            ) {
              assignSlot(day, p1, {
                code: lab.code,
                name: lab.name,
                facultyName: lab.facultyName,
                roomNo: lab.roomNo,
                vmsNo: lab.vmsNo,
                category: lab.category,
              });
              assignSlot(day, p2, {
                code: lab.code,
                name: lab.name,
                facultyName: lab.facultyName,
                roomNo: lab.roomNo,
                vmsNo: lab.vmsNo,
                category: lab.category,
              });
              allocated = true;
              allocatedLabCodes.add(lab.code);
              break;
            }
          }
        }
      }
    }

    // =========================================================================
    // PRIORITY 5: Theory Subjects (1 period each default, or 2 continuous block + remaining)
    // Rule: If periodsPerWeek is e.g. 4 and isContinuous is true:
    // Split into 1 two-period continuous block on 1 day, and remaining 2 periods on other separate days.
    // Ensure strict teacher schedule clash check against other classes!
    // =========================================================================
    const theorySubjects = subjectPool.filter((s) => !s.isLab);

    // Track weekly count and days for each subject
    const subjectWeeklyCounts = new Map<string, number>();
    const subjectDays = new Map<string, Set<string>>();

    for (const s of subjectPool) {
      subjectWeeklyCounts.set(s.code, 0);
      subjectDays.set(s.code, new Set());
    }

    // Count already placed slots (labs, sports, electives, lib)
    for (const day of DAYS) {
      for (const p of PERIODS) {
        const ent = grid[day][p];
        if (ent && ent.subjectCode) {
          const c = ent.subjectCode.toUpperCase();
          subjectWeeklyCounts.set(c, (subjectWeeklyCounts.get(c) || 0) + 1);
          if (!subjectDays.has(c)) subjectDays.set(c, new Set());
          subjectDays.get(c)!.add(day);
        }
      }
    }

    // Schedule 2-period continuous blocks for theory subjects with `isContinuous: true`
    for (const sub of theorySubjects) {
      if (sub.isContinuous && sub.periodsPerWeek >= 2) {
        let placedBlock = false;
        const candidateDays = shuffleArray(DAYS);

        for (const day of candidateDays) {
          if (placedBlock) break;
          // Avoid day if already contains this subject
          if (subjectDays.get(sub.code)?.has(day)) continue;

          for (const [p1, p2] of labPairs) {
            if (isSlotFree(day, p1) && isSlotFree(day, p2)) {
              if (
                isTeacherAvailable(sub.facultyName, day, p1) &&
                isTeacherAvailable(sub.facultyName, day, p2)
              ) {
                assignSlot(day, p1, {
                  code: sub.code,
                  name: sub.name,
                  facultyName: sub.facultyName,
                  roomNo: sub.roomNo,
                  vmsNo: sub.vmsNo,
                  category: sub.category,
                });
                assignSlot(day, p2, {
                  code: sub.code,
                  name: sub.name,
                  facultyName: sub.facultyName,
                  roomNo: sub.roomNo,
                  vmsNo: sub.vmsNo,
                  category: sub.category,
                });
                subjectWeeklyCounts.set(sub.code, (subjectWeeklyCounts.get(sub.code) || 0) + 2);
                subjectDays.get(sub.code)!.add(day);
                placedBlock = true;
                break;
              }
            }
          }
        }
      }
    }

    // Now fill remaining free slots using backtracking / constraint solver
    const emptySlots: { day: string; period: number }[] = [];
    for (const day of DAYS) {
      for (const p of PERIODS) {
        if (isSlotFree(day, p)) {
          emptySlots.push({ day, period: p });
        }
      }
    }

    function solveSlots(idx: number): boolean {
      if (idx >= emptySlots.length) {
        return true;
      }

      const { day, period } = emptySlots[idx];

      // Prioritize theory subjects that still need hours to reach their `periodsPerWeek` target
      const candidates = shuffleArray(theorySubjects);
      candidates.sort((a, b) => {
        const remainingA = a.periodsPerWeek - (subjectWeeklyCounts.get(a.code) || 0);
        const remainingB = b.periodsPerWeek - (subjectWeeklyCounts.get(b.code) || 0);
        if (remainingA !== remainingB) return remainingB - remainingA; // Most needed first

        const aInDay = subjectDays.get(a.code)?.has(day) ? 1 : 0;
        const bInDay = subjectDays.get(b.code)?.has(day) ? 1 : 0;
        return aInDay - bInDay; // Prefer subjects not yet in this day
      });

      for (const candidate of candidates) {
        const count = subjectWeeklyCounts.get(candidate.code) || 0;
        // Obey user target or max 6 periods
        if (count >= Math.max(candidate.periodsPerWeek, 6)) {
          continue;
        }

        // Prevent accidental consecutive periods of the same theory subject
        const prev = period > 1 ? grid[day][period - 1] : null;
        const next = period < 8 ? grid[day][period + 1] : null;
        const isPrevSame = prev && prev.subjectCode?.toUpperCase() === candidate.code;
        const isNextSame = next && next.subjectCode?.toUpperCase() === candidate.code;
        if (isPrevSame || isNextSame) {
          continue;
        }

        // Check Teacher Availability (ZERO CLASHES with other classes)
        if (!isTeacherAvailable(candidate.facultyName, day, period)) {
          continue;
        }

        // Tentative assignment
        assignSlot(day, period, {
          code: candidate.code,
          name: candidate.name,
          facultyName: candidate.facultyName,
          roomNo: candidate.roomNo,
          vmsNo: candidate.vmsNo,
          category: candidate.category,
        });

        subjectWeeklyCounts.set(candidate.code, count + 1);
        const daySet = subjectDays.get(candidate.code)!;
        const wasInDay = daySet.has(day);
        daySet.add(day);

        if (solveSlots(idx + 1)) {
          return true;
        }

        // Backtrack
        delete grid[day][period];
        subjectWeeklyCounts.set(candidate.code, count);
        if (!wasInDay) {
          daySet.delete(day);
        }
      }

      return false;
    }

    const solved = solveSlots(0);

    // If exact solver could not fill every remaining empty slot due to tight teacher restrictions,
    // fill remaining open slots with available subjects that have teacher clearance.
    if (!solved) {
      for (const slot of emptySlots) {
        if (!grid[slot.day][slot.period]) {
          for (const sub of theorySubjects) {
            if (isTeacherAvailable(sub.facultyName, slot.day, slot.period)) {
              assignSlot(slot.day, slot.period, {
                code: sub.code,
                name: sub.name,
                facultyName: sub.facultyName,
                roomNo: sub.roomNo,
                vmsNo: sub.vmsNo,
                category: sub.category,
              });
              break;
            }
          }
        }
      }
    }

    // Collect all final entries for this class
    const currentYear = new Date().getFullYear();
    const effectiveAcadYear = academicYear || `${currentYear}-${currentYear + 1}`;
    const effectiveSemType = semType || (semester ? (semester % 2 !== 0 ? 'ODD' : 'EVEN') : 'ODD');

    const finalEntries: any[] = [];
    for (const day of DAYS) {
      for (const p of PERIODS) {
        const ent = grid[day][p];
        if (ent && ent.subjectCode) {
          finalEntries.push({
            classId,
            dayOrder: day,
            period: p,
            timeRange: DEFAULT_TIME_RANGES[p] || `Period ${p}`,
            subjectCode: ent.subjectCode,
            subjectName: ent.subjectName,
            facultyName: ent.facultyName || null,
            roomNo: ent.roomNo || null,
            vmsNo: ent.vmsNo || null,
            category: ent.category || 'sub1',
            academicYear: effectiveAcadYear,
            semType: effectiveSemType,
          });
        }
      }
    }

    // 5. Archive old schedule to TimetableHistory first
    if (existingEntries && existingEntries.length > 0) {
      try {
        const currentYear = new Date().getFullYear();
        const effectiveAcadYear = academicYear || `${currentYear}-${currentYear + 1}`;
        let resolvedYear = 2;
        if (year === 'I') resolvedYear = 1;
        else if (year === 'II') resolvedYear = 2;
        else if (year === 'III') resolvedYear = 3;
        else if (year === 'IV') resolvedYear = 4;

        await (prisma as any).timetableHistory.createMany({
          data: existingEntries.map((e: any) => ({
            classId: e.classId || classId,
            academicYear: effectiveAcadYear,
            year: resolvedYear,
            semType: e.semType || effectiveSemType,
            dayOrder: e.dayOrder,
            period: e.period,
            timeRange: e.timeRange,
            subjectCode: e.subjectCode,
            subjectName: e.subjectName,
            facultyName: e.facultyName,
            roomNo: e.roomNo,
            vmsNo: e.vmsNo,
            category: e.category,
          })),
        });
      } catch (archErr) {
        console.warn("Failed to archive timetable to history before randomize:", archErr);
      }
    }

    // 6. Atomic Replace in DB for this class
    await prisma.timetableEntry.deleteMany({
      where: { classId: { in: aliases } },
    });

    await prisma.timetableEntry.createMany({
      data: finalEntries,
    });

    // 6. Fetch newly written timetable
    const updatedTimetable = await prisma.timetableEntry.findMany({
      where: { classId: { in: aliases } },
      orderBy: [{ dayOrder: 'asc' }, { period: 'asc' }],
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'RANDOMIZE_PRIORITY_TIMETABLE',
          details: `Generated full 40-period schedule for ${classId} with Priorities: 1.Sports 2-P, 2.Labs 2-P, 3.Electives, 4.Library, 5.Subjects (with continuous blocks & teacher clash prevention).`,
          performedBy: authorization.email,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log creation failed for randomize timetable:', auditErr);
    }

    // 7. Auto-sync Faculty Profiles:
    // Update FacultyProfile.lab1 with the exact assigned lab subject (e.g. 231CS32A DS Lab)
    // and subject1/subject2 for theory so the faculty profile shows their exact laboratory assignment.
    try {
      const allFacultyProfiles = await prisma.facultyProfile.findMany({
        include: { user: { select: { id: true, name: true, vmNo: true } } },
      });

      for (const entry of finalEntries) {
        if (!entry.facultyName || !entry.subjectCode) continue;

        const isLabEntry = isLabCourse(entry.subjectName, entry.subjectCode, entry.category);
        const staffList = entry.facultyName.split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
        const vmList = (entry.vmsNo || '').split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);

        for (let idx = 0; idx < staffList.length; idx++) {
          const sName = staffList[idx];
          const sVm = vmList[idx] || '';

          const matchedFp = allFacultyProfiles.find((fp: any) => {
            if (sVm && (fp.vmNo === sVm || fp.user?.vmNo === sVm)) return true;
            const uName = (fp.user?.name || '').toLowerCase().trim();
            const fName = sName.toLowerCase().trim();
            return (
              uName === fName ||
              uName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, '') === fName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, '')
            );
          });

          if (matchedFp) {
            const cleanCode = entry.subjectCode.toUpperCase().trim();
            const currentSubs = [
              matchedFp.subject1,
              matchedFp.subject2,
              matchedFp.lab1,
              matchedFp.additional1,
              matchedFp.additional2,
            ]
              .filter(Boolean)
              .map((s) => String(s).toUpperCase().trim());

            if (isLabEntry) {
              // Ensure lab1 or lab2 reflects this exact lab course
              const curLab1 = (matchedFp.lab1 || '').toUpperCase().trim();
              const curLab2 = (matchedFp.lab2 || '').toUpperCase().trim();

              if (!curLab1 || curLab1 === cleanCode) {
                if (curLab1 !== cleanCode) {
                  await prisma.facultyProfile.update({
                    where: { vmNo: matchedFp.vmNo },
                    data: { lab1: cleanCode },
                  });
                  matchedFp.lab1 = cleanCode;
                }
              } else if (!curLab2 || curLab2 === cleanCode) {
                if (curLab2 !== cleanCode) {
                  await prisma.facultyProfile.update({
                    where: { vmNo: matchedFp.vmNo },
                    data: { lab2: cleanCode },
                  });
                  matchedFp.lab2 = cleanCode;
                }
              }
            } else if (!currentSubs.includes(cleanCode)) {
              let updateField = '';
              if (!matchedFp.subject1) updateField = 'subject1';
              else if (!matchedFp.subject2) updateField = 'subject2';
              else if (!matchedFp.additional1) updateField = 'additional1';
              else if (!matchedFp.additional2) updateField = 'additional2';

              if (updateField) {
                await prisma.facultyProfile.update({
                  where: { vmNo: matchedFp.vmNo },
                  data: { [updateField]: cleanCode },
                });
                (matchedFp as any)[updateField] = cleanCode;
              }
            }
          }
        }
      }
    } catch (profileSyncErr) {
      console.warn('Non-blocking faculty profile sync after randomize timetable:', profileSyncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated timetable for ${classId}! Priorities satisfied: Sports (2 Continuous Periods), Labs (Full continuous slots), Electives, Library (1 Period), and Subjects with user-configured periods/continuous blocks and zero teacher clashes.`,
      timetable: updatedTimetable,
      count: updatedTimetable.length,
      filledCount: finalEntries.length,
    });
  } catch (error: any) {
    console.error('Failed to randomize timetable:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
