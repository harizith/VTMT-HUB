import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, vmNo: true, role: true },
    });

    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const otherTeachers = await prisma.user.findMany({
      where: {
        role: { in: ["FACULTY", "HOD"] },
        id: { not: me.id },
      },
      select: {
        id: true,
        name: true,
        vmNo: true,
        facultyProfile: { select: { department: true } },
        hodProfile: { select: { department: true } },
      },
      orderBy: { name: "asc" },
    });

    const myTimetable = await prisma.timetableEntry.findMany({
      where: {
        OR: [
          { facultyName: { contains: me.name, mode: "insensitive" } },
          ...(me.vmNo ? [{ vmsNo: me.vmNo }] : []),
        ],
      },
      select: {
        classId: true,
        subjectCode: true,
        subjectName: true,
        dayOrder: true,
        period: true,
      },
      orderBy: [{ dayOrder: "asc" }, { period: "asc" }],
    });

    const [sentRequests, incomingRequests] = await Promise.all([
      prisma.substituteRequest.findMany({
        where: { requesterId: me.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.substituteRequest.findMany({
        where: { substituteId: me.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        me,
        teachers: otherTeachers.map((t) => ({
          id: t.id,
          name: t.name,
          vmNo: t.vmNo || "",
          department: t.facultyProfile?.department || t.hodProfile?.department || "",
        })),
        myTimetable,
        sentRequests,
        incomingRequests,
      },
    });
  } catch (error: any) {
    console.error("Teacher Substitute GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, vmNo: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { substituteId, classId, subjectCode, subjectName, dateString, dayOrder, period, reason } = body;

    if (!substituteId || !classId || !subjectCode || !dateString || !dayOrder || !period) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (substitute, class, subject, date, day order, period)." },
        { status: 400 }
      );
    }

    if (substituteId === me.id) {
      return NextResponse.json(
        { success: false, error: "You cannot request yourself as a substitute." },
        { status: 400 }
      );
    }

    const subTeacher = await prisma.user.findUnique({
      where: { id: substituteId },
      select: { id: true, name: true, vmNo: true },
    });
    if (!subTeacher) {
      return NextResponse.json({ success: false, error: "Selected substitute teacher not found." }, { status: 404 });
    }

    const created = await prisma.substituteRequest.create({
      data: {
        requesterId: me.id,
        requesterName: me.name,
        requesterVmNo: me.vmNo,
        substituteId: subTeacher.id,
        substituteName: subTeacher.name,
        substituteVmNo: subTeacher.vmNo,
        classId: String(classId).trim(),
        subjectCode: String(subjectCode).trim(),
        subjectName: subjectName ? String(subjectName).trim() : null,
        dateString: String(dateString).trim(),
        dayOrder: String(dayOrder).trim(),
        period: Number(period),
        reason: reason ? String(reason).trim() : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Teacher Substitute POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { id, status } = await req.json();
    if (!id || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid request id or status." }, { status: 400 });
    }

    const existing = await prisma.substituteRequest.findUnique({ where: { id } });
    if (!existing || existing.substituteId !== me.id) {
      return NextResponse.json({ success: false, error: "Request not found or unauthorized." }, { status: 404 });
    }

    const updated = await prisma.substituteRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Teacher Substitute PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing request id." }, { status: 400 });
    }

    const existing = await prisma.substituteRequest.findUnique({ where: { id } });
    if (!existing || existing.requesterId !== me.id) {
      return NextResponse.json({ success: false, error: "Request not found or unauthorized." }, { status: 404 });
    }

    await prisma.substituteRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Teacher Substitute DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
