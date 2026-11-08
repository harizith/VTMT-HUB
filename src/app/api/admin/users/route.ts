import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/encryption";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/users - Fetch all users with their profile relations from DB
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vmNo: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        studentProfile: {
          select: {
            rollNumber: true,
            department: true,
            semester: true,
            batch: true,
            year: true,
            section: true,
          },
        },
        facultyProfile: {
          select: {
            vmNo: true,
            department: true,
            designation: true,
            subject1: true,
            subject2: true,
            lab1: true,
            lab2: true,
            additional1: true,
            additional2: true,
          },
        },
        hodProfile: {
          select: {
            vmNo: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(req: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const body = await req.json();
    const { email, name, password, role, vmNo } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields (email, name, password, role)" }, { status: 400 });
    }

    if (role !== "ADMIN" && !vmNo) {
      return NextResponse.json({ success: false, error: "Missing required field (VM No/VMS No)" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanVmNo = vmNo ? vmNo.trim() : null;
    // Hash password with salted bcrypt for secure storage
    const storedPassword = await hashPassword(password);
    const validRole = ["STUDENT", "FACULTY", "HOD", "ADMIN"].includes(role) ? role : "STUDENT";

    // 1. Check if user already exists
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json({ success: false, error: `User with email '${cleanEmail}' already exists.` }, { status: 400 });
    }

    // Check if vmNo already exists
    if (cleanVmNo) {
      const existingVm = await prisma.user.findFirst({
        where: { vmNo: cleanVmNo },
      });
      if (existingVm) {
        return NextResponse.json({ success: false, error: `User with VM No/VMS No '${cleanVmNo}' already exists.` }, { status: 400 });
      }
    }

    // 2. Department setup
    const dept = body.department ? String(body.department).toUpperCase().trim() : (validRole === "ADMIN" ? null : "CSE");
    if (dept) {
      try {
        await prisma.department.upsert({
          where: { code: dept },
          update: {},
          create: { code: dept, name: `${dept} Department` },
        });
      } catch (e) {
        console.warn("Department upsert error:", e);
      }
    }

    // 3. Create user record via standard Prisma API
    const createdUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        password: storedPassword,
        role: validRole as any,
        status: "ACTIVE",
        vmNo: cleanVmNo,
      },
    });

    // 4. Role-specific profile creation
    if (validRole === "STUDENT") {
      const year = body.year ? String(body.year).trim() : null;
      const sec = body.section ? String(body.section).trim() : null;
      const roll = body.rollNumber ? String(body.rollNumber).trim() : (cleanVmNo || null);
      const semester = body.semester ? Number.parseInt(String(body.semester), 10) : 3;
      const batch = body.batch ? String(body.batch).trim() : "2023-2027";
      
      await prisma.studentProfile.upsert({
        where: { userEmail: cleanEmail },
        update: {
          rollNumber: roll,
          department: dept,
          semester: Number.isFinite(semester) ? semester : null,
          batch,
          year,
          section: sec,
        },
        create: {
          userEmail: cleanEmail,
          rollNumber: roll,
          department: dept,
          semester: Number.isFinite(semester) ? semester : null,
          batch,
          year,
          section: sec,
        },
      });
    } else if (validRole === "FACULTY" && cleanVmNo) {
      const designation = body.designation ? String(body.designation).trim() : "Assistant Professor";
      await prisma.facultyProfile.upsert({
        where: { vmNo: cleanVmNo },
        update: {
          department: dept,
          designation,
          subject1: body.subject1 ? String(body.subject1).trim() : null,
          subject2: body.subject2 ? String(body.subject2).trim() : null,
          lab1: body.lab1 ? String(body.lab1).trim() : null,
          lab2: body.lab2 ? String(body.lab2).trim() : null,
          additional1: body.additional1 ? String(body.additional1).trim() : null,
          additional2: body.additional2 ? String(body.additional2).trim() : null,
        },
        create: {
          vmNo: cleanVmNo,
          department: dept,
          designation,
          subject1: body.subject1 ? String(body.subject1).trim() : null,
          subject2: body.subject2 ? String(body.subject2).trim() : null,
          lab1: body.lab1 ? String(body.lab1).trim() : null,
          lab2: body.lab2 ? String(body.lab2).trim() : null,
          additional1: body.additional1 ? String(body.additional1).trim() : null,
          additional2: body.additional2 ? String(body.additional2).trim() : null,
        },
      });
    } else if (validRole === "HOD" && cleanVmNo) {
      const designation = body.designation ? String(body.designation).trim() : `Head of Department (${dept || "CSE"})`;
      await prisma.hodProfile.upsert({
        where: { vmNo: cleanVmNo },
        update: {
          department: dept,
          designation,
        },
        create: {
          vmNo: cleanVmNo,
          department: dept,
          designation,
        },
      });
    }

    // 4. Store and sync UserMode for dashboard login
    const targetVmNo = cleanVmNo || cleanEmail.split("@")[0].toUpperCase();
    try {
      await prisma.userMode.upsert({
        where: { vmno: targetVmNo },
        update: {
          emailid: cleanEmail,
          password: storedPassword,
          usermode: validRole,
        },
        create: {
          vmno: targetVmNo,
          emailid: cleanEmail,
          password: storedPassword,
          usermode: validRole,
        },
      });
    } catch (err) {
      console.warn("Could not sync UserMode:", err);
    }

    // 5. Log audit event
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE_USER",
          details: `Created new ${validRole} account for '${cleanEmail}' (${cleanName})`,
          performedBy: "Admin",
          userId: createdUser.id,
        },
      });
    } catch (e) {
      console.warn("Could not create audit log:", e);
    }

    const newUser = { id: createdUser.id, email: cleanEmail, name: cleanName, role: validRole, status: "ACTIVE" };

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(req: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, vmNo: true, role: true },
    });

    if (user?.vmNo || user?.email) {
      await prisma.userMode.deleteMany({
        where: {
          OR: [
            ...(user.vmNo ? [{ vmno: user.vmNo }] : []),
            ...(user.email ? [{ emailid: user.email }] : []),
          ],
        },
      }).catch(() => null);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: "DELETE_USER",
          details: `Deleted ${user?.role || "user"} account '${user?.email || userId}' (${user?.name || ""})`,
          performedBy: "Admin",
        },
      });
    } catch (e) {
      // non-blocking
    }

    return NextResponse.json({ success: true, deletedId: userId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

