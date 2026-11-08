import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ success: false, error: "No student profile found." }, { status: 404 });
    }

    const yearStr = user.studentProfile.year?.trim() || "";
    const section = user.studentProfile.section?.trim() || "";
    const department = user.studentProfile.department?.trim() || "";
    const normalizedDept = department.replace(/^(B\.E\s+|B\.Tech\s+)/i, "").trim();
    const classId = yearStr && normalizedDept && section ? `${yearStr}-${normalizedDept}-${section}` : "";

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

    const possibleClasses = classId ? getClassAliases(classId) : [];

    let fullTimetable: any[] = [];
    try {
      if (possibleClasses.length) {
        fullTimetable = await prisma.timetableEntry.findMany({
          where: { classId: { in: possibleClasses } },
          orderBy: [{ dayOrder: "asc" }, { period: "asc" }],
        });
      }
    } catch (e) {
      console.error("Could not fetch timetable entries via prisma client", e);
    }

    // Group by Day Order
    const grouped: Record<string, any[]> = {
      "I": [], "II": [], "III": [], "IV": [], "V": [], UNASSIGNED: []
    };

    fullTimetable.forEach(entry => {
      const day = entry.dayOrder;
      (day && grouped[day] ? grouped[day] : grouped.UNASSIGNED).push(entry);
    });

    return NextResponse.json({
      success: true,
      data: {
        classId,
        timetable: grouped
      }
    });

  } catch (error: any) {
    console.error("Calendar API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
