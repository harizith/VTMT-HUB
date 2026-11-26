import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalizeDept(dept?: string | null): string {
  return (dept || "")
    .replace(/^(B\.E\.?\s+|B\.Tech\.?\s+)/i, "")
    .trim()
    .toUpperCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const hodUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        hodProfile: { select: { department: true } },
        facultyProfile: { select: { department: true } },
      },
    });

    const hodDeptRaw = hodUser?.hodProfile?.department || hodUser?.facultyProfile?.department || "CSE";
    const hodDeptNorm = normalizeDept(hodDeptRaw);

    const allStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        vmNo: true,
        studentProfile: {
          select: {
            rollNumber: true,
            department: true,
            semester: true,
            year: true,
            section: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const deptStudents = allStudents.filter(
      (s) => normalizeDept(s.studentProfile?.department) === hodDeptNorm
    );

    const studentIdentifiers = Array.from(
      new Set(
        deptStudents.flatMap((s) => [s.vmNo, s.email, s.id].filter((v): v is string => Boolean(v)))
      )
    );

    const attendanceRecords = studentIdentifiers.length
      ? await prisma.attendance.findMany({
          where: { studentId: { in: studentIdentifiers } },
          select: { studentId: true, status: true },
        })
      : [];

    const statsByKey = new Map<string, { total: number; present: number; od: number; absent: number }>();
    for (const rec of attendanceRecords) {
      const key = rec.studentId.toLowerCase();
      const entry = statsByKey.get(key) || { total: 0, present: 0, od: 0, absent: 0 };
      entry.total += 1;
      if (rec.status === "PRESENT") entry.present += 1;
      else if (rec.status === "ON_DUTY") entry.od += 1;
      else entry.absent += 1;
      statsByKey.set(key, entry);
    }

    const students = deptStudents.map((s) => {
      const sp = s.studentProfile;
      const yr =
        sp?.year?.trim() ||
        (sp?.semester && sp.semester <= 2
          ? "I"
          : sp?.semester && sp.semester <= 4
          ? "II"
          : sp?.semester && sp.semester <= 6
          ? "III"
          : "IV");
      const dept = normalizeDept(sp?.department) || hodDeptNorm;
      const sec = (sp?.section || "A").toUpperCase();
      const classId = `${yr}-${dept}-${sec}`;

      const keys = [s.vmNo, s.email, s.id].filter((v): v is string => Boolean(v));
      let total = 0;
      let present = 0;
      let od = 0;
      let absent = 0;
      for (const k of keys) {
        const st = statsByKey.get(k.toLowerCase());
        if (st) {
          total += st.total;
          present += st.present;
          od += st.od;
          absent += st.absent;
        }
      }

      const attended = present + od;
      const attendancePercentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        vmNo: s.vmNo || "",
        rollNumber: sp?.rollNumber || s.vmNo || "",
        department: sp?.department || hodDeptRaw,
        year: yr,
        section: sec,
        semester: sp?.semester || null,
        classId,
        totalClasses: total,
        presentClasses: present,
        odClasses: od,
        absentClasses: absent,
        attendancePercentage,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        department: hodDeptRaw,
        students,
      },
    });
  } catch (error: any) {
    console.error("HOD Student Attendance API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
