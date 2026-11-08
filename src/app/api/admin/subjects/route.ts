import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, requireSession } from '@/lib/adminAuth';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/subjects
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(req.url);
    const departmentFilter = searchParams.get("department");
    const semesterFilter = searchParams.get("semester");

    const whereClause: any = {};
    if (departmentFilter && departmentFilter !== "ALL") {
      whereClause.departmentCode = departmentFilter.toUpperCase().trim();
    }
    if (semesterFilter && semesterFilter !== "ALL") {
      const semNum = parseInt(semesterFilter);
      if (!isNaN(semNum)) whereClause.semester = semNum;
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      orderBy: [{ departmentCode: "asc" }, { semester: "asc" }, { code: "asc" }]
    });

    // Also fetch timetable mappings to know who takes/handles this and room allocations
    let timetableEntries: any[] = [];
    try {
      timetableEntries = await prisma.timetableEntry.findMany({
        select: {
          subjectCode: true,
          classId: true,
          facultyName: true,
          vmsNo: true,
          roomNo: true,
          dayOrder: true,
          period: true,
          timeRange: true
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Also fetch faculty members who have this subject mapped in their profile
    let facultyUsers: any[] = [];
    try {
      facultyUsers = await prisma.user.findMany({
        where: {
          role: { in: ["FACULTY", "HOD"] },
          facultyProfile: { isNot: null }
        },
        select: {
          name: true,
          vmNo: true,
          role: true,
          facultyProfile: {
            select: {
              department: true,
              designation: true,
              subject1: true,
              subject2: true,
              lab1: true,
              lab2: true,
              additional1: true,
              additional2: true
            }
          }
        }
      });
    } catch (e) {
      console.error("Error fetching faculty profiles for subject enrichment:", e);
    }

    const enhancedSubjects = subjects.map((sub: { code: string; name: string; departmentCode: string; [key: string]: any }) => {
      const subCodeUpper = (sub.code || "").toUpperCase().trim();
      const subNameLower = (sub.name || "").toLowerCase().trim();

      const related = timetableEntries.filter((t: { subjectCode: string; [key: string]: any }) => (t.subjectCode || "").toUpperCase() === subCodeUpper);
      const classesTaking = Array.from(new Set(related.map((t: { classId: string }) => t.classId).filter(Boolean)));
      
      // Faculty from actual timetable schedule slots
      const scheduledFaculties = related.map((t: { facultyName: string }) => t.facultyName).filter(Boolean);

      // Faculty with profile allocations/preferences for this course
      const profileAllocatedFaculties: string[] = [];
      for (const u of facultyUsers) {
        const fp = u.facultyProfile;
        if (!fp) continue;
        const profileSubjects = [fp.subject1, fp.subject2, fp.lab1, fp.lab2, fp.additional1, fp.additional2]
          .filter(Boolean)
          .map((s: string) => s.trim().toLowerCase());

        const hasMatch = profileSubjects.some((ps: string) => 
          ps === subCodeUpper.toLowerCase() ||
          ps === subNameLower ||
          subNameLower.includes(ps) ||
          ps.includes(subNameLower)
        );

        if (hasMatch && u.name) {
          profileAllocatedFaculties.push(u.name);
        }
      }

      // Combine both sources, eliminating duplicates
      const facultiesHandling = Array.from(new Set([...scheduledFaculties, ...profileAllocatedFaculties]));
      const rooms = Array.from(new Set(related.map((t: { roomNo: string }) => t.roomNo).filter(Boolean)));
      const weeklyHours = related.length;
      
      const scheduleSlots = related.map((r: { dayOrder: string; period: number; timeRange: string; classId: string; roomNo: string; facultyName: string; vmsNo?: string | null }) => ({
        dayOrder: r.dayOrder,
        period: r.period,
        classId: r.classId,
        facultyName: r.facultyName,
        vmsNo: r.vmsNo || null,
        roomNo: r.roomNo,
        timeRange: r.timeRange
      }));

      return {
        ...sub,
        classesTaking,
        facultiesHandling,
        rooms,
        weeklyHours,
        scheduleSlots
      };
    });

    return NextResponse.json({ success: true, subjects: enhancedSubjects });
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/subjects
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const { code, name, credits, semester, departmentCode } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: "Subject Code and Name are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();
    const numCredits = parseInt(credits) || 3;
    const numSem = parseInt(semester) || 1;
    const dept = (departmentCode || "CSE").toUpperCase().trim();

    // Ensure department exists
    const deptRecord = await prisma.department.findUnique({
      where: { code: dept }
    });
    if (!deptRecord) {
      // Create department if it doesn't exist
      await prisma.department.create({
        data: {
          code: dept,
          name: `${dept} Department`
        }
      });
    }

    // Check duplicate
    const existing = await prisma.subject.findUnique({
      where: { code: cleanCode }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Subject code '${cleanCode}' already exists.` }, { status: 400 });
    }

    const newSubject = await prisma.subject.create({
      data: {
        code: cleanCode,
        name: cleanName,
        credits: numCredits,
        semester: numSem,
        departmentCode: dept
      }
    });

    return NextResponse.json({ 
      success: true, 
      subject: newSubject 
    });
  } catch (error: any) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/subjects (Update subject)
export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const { id, code, name, credits, semester, departmentCode } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Subject ID is required" }, { status: 400 });
    }

    const cleanCode = code ? code.toUpperCase().trim() : undefined;
    const cleanName = name ? name.trim() : undefined;
    const numCredits = credits !== undefined ? parseInt(credits) : undefined;
    const numSem = semester !== undefined ? parseInt(semester) : undefined;
    const dept = departmentCode ? departmentCode.toUpperCase().trim() : undefined;

    if (dept) {
      const deptRecord = await prisma.department.findUnique({
        where: { code: dept }
      });
      if (!deptRecord) {
        await prisma.department.create({
          data: {
            code: dept,
            name: `${dept} Department`
          }
        });
      }
    }

    // Check if code is being updated to an existing code belonging to another subject
    if (cleanCode) {
      const existing = await prisma.subject.findFirst({
        where: {
          code: cleanCode,
          NOT: { id: id }
        }
      });
      if (existing) {
        return NextResponse.json({ success: false, error: `Subject code '${cleanCode}' is already used by another course.` }, { status: 400 });
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(cleanCode ? { code: cleanCode } : {}),
        ...(cleanName ? { name: cleanName } : {}),
        ...(numCredits !== undefined ? { credits: numCredits } : {}),
        ...(numSem !== undefined ? { semester: numSem } : {}),
        ...(dept ? { departmentCode: dept } : {})
      }
    });

    return NextResponse.json({ success: true, subject: updated });
  } catch (error: any) {
    console.error("Error updating subject:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/subjects
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); 
    
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.subject.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
