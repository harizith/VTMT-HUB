import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function getClassAliases(classId: string): string[] {
  const aliases = new Set<string>([classId]);
  
  // Bridge semester roman numerals to academic year roman numerals without cross-contamination:
  // "IV-CSE-A" <-> "VII-CSE-A" (4th Year = Sem 7/8)
  // "III-CSE-A" <-> "V-CSE-A" (3rd Year = Sem 5/6)
  // "II-CSE-A" (2nd Year = Sem 3/4)
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const facultyName = searchParams.get('facultyName');
    const listOptions = searchParams.get('list');
    const viewHistory = searchParams.get('history') === 'true';
    const academicYear = searchParams.get('academicYear');
    const yearParam = searchParams.get('year');
    const semesterType = searchParams.get('semesterType'); // 'ODD' or 'EVEN'

    // Query historical snapshots for a class or all classes
    if (viewHistory) {
      const historyWhere: any = {};
      if (classId) {
        historyWhere.classId = { in: getClassAliases(classId) };
      }
      if (academicYear && academicYear !== 'ALL') {
        historyWhere.academicYear = { contains: academicYear };
      }
      if (yearParam && yearParam !== 'ALL') {
        const parsedYear = Number.parseInt(yearParam, 10);
        if ([1, 2, 3, 4].includes(parsedYear)) {
          historyWhere.year = parsedYear;
        }
      }
      if (semesterType && semesterType !== 'ALL') {
        historyWhere.semType = semesterType;
      }

      const historyEntries = await (prisma as any).timetableHistory.findMany({
        where: historyWhere,
        orderBy: [{ dayOrder: 'asc' }, { period: 'asc' }],
      });

      // Group by academicYear + classId + year + semType for clean viewing
      const versionsMap: Record<string, any> = {};
      for (const entry of historyEntries) {
        const vKey = `${entry.classId || 'ALL'}_${entry.academicYear || 'DEFAULT'}_Y${entry.year || 1}_${entry.semType || 'ODD'}`;
        if (!versionsMap[vKey]) {
          versionsMap[vKey] = {
            versionId: vKey,
            classId: entry.classId,
            academicYear: entry.academicYear,
            year: entry.year,
            semType: entry.semType,
            entriesCount: 0,
            entries: [],
          };
        }
        versionsMap[vKey].entriesCount += 1;
        versionsMap[vKey].entries.push(entry);
      }

      const versions = Object.values(versionsMap);
      return NextResponse.json({ success: true, history: historyEntries, versions });
    }

    // Return available options (classes & faculty & academic years & semTypes) for filter dropdowns
    if (listOptions === 'options' || (!classId && !facultyName)) {
      const distinctClasses = await prisma.timetableEntry.findMany({
        select: { classId: true },
        distinct: ['classId'],
        orderBy: { classId: 'asc' },
      });

      // Fetch distinct Academic Years & SemTypes from both active entries & history
      const [entryYears, historyYears, entrySemTypes, historySemTypes] = await Promise.all([
        (prisma as any).timetableEntry.findMany({
          select: { academicYear: true },
          distinct: ['academicYear'],
          where: { academicYear: { not: null } },
        }).catch(() => []),
        (prisma as any).timetableHistory.findMany({
          select: { academicYear: true },
          distinct: ['academicYear'],
          where: { academicYear: { not: null } },
        }).catch(() => []),
        (prisma as any).timetableEntry.findMany({
          select: { semType: true },
          distinct: ['semType'],
          where: { semType: { not: null } },
        }).catch(() => []),
        (prisma as any).timetableHistory.findMany({
          select: { semType: true },
          distinct: ['semType'],
          where: { semType: { not: null } },
        }).catch(() => []),
      ]);

      const academicYearsSet = new Set<string>();
      entryYears.forEach((y: any) => { if (y.academicYear) academicYearsSet.add(y.academicYear.trim()); });
      historyYears.forEach((y: any) => { if (y.academicYear) academicYearsSet.add(y.academicYear.trim()); });

      const semTypesSet = new Set<string>();
      entrySemTypes.forEach((s: any) => { if (s.semType) semTypesSet.add(s.semType.trim().toUpperCase()); });
      historySemTypes.forEach((s: any) => { if (s.semType) semTypesSet.add(s.semType.trim().toUpperCase()); });

      // Extract sections, years, departments present in DB classIds
      const validClassIds = distinctClasses.map((c) => c.classId).filter(Boolean) as string[];
      const dbDepartments = new Set<string>();
      const dbYears = new Set<string>();
      const dbSections = new Set<string>();

      for (const cid of validClassIds) {
        const parts = cid.split('-');
        if (parts.length >= 3) {
          dbYears.add(parts[0].toUpperCase());
          dbDepartments.add(parts[1].toUpperCase());
          dbSections.add(parts[2].toUpperCase());
        }
      }

      // 1. Fetch all registered faculty and HOD from user database
      const registeredTeachers = await prisma.user.findMany({
        where: { role: { in: ['FACULTY', 'HOD'] } },
        select: { name: true, vmNo: true },
        orderBy: { name: 'asc' },
      });

      // 2. Fetch distinct faculty strings from timetable entries
      const ttEntries = await prisma.timetableEntry.findMany({
        select: { facultyName: true, vmsNo: true },
        distinct: ['facultyName'],
      });

      // Canonical dictionary of lowercase names -> { name, vmsNo }
      const facultyMap = new Map<string, { name: string; vmsNo: string | null }>();

      // Register official users first
      for (const t of registeredTeachers) {
        if (!t.name) continue;
        const key = t.name.trim().toLowerCase();
        facultyMap.set(key, { name: t.name.trim(), vmsNo: t.vmNo || null });
      }

      // Deconstruct any multi-staff entries (like lab sessions) and add external trainers
      for (const entry of ttEntries) {
        if (!entry.facultyName) continue;
        const subNames = entry.facultyName.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
        const subVms = (entry.vmsNo || '').split(/[,/]+/).map((s) => s.trim()).filter(Boolean);

        subNames.forEach((n, idx) => {
          const key = n.toLowerCase();
          // Check if already in map by exact name
          if (!facultyMap.has(key)) {
            // Check if matches any existing user by partial comparison
            const existingKey = Array.from(facultyMap.keys()).find(k => {
              const cleanA = k.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '').trim();
              const cleanB = key.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '').trim();
              return cleanA === cleanB;
            });

            if (existingKey) {
              const item = facultyMap.get(existingKey)!;
              if (!item.vmsNo && subVms[idx]) {
                item.vmsNo = subVms[idx];
              }
            } else {
              facultyMap.set(key, {
                name: n,
                vmsNo: subVms[idx] || null,
              });
            }
          } else if (!facultyMap.get(key)!.vmsNo && subVms[idx]) {
            facultyMap.get(key)!.vmsNo = subVms[idx];
          }
        });
      }

      const sortedFaculty = Array.from(facultyMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      if (!classId && !facultyName) {
        return NextResponse.json({
          success: true,
          options: {
            classes: distinctClasses.map((c) => c.classId),
            faculty: sortedFaculty,
            academicYears: Array.from(academicYearsSet).sort().reverse(),
            semTypes: Array.from(semTypesSet).sort(),
            departments: Array.from(dbDepartments).sort(),
            years: Array.from(dbYears).sort(),
            sections: Array.from(dbSections).sort(),
          },
        });
      }
    }

    let timetable: any[] = [];

    if (facultyName) {
      const cleanFac = facultyName.trim();
      const facLower = cleanFac.toLowerCase();
      // Query by faculty name or vmsNo
      const rawTimetable = await prisma.timetableEntry.findMany({
        where: {
          OR: [
            { facultyName: { contains: cleanFac, mode: 'insensitive' } },
            { vmsNo: { contains: cleanFac } },
          ],
        },
        orderBy: [{ dayOrder: 'asc' }, { period: 'asc' }],
      });

      // Filter exact staff token to prevent partial name overlap (e.g. "Ram" matching "Ramesh")
      timetable = rawTimetable.filter((entry) => {
        if (entry.vmsNo) {
          const vms = entry.vmsNo.split(/[,/]+/).map((v: string) => v.trim().toLowerCase());
          if (vms.includes(facLower)) return true;
        }
        if (entry.facultyName) {
          const staff = entry.facultyName.split(/[,/]+/).map((s: string) => s.trim().toLowerCase());
          return staff.some((s: string) => {
            if (s === facLower) return true;
            const strippedS = s.replace(/^(dr|mr|ms|mrs)\.?\s*/i, '');
            const strippedTarget = facLower.replace(/^(dr|mr|ms|mrs)\.?\s*/i, '');
            return strippedS === strippedTarget;
          });
        }
        return false;
      });

      return NextResponse.json({ success: true, timetable, mode: 'faculty', facultyName });
    }

    if (classId) {
      const aliases = getClassAliases(classId);
      const queryWhere: any = {
        classId: { in: aliases },
      };

      if (academicYear && academicYear !== 'ALL') {
        queryWhere.academicYear = academicYear;
      }
      if (semesterType && semesterType !== 'ALL') {
        queryWhere.semType = semesterType;
      }

      timetable = await prisma.timetableEntry.findMany({
        where: queryWhere,
        orderBy: [{ dayOrder: 'asc' }, { period: 'asc' }],
      });

      return NextResponse.json({ success: true, timetable, mode: 'class', classId, matchedAliases: aliases });
    }

    return NextResponse.json({ success: false, error: 'classId or facultyName is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to fetch timetable:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const body = await request.json();
    const { classId, entries, academicYear, year, semType } = body;

    if (!classId || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: 'classId and entries array are required' }, { status: 400 });
    }

    const aliases = getClassAliases(classId);

    // Compute year (1, 2, 3, 4) from classId or passed param
    let resolvedYear: number = typeof year === 'number' && [1, 2, 3, 4].includes(year) ? year : 2;
    if (classId.startsWith('I-')) resolvedYear = 1;
    else if (classId.startsWith('II-')) resolvedYear = 2;
    else if (classId.startsWith('III-')) resolvedYear = 3;
    else if (classId.startsWith('IV-')) resolvedYear = 4;

    // 1. Fetch current existing entries to archive in history FIRST
    const existingEntries = await prisma.timetableEntry.findMany({
      where: { classId: { in: aliases } },
    });

    let historyArchivedCount = 0;
    if (existingEntries.length > 0) {
      try {
        const histResult = await (prisma as any).timetableHistory.createMany({
          data: existingEntries.map((e: any) => ({
            classId: e.classId || classId,
            academicYear: e.academicYear || academicYear || null,
            year: resolvedYear,
            semType: e.semType || semType || 'ODD',
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
        historyArchivedCount = histResult.count || existingEntries.length;
      } catch (histErr: any) {
        console.warn('Timetable history archival warning:', histErr?.message || histErr);
      }
    }

    // 2. Clear old master timetable entries
    await prisma.timetableEntry.deleteMany({
      where: { classId: { in: aliases } },
    });

    // 3. Store new updated timetable entries in master timetable
    const inserted = await prisma.timetableEntry.createMany({
      data: entries.map((entry: any) => ({
        classId,
        dayOrder: entry.dayOrder,
        period: entry.period,
        timeRange: entry.timeRange || null,
        subjectCode: entry.subjectCode || null,
        subjectName: entry.subjectName || null,
        facultyName: entry.facultyName || null,
        roomNo: entry.roomNo || null,
        vmsNo: typeof entry.vmsNo === 'string' ? entry.vmsNo.trim() || null : null,
        category: entry.category || null,
        academicYear: entry.academicYear || academicYear || null,
        semType: entry.semType || semType || 'ODD',
      })),
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'TIMETABLE_UPDATE_WITH_HISTORY',
          details: `Updated schedule for ${classId} (${inserted.count} periods active). Archived ${historyArchivedCount} previous periods to history.`,
          performedBy: authorization.email || 'Admin',
        },
      });
    } catch {
      // Audit log non-blocking
    }

    return NextResponse.json({ 
      success: true, 
      count: inserted.count, 
      historyArchived: historyArchivedCount 
    });
  } catch (error: any) {
    console.error('Failed to update timetable:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const facultyName = searchParams.get('facultyName');

    if (facultyName) {
      const deleted = await prisma.timetableEntry.deleteMany({
        where: { facultyName: { contains: facultyName.trim(), mode: 'insensitive' } },
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (!classId) {
      return NextResponse.json({ success: false, error: 'classId or facultyName is required' }, { status: 400 });
    }

    const aliases = getClassAliases(classId);
    const deleted = await prisma.timetableEntry.deleteMany({
      where: { classId: { in: aliases } },
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error('Failed to delete timetable:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
