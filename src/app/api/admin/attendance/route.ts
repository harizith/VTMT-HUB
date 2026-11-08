import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("dateString") || searchParams.get("date");
    const classId = searchParams.get("classId");
    const department = searchParams.get("department");

    const where: any = {};
    if (dateString) where.dateString = dateString;
    if (classId) where.classId = classId;
    if (department && department !== "ALL") {
      where.classId = { contains: department, mode: "insensitive" };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: [{ dateString: "desc" }, { period: "asc" }],
      take: 500
    });

    const total = records.length;
    const present = records.filter(r => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const absent = records.filter(r => r.status === "ABSENT").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Class-wise summary
    const classMap: Record<string, { total: number; present: number; absent: number }> = {};
    records.forEach(r => {
      if (!classMap[r.classId]) {
        classMap[r.classId] = { total: 0, present: 0, absent: 0 };
      }
      classMap[r.classId].total++;
      if (r.status === "PRESENT" || r.status === "ON_DUTY") classMap[r.classId].present++;
      else if (r.status === "ABSENT") classMap[r.classId].absent++;
    });

    const classSummaries = Object.entries(classMap).map(([cid, stats]) => ({
      classId: cid,
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        records,
        summary: {
          total,
          present,
          absent,
          percentage
        },
        classSummaries
      }
    });
  } catch (error: any) {
    console.error("Admin Attendance API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

