import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDayOrderInfo } from "@/utils/dayOrder";

export const dynamic = "force-dynamic";

function computeStudentClassId(studentProfile: any): string {
  if (!studentProfile) return "";
  const semester = studentProfile.semester || 3; 
  let yearStr = "I";
  if (semester === 3 || semester === 4) yearStr = "II";
  if (semester === 5 || semester === 6) yearStr = "III";
  if (semester === 7 || semester === 8) yearStr = "IV";

  let rawDept = studentProfile.department || "CSE";
  let department = rawDept;
  let section = "A";

  const secMatch = rawDept.match(/\(Sec\s+([A-Z])\)/i);
  if (secMatch) {
    section = secMatch[1].toUpperCase();
    department = rawDept.replace(/\s*\(Sec\s+[A-Z]\)\s*/i, "").trim();
  }
  
  const normalizedDept = department.replace(/^(B\.E\s+|B\.Tech\s+)/i, "").trim();
  return `${yearStr}-${normalizedDept}-${section}`;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { facultyProfile: true, hodProfile: true }
    });

    if (!user) {
      const um = await prisma.userMode.findUnique({ where: { emailid: email } });
      if (um) {
        user = { name: um.emailid.split("@")[0] } as any;
      }
    }

    // Support dateString param or default to today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const todayString = dateParam || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const vmNo = user?.vmNo || user?.facultyProfile?.vmNo || user?.hodProfile?.vmNo;
    const cleanName = (user?.name || "").replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '').trim();
    const firstName = cleanName.split(/\s+/)[0] || "";

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

    const { currentDayOrder } = await getDayOrderInfo();

    // Fetch the teacher's full timetable (to know which students they teach)
    const teacherTimetable = await prisma.timetableEntry.findMany({
      where: orConditions.length > 0 ? { OR: orConditions } : {},
      orderBy: [
        { dayOrder: "asc" },
        { period: "asc" }
      ]
    });

    // Today's specific classes for the teacher (for active day order)
    let todayClasses = teacherTimetable.filter(t => t.dayOrder === currentDayOrder);
    // If today is a holiday / no classes scheduled for currentDayOrder, provide fallback so teacher can still choose a slot
    if (todayClasses.length === 0 && teacherTimetable.length > 0) {
      todayClasses = teacherTimetable.slice(0, 8);
    }
    todayClasses.sort((a, b) => (a.period ?? Number.MAX_SAFE_INTEGER) - (b.period ?? Number.MAX_SAFE_INTEGER));

    const teacherClasses = new Set(teacherTimetable.map(t => t.classId).filter(Boolean));

    // Fetch all users with role STUDENT
    const allStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT"
      },
      include: {
        studentProfile: true
      },
      orderBy: {
        name: "asc"
      }
    });

    // Filter students to include those in teacher's classes (or all students if no explicit class restriction)
    let students = allStudents
      .map(student => ({
         ...student,
         computedClassId: computeStudentClassId(student.studentProfile)
      }))
      .filter(student => teacherClasses.size === 0 || teacherClasses.has(student.computedClassId));

    if (students.length === 0 && allStudents.length > 0) {
      // Fallback so teachers can always see students
      students = allStudents.map(student => ({
        ...student,
        computedClassId: computeStudentClassId(student.studentProfile)
      }));
    }

    // Fetch attendance records for this date
    const attendance = await prisma.attendance.findMany({
      where: {
        dateString: todayString
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        students,
        todayClasses,
        attendance,
        dateString: todayString
      }
    });

  } catch (error: any) {
    console.error("Teacher Students API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
