import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Only staff may mark attendance; students must not be able to alter records
    const role = String((session.user as any).role || "").toUpperCase();
    if (!["TEACHER", "FACULTY", "STAFF", "HOD", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const email = session.user.email;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const um = await prisma.userMode.findUnique({ where: { emailid: email } });
      if (um) user = { name: um.emailid.split("@")[0] } as any;
    }
    const facultyName = user?.name?.trim() || "Unknown";

    // Support bulk marking: { batch: [{ studentId, classId, dateString, dayOrder, period, subjectCode, status }] }
    if (body.batch && Array.isArray(body.batch)) {
      const results = [];
      for (const item of body.batch) {
        if (!item.studentId || !item.classId || !item.dateString || !item.period || !item.subjectCode) {
          continue;
        }
        const record = await prisma.attendance.upsert({
          where: {
            studentId_dateString_period: {
              studentId: item.studentId,
              dateString: item.dateString,
              period: Number(item.period)
            }
          },
          update: {
            status: item.status
          },
          create: {
            studentId: item.studentId,
            classId: item.classId,
            dateString: item.dateString,
            dayOrder: String(item.dayOrder || "Unknown"),
            period: Number(item.period),
            subjectCode: item.subjectCode,
            facultyName,
            status: item.status
          }
        });
        results.push(record);
      }
      return NextResponse.json({ success: true, count: results.length, data: results });
    }

    const { studentId, classId, dateString, dayOrder, period, subjectCode, status } = body;

    if (!studentId || !classId || !dateString || !period || !subjectCode) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Upsert single attendance record
    const record = await prisma.attendance.upsert({
      where: {
        studentId_dateString_period: {
          studentId,
          dateString,
          period: Number(period)
        }
      },
      update: {
        status
      },
      create: {
        studentId,
        classId,
        dateString,
        dayOrder: String(dayOrder || "Unknown"),
        period: Number(period),
        subjectCode,
        facultyName,
        status
      }
    });

    return NextResponse.json({ success: true, data: record });

  } catch (error: any) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
