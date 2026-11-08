import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, requireSession } from '@/lib/adminAuth';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/departments - Fetch departments
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/departments - Create new department
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const { code, name, hodName, hodVmNo } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: "Department Code and Name are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();
    const cleanHodVmNo = hodVmNo ? String(hodVmNo).trim() : null;
    let cleanHod = hodName ? String(hodName).trim() : null;

    // If an MTS No / VM No is provided, look up the user account to fetch actual name and profile info
    let hodUser: any = null;
    if (cleanHodVmNo) {
      try {
        hodUser = await prisma.user.findFirst({
          where: {
            OR: [
              { vmNo: cleanHodVmNo },
              { vmNo: { equals: cleanHodVmNo, mode: "insensitive" } },
            ],
          },
        });
      } catch (e) {
        console.warn("Error finding user by vmNo:", e);
      }
    }

    // Fallback: If no match by VM No but hodName given, try matching user by name or email
    if (!hodUser && cleanHod) {
      try {
        hodUser = await prisma.user.findFirst({
          where: {
            OR: [
              { name: { equals: cleanHod, mode: "insensitive" } },
              { email: { equals: cleanHod.toLowerCase(), mode: "insensitive" } },
            ],
          },
        });
      } catch (e) {
        console.warn("Error finding user by name:", e);
      }
    }

    // If matching user found, use their official name from user profile
    if (hodUser) {
      cleanHod = hodUser.name;
    }

    const existing = await prisma.department.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Department '${cleanCode}' already exists` }, { status: 400 });
    }

    const newDept = await prisma.department.create({
      data: {
        code: cleanCode,
        name: cleanName,
        hodName: cleanHod,
      },
    });

    // If an associated user was found or provided with a VM No, connect or update their HOD role and HodProfile
    if (hodUser && hodUser.vmNo) {
      try {
        // Upgrade role to HOD if not already ADMIN/HOD
        if (hodUser.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: hodUser.id },
            data: { role: "HOD" },
          });
          try {
            await prisma.userMode.upsert({
              where: { vmno: hodUser.vmNo },
              update: { usermode: "HOD" },
              create: {
                vmno: hodUser.vmNo,
                emailid: hodUser.email,
                password: hodUser.password,
                usermode: "HOD",
              },
            });
          } catch {}
        }

        // Upsert HodProfile connecting the HOD's MTS No to this department
        await prisma.hodProfile.upsert({
          where: { vmNo: hodUser.vmNo },
          update: {
            department: cleanCode,
            designation: `Head of Department (${cleanCode})`,
          },
          create: {
            vmNo: hodUser.vmNo,
            department: cleanCode,
            designation: `Head of Department (${cleanCode})`,
          },
        });
      } catch (profileErr) {
        console.warn("Could not auto-link HOD profile:", profileErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      department: newDept,
      hodUser: hodUser ? { name: hodUser.name, vmNo: hodUser.vmNo, email: hodUser.email } : null,
    });
  } catch (error: any) {
    console.error("Error creating department:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create department" }, { status: 500 });
  }
}

// DELETE /api/admin/departments - Delete department
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get("id"); 

    if (!deptId) {
      return NextResponse.json({ success: false, error: "Department ID required" }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id: deptId },
    });
    
    return NextResponse.json({ success: true, deletedId: deptId });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
