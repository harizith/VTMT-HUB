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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { hodProfile: true, facultyProfile: true }
    });

    let vmNo = user?.vmNo || user?.hodProfile?.vmNo || user?.facultyProfile?.vmNo;

    if (!user) {
      const userMode = await prisma.userMode.findUnique({
        where: { emailid: session.user.email }
      });
      vmNo = userMode?.vmno;
    }

    if (!user && !vmNo) {
      return NextResponse.json({ success: false, error: "No HOD profile found." }, { status: 404 });
    }

    const normalizedVmNo = vmNo?.trim();
    const entries = normalizedVmNo
      ? await prisma.timetableEntry.findMany({
          where: { vmsNo: { contains: normalizedVmNo } },
          orderBy: [{ dayOrder: "asc" }, { period: "asc" }]
        })
      : [];

    const timetable: Record<string, typeof entries> = {
      I: [],
      II: [],
      III: [],
      IV: [],
      V: [],
      UNASSIGNED: []
    };

    for (const entry of entries) {
      const day = entry.dayOrder;
      (day && timetable[day] ? timetable[day] : timetable.UNASSIGNED).push(entry);
    }

    return NextResponse.json({
      success: true,
      data: { vmNo: normalizedVmNo, timetable }
    });
  } catch (error) {
    console.error("HOD Calendar API Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}