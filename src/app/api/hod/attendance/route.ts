import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "HOD" && role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentCode = searchParams.get("departmentCode");
    const dateString = searchParams.get("dateString") || searchParams.get("date");
    const classId = searchParams.get("classId");

    const where: any = {};
    if (dateString) where.dateString = dateString;
    if (classId) where.classId = classId;
    if (departmentCode && departmentCode !== "ALL") {
      where.classId = { contains: departmentCode, mode: "insensitive" };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: [{ dateString: "desc" }, { period: "asc" }],
      take: 200
    });

    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const absentCount = records.filter(r => r.status === "ABSENT").length;
    const overallPercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        records,
        summary: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          overallPercentage
        }
      }
    });
  } catch (error: any) {
    console.error("HOD Attendance API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

