import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all notices visible to faculty & all staff
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { audience: "ALL" },
          { audience: "FACULTY" },
          { audience: "HOD" },
          { author: { email: session.user.email } }
        ]
      } as any,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      data: notices
    });
  } catch (error: any) {
    console.error("Teacher Notices API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { facultyProfile: true }
    });

    if (!user || (user.role !== "FACULTY" && user.role !== "HOD" && user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized to post announcements" }, { status: 403 });
    }

    const { title, content, audience, category, targetStudentIds } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const aud = audience || "STUDENT";
    const cat = category || "GENERAL";
    const authorName = user.name || "Faculty Member";

    // If sending to specific students (one or multiple)
    if (aud === "SPECIFIC_STUDENT") {
      const studentList: string[] = Array.isArray(targetStudentIds) ? targetStudentIds : (targetStudentIds ? [targetStudentIds] : []);
      if (studentList.length === 0) {
        return NextResponse.json({ success: false, error: "Please select at least one student" }, { status: 400 });
      }

      // Create a notice entry for each selected student
      const createdNotices = await Promise.all(
        studentList.map(async (studentIdentifier: string) => {
          return prisma.notice.create({
            data: {
              title: title.trim(),
              content: content.trim(),
              category: cat,
              audience: "SPECIFIC_STUDENT",
              targetStudentId: studentIdentifier.trim(),
              postedBy: authorName,
              authorId: user.id
            }
          });
        })
      );

      return NextResponse.json({ success: true, count: createdNotices.length, data: createdNotices[0] });
    }

    // Otherwise broadcast to all students
    const newNotice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: cat,
        audience: aud,
        postedBy: authorName,
        authorId: user.id
      }
    });

    return NextResponse.json({ success: true, data: newNotice });
  } catch (error: any) {
    console.error("Teacher Notice Creation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
