import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "HOD" && (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentCode = searchParams.get("departmentCode");

    if (!departmentCode) {
      return NextResponse.json({ success: false, error: "Department required" }, { status: 400 });
    }

    // Fetch all students in the department
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        studentProfile: { department: departmentCode }
      },
      include: { studentProfile: true }
    });

    // Fetch all attendance for the department's classes (simple implementation: last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const attendance = await prisma.attendance.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        // Match classId containing departmentCode (e.g. "II-CSE-A" contains "CSE")
        classId: { contains: departmentCode, mode: "insensitive" } 
      }
    });

    return NextResponse.json({ success: true, data: { students, attendance } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
