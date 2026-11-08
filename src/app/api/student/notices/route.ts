import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true }
    });

    const studentIds: string[] = [email];
    if (user?.id) studentIds.push(user.id);
    if (user?.vmNo) studentIds.push(user.vmNo);
    if (user?.studentProfile?.rollNumber) studentIds.push(user.studentProfile.rollNumber);

    const studentDept = user?.studentProfile?.department || null;

    // Fetch all notices intended for students
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { audience: "ALL" },
          { audience: "STUDENT" },
          { 
            audience: "SPECIFIC_STUDENT",
            targetStudentId: { in: studentIds }
          }
        ],
        AND: studentDept ? [
          {
            OR: [
              { department: null },
              { department: "" },
              { department: studentDept }
            ]
          }
        ] : []
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: notices
    });

  } catch (error: any) {
    console.error("Notices API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
