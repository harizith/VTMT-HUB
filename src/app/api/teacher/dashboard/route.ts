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
    let user = await prisma.user.findUnique({
      where: { email },
      include: { facultyProfile: true }
    });

    // Fallback: If not found in User, they might be in UserMode (from older schema)
    if (!user) {
      const um = await prisma.userMode.findUnique({ where: { emailid: email }});
      if (um) {
        user = {
          name: um.emailid.split("@")[0],
          vmNo: um.vmno,
          email: um.emailid,
          role: um.usermode.toUpperCase(),
          facultyProfile: {
             department: null,
             designation: null,
             vmNo: um.vmno
          }
        } as any;
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "No teacher profile found in the database. Please create one in the Admin mode." 
      }, { status: 404 });
    }

    // 3. Compute Day Order dynamically
    const { currentDayOrder, tomorrowDayOrder } = await getDayOrderInfo();

    // 4. Fetch today's timetable by VM number or Faculty Name
    const vmNo = user.vmNo || user.facultyProfile?.vmNo;
    const cleanName = user.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '').trim();
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0];

    let timetable: any[] = [];
    let fullTimetable: Record<string, any[]> = { "I": [], "II": [], "III": [], "IV": [], "V": [], UNASSIGNED: [] };

    try {
      const orConditions: any[] = [];
      if (vmNo && vmNo.trim()) {
        orConditions.push({ vmsNo: { contains: vmNo.trim() } });
      }
      if (firstName && firstName.length >= 3) {
        orConditions.push({ facultyName: { contains: firstName, mode: "insensitive" } });
      }
      if (cleanName && cleanName.length >= 3) {
        orConditions.push({ facultyName: { contains: cleanName, mode: "insensitive" } });
      }

      if (orConditions.length > 0) {
        const rawEntries = await prisma.timetableEntry.findMany({
          where: { OR: orConditions },
          orderBy: [
            { dayOrder: "asc" },
            { period: "asc" }
          ]
        });

        // Deduplicate & consolidate multi-section slots for same period & day order
        const map = new Map<string, any>();
        for (const e of rawEntries) {
          const key = `${e.dayOrder}-${e.period}`;
          if (!map.has(key)) {
            map.set(key, {
              ...e,
              classIds: e.classId ? [e.classId] : [],
              roomNos: e.roomNo ? [e.roomNo] : []
            });
          } else {
            const existing = map.get(key);
            if (e.classId && !existing.classIds.includes(e.classId)) {
              existing.classIds.push(e.classId);
            }
            if (e.roomNo && !existing.roomNos.includes(e.roomNo)) {
              existing.roomNos.push(e.roomNo);
            }
          }
        }

        const consolidated = Array.from(map.values()).map(e => ({
          ...e,
          classId: e.classIds.join(', '),
          roomNo: e.roomNos.join(' / ')
        }));

        consolidated.forEach((entry: any) => {
          const day = entry.dayOrder;
          (day && fullTimetable[day] ? fullTimetable[day] : fullTimetable.UNASSIGNED).push(entry);
          if (entry.dayOrder === currentDayOrder) {
            timetable.push(entry);
          }
        });
        timetable.sort((a, b) => a.period - b.period);
      }
    } catch (e) {
      console.error("Could not fetch timetable entries", e);
    }

    let notices: any[] = [];
    try {
      notices = await prisma.notice.findMany({
        where: {
          OR: [
            { audience: 'ALL' },
            { audience: 'FACULTY' }
          ]
        } as any,
        orderBy: { createdAt: 'desc' },
        take: 3
      });
    } catch (e) {
      console.error("Could not fetch notices", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          name: user.name,
          vmNo,
          department: user.facultyProfile?.department || "",
          designation: user.facultyProfile?.designation || ""
        },
        currentDayOrder,
        tomorrowDayOrder,
        timetable,
        fullTimetable,
        notices
      }
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
