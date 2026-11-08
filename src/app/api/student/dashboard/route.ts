import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDayOrderInfo } from "@/utils/dayOrder";


export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;

    // 1. Fetch the logged in user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ 
        success: false, 
        error: "No student profile found in the database. Please create one in the Admin mode." 
      }, { status: 404 });
    }

    const semester = user.studentProfile.semester;
    const yearStr = user.studentProfile.year?.trim() || "";
    const section = user.studentProfile.section?.trim() || "";
    const department = user.studentProfile.department?.trim() || "";
    const normalizedDept = department.replace(/^(B\.E\s+|B\.Tech\s+)/i, "").trim();
    const classId = yearStr && normalizedDept && section ? `${yearStr}-${normalizedDept}-${section}` : "";

    // Helper: get aliases for classId (e.g. "II-CSE-A" <-> "2-CSE-A", "IV-CSE-A" <-> "VII-CSE-A")
    function getClassAliases(cid: string): string[] {
      if (!cid) return [];
      const aliases = new Set<string>([cid]);
      const parts = cid.split('-');
      if (parts.length >= 3) {
        const yearOrSem = parts[0].toUpperCase();
        const dept = parts[1];
        const sec = parts[2];
        if (yearOrSem === 'IV' || yearOrSem === 'VII' || yearOrSem === 'VIII' || yearOrSem === '4') {
          aliases.add(`IV-${dept}-${sec}`);
          aliases.add(`VII-${dept}-${sec}`);
          aliases.add(`VIII-${dept}-${sec}`);
          aliases.add(`4-${dept}-${sec}`);
        } else if (yearOrSem === 'III' || yearOrSem === 'V' || yearOrSem === 'VI' || yearOrSem === '3') {
          aliases.add(`III-${dept}-${sec}`);
          aliases.add(`V-${dept}-${sec}`);
          aliases.add(`VI-${dept}-${sec}`);
          aliases.add(`3-${dept}-${sec}`);
        } else if (yearOrSem === 'II' || yearOrSem === '2') {
          aliases.add(`II-${dept}-${sec}`);
          aliases.add(`2-${dept}-${sec}`);
          aliases.add(`III-${dept}-${sec}`);
          aliases.add(`IV-${dept}-${sec}`);
        } else if (yearOrSem === 'I' || yearOrSem === '1') {
          aliases.add(`I-${dept}-${sec}`);
          aliases.add(`1-${dept}-${sec}`);
        }
      }
      return Array.from(aliases);
    }

    const classAliases = getClassAliases(classId);

    // 3. Compute Day Order dynamically
    const { currentDayOrder, tomorrowDayOrder } = await getDayOrderInfo();

    // 4. Fetch the timetable for the student's class and current day order
    let timetable: any[] = [];
    let fullTimetable: Record<string, any[]> = { "I": [], "II": [], "III": [], "IV": [], "V": [], UNASSIGNED: [] };
    try {
      const allEntries = classAliases.length ? await prisma.timetableEntry.findMany({
        where: { classId: { in: classAliases } },
        orderBy: [{ dayOrder: "asc" }, { period: "asc" }],
      }) : [];

      allEntries.forEach((entry: any) => {
        const day = entry.dayOrder;
        (day && fullTimetable[day] ? fullTimetable[day] : fullTimetable.UNASSIGNED).push(entry);
        if (entry.dayOrder === currentDayOrder) timetable.push(entry);
      });
      // Sort today's timetable by period
      timetable.sort((a, b) => a.period - b.period);
    } catch (e) {
      console.error("Could not fetch timetable entries via prisma client", e);
    }

    let notices: any[] = [];
    try {
      const studentIds: string[] = [email];
      if (user?.id) studentIds.push(user.id);
      if (user?.vmNo) studentIds.push(user.vmNo);
      if (user?.studentProfile?.rollNumber) studentIds.push(user.studentProfile.rollNumber);

      const studentDept = user?.studentProfile?.department || null;

      notices = await prisma.notice.findMany({
        where: {
          OR: [
            { audience: 'ALL' },
            { audience: 'STUDENT' },
            { 
              audience: 'SPECIFIC_STUDENT',
              targetStudentId: { in: studentIds }
            }
          ],
          AND: studentDept ? [
            {
              OR: [
                { department: null },
                { department: "" },
                { department: studentDept }
              ]
            }
          ] : []
        } as any,
        orderBy: { createdAt: 'desc' },
        take: 5
      });
    } catch (e) {
      console.error("Could not fetch notices", e);
    }

    // 5. Query and aggregate Attendance records for this student
    let attendanceSummary = {
      percentage: 0,
      totalPeriods: 0,
      attendedPeriods: 0,
      presentPeriods: 0,
      absentPeriods: 0,
      odPeriods: 0,
      hasRecords: false,
      subjectWise: [] as { subjectCode: string; total: number; attended: number; percentage: number }[],
    };

    try {
      const studentIds = [
        user.id,
        user.email,
        user.vmNo,
        user.studentProfile?.rollNumber,
      ].filter(Boolean) as string[];

      const records = await prisma.attendance.findMany({
        where: {
          studentId: { in: studentIds },
        },
        orderBy: { dateString: "desc" },
      });

      if (records.length > 0) {
        const totalPeriods = records.length;
        const presentPeriods = records.filter((r: any) => {
          const st = (r.status || "").trim().toUpperCase();
          return st === "PRESENT";
        }).length;
        const odPeriods = records.filter((r: any) => {
          const st = (r.status || "").trim().toUpperCase();
          return st === "ON_DUTY" || st === "OD";
        }).length;
        const absentPeriods = records.filter((r: any) => {
          const st = (r.status || "").trim().toUpperCase();
          return st === "ABSENT";
        }).length;
        const attendedPeriods = presentPeriods + odPeriods;
        const percentage = totalPeriods > 0 ? Math.round((attendedPeriods / totalPeriods) * 100) : 0;

        // Subject-wise breakdown
        const subjectMap: Record<string, { total: number; attended: number }> = {};
        records.forEach((r: any) => {
          const code = r.subjectCode || "GENERAL";
          if (!subjectMap[code]) {
            subjectMap[code] = { total: 0, attended: 0 };
          }
          subjectMap[code].total++;
          const st = (r.status || "").trim().toUpperCase();
          if (st === "PRESENT" || st === "ON_DUTY" || st === "OD") {
            subjectMap[code].attended++;
          }
        });

        const subjectWise = Object.entries(subjectMap)
          .map(([subjectCode, s]) => ({
            subjectCode,
            total: s.total,
            attended: s.attended,
            percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
          }))
          .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));

        attendanceSummary = {
          percentage,
          totalPeriods,
          attendedPeriods,
          presentPeriods,
          absentPeriods,
          odPeriods,
          hasRecords: true,
          subjectWise,
        };
      }
    } catch (attErr) {
      console.error("Could not fetch student attendance records:", attErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          name: user.name,
          vmNo: user.vmNo || "",
          department: department,
          semester: semester,
          section: section,
          classId: classId
        },
        currentDayOrder,
        tomorrowDayOrder,
        timetable,
        fullTimetable,
        notices,
        attendance: attendanceSummary
      }
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
