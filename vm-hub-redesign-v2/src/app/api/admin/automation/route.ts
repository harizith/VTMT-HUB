import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDayOrderInfo } from "@/utils/dayOrder";
import { requireAdmin } from '@/lib/adminAuth';

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    // 1. Get Day Order info
    const dayOrderInfo = await getDayOrderInfo();

    // 2. Fetch all timetable entries to check for clashes
    const entries = await prisma.timetableEntry.findMany();

    // Check for room / faculty double booking
    // Map key: `${dayOrder}-${period}-${roomNo}` or `${dayOrder}-${period}-${facultyName}`
    const roomMap = new Map<string, any[]>();
    const facultyMap = new Map<string, any[]>();

    const clashes: any[] = [];

    for (const e of entries) {
      if (!e.roomNo || e.roomNo === "N/A" || e.roomNo.includes("Bay")) continue;

      const roomKey = `${e.dayOrder}-${e.period}-${e.roomNo.trim()}`;
      if (!roomMap.has(roomKey)) roomMap.set(roomKey, []);
      roomMap.get(roomKey)!.push(e);

      if (e.facultyName && e.facultyName !== "Unknown" && !e.facultyName.includes("/")) {
        const facultyKey = `${e.dayOrder}-${e.period}-${e.facultyName.trim()}`;
        if (!facultyMap.has(facultyKey)) facultyMap.set(facultyKey, []);
        facultyMap.get(facultyKey)!.push(e);
      }
    }

    // Evaluate room clashes
    for (const [key, list] of roomMap.entries()) {
      if (list.length > 1) {
        const uniqueClasses = Array.from(new Set(list.map(l => l.classId)));
        if (uniqueClasses.length > 1) {
          clashes.push({
            type: "Room Double Booking",
            description: `Room '${list[0].roomNo}' is assigned to multiple classes (${uniqueClasses.join(", ")}) on Day Order ${list[0].dayOrder}, Period ${list[0].period}.`
          });
        }
      }
    }

    // Evaluate faculty clashes
    for (const [key, list] of facultyMap.entries()) {
      if (list.length > 1) {
        const uniqueClasses = Array.from(new Set(list.map(l => l.classId)));
        if (uniqueClasses.length > 1) {
          clashes.push({
            type: "Faculty Overlap",
            description: `Faculty '${list[0].facultyName}' is scheduled in multiple classes (${uniqueClasses.join(", ")}) on Day Order ${list[0].dayOrder}, Period ${list[0].period}.`
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        currentDayOrder: dayOrderInfo.currentDayOrder,
        tomorrowDayOrder: dayOrderInfo.tomorrowDayOrder,
        totalTimetableSlots: entries.length,
        clashes
      }
    });

  } catch (error: any) {
    console.error("Automation audit error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
