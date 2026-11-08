import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hashPassword } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { facultyProfile: true }
    });

    if (!user) {
      const um = await prisma.userMode.findUnique({ where: { emailid: email }});
      if (um) {
        user = {
          name: um.emailid.split("@")[0],
          vmNo: um.vmno,
          email: um.emailid,
          role: um.usermode.toUpperCase(),
          status: "ACTIVE",
          facultyProfile: {
             department: null,
             designation: null,
             vmNo: um.vmno
          }
        } as any;
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
    }

    const vmNo = user.vmNo || user.facultyProfile?.vmNo || "";
    const teacherName = user.name || "";

    // Query all timetable entries assigned to this teacher to get the classes taking each subject
    // Note: Teacher can be Staff 1 or Staff 2 (e.g. "Staff 1, Staff 2" for labs/electives)
    let timetableEntries: any[] = [];
    try {
      timetableEntries = await prisma.timetableEntry.findMany({
        where: {
          OR: [
            ...(vmNo ? [{ vmsNo: { contains: vmNo, mode: "insensitive" as const } }] : []),
            ...(teacherName ? [{ facultyName: { contains: teacherName, mode: "insensitive" as const } }] : []),
          ],
        },
        select: {
          subjectName: true,
          subjectCode: true,
          classId: true,
          facultyName: true,
        },
      });
    } catch (ttErr) {
      console.warn("Failed to fetch timetable classes for teacher profile:", ttErr);
    }

    // Helper to get unique classes assigned to a subject name or code
    const getClassesForSubject = (subjectStr: string | null | undefined): string[] => {
      if (!subjectStr || !subjectStr.trim()) return [];
      const sLower = subjectStr.trim().toLowerCase();
      const matched = timetableEntries.filter((e) => {
        const eName = (e.subjectName || "").toLowerCase();
        const eCode = (e.subjectCode || "").toLowerCase();
        return (
          eName === sLower ||
          eCode === sLower ||
          (eName && sLower.includes(eName)) ||
          (sLower && eName.includes(sLower)) ||
          (eCode && sLower.includes(eCode))
        );
      });
      return Array.from(new Set(matched.map((m) => m.classId).filter(Boolean)));
    };

    const s1 = user.facultyProfile?.subject1 || "";
    const s2 = user.facultyProfile?.subject2 || "";
    const l1 = user.facultyProfile?.lab1 || "";
    const l2 = user.facultyProfile?.lab2 || "";
    const a1 = user.facultyProfile?.additional1 || "";
    const a2 = user.facultyProfile?.additional2 || "";

    // Also get all distinct classes the teacher handles overall
    const allAssignedClasses = Array.from(new Set(timetableEntries.map((e) => e.classId).filter(Boolean)));

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        vmNo,
        status: user.status,
        profile: {
          department: user.facultyProfile?.department || "",
          designation: user.facultyProfile?.designation || "",
          subjects: {
            subject1: s1,
            subject2: s2,
            lab1: l1,
            lab2: l2,
            additional1: a1,
            additional2: a2,
          },
          subjectClasses: {
            subject1: getClassesForSubject(s1),
            subject2: getClassesForSubject(s2),
            lab1: getClassesForSubject(l1),
            lab2: getClassesForSubject(l2),
            additional1: getClassesForSubject(a1),
            additional2: getClassesForSubject(a2),
          },
          allAssignedClasses,
        },
      },
    });

  } catch (error: any) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;
    const body = await request.json();
    const { name, password, department, designation } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;

    const umDataToUpdate: any = {};

    if (password && password.trim()) {
      const hashedPassword = await hashPassword(password.trim());
      dataToUpdate.password = hashedPassword;
      umDataToUpdate.password = hashedPassword;
    }

    const profileDataToUpdate: any = {};
    if (department) profileDataToUpdate.department = department;
    if (designation) profileDataToUpdate.designation = designation;

    if (Object.keys(dataToUpdate).length === 0 && Object.keys(profileDataToUpdate).length === 0) {
       return NextResponse.json({ success: true, message: "Nothing to update" });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { facultyProfile: true } });
    if (user) {
      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.user.update({
          where: { email },
          data: dataToUpdate
        });
      }
      
      if (Object.keys(profileDataToUpdate).length > 0 && user.facultyProfile) {
        // FacultyProfile relation is on vmNo, so we need vmNo from user
        if (user.vmNo) {
          await prisma.facultyProfile.update({
            where: { vmNo: user.vmNo },
            data: profileDataToUpdate
          });
        }
      }
    }

    const um = await prisma.userMode.findUnique({ where: { emailid: email } });
    if (um && Object.keys(umDataToUpdate).length > 0) {
      await prisma.userMode.update({
        where: { emailid: email },
        data: umDataToUpdate
      });
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("Profile API Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
