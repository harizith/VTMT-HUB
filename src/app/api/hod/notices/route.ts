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

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { audience: "ALL" },
          { audience: "FACULTY" },
          { audience: "HOD" }
        ]
      } as any,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: notices });
  } catch (error: any) {
    console.error("HOD Notices GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "HOD") {
       return NextResponse.json({ success: false, error: "Only HOD can post notices" }, { status: 403 });
    }

    const { title, content, audience, category, targetStudentIds, department } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const aud = audience || "ALL"; // ALL, FACULTY, STUDENT, SPECIFIC_STUDENT
    const cat = category || "GENERAL";
    const authorName = user.name || "HOD";

    if (aud === "SPECIFIC_STUDENT") {
      const studentList: string[] = Array.isArray(targetStudentIds) ? targetStudentIds : (targetStudentIds ? [targetStudentIds] : []);
      if (studentList.length === 0) {
        return NextResponse.json({ success: false, error: "Please select at least one student" }, { status: 400 });
      }

      const createdNotices = await Promise.all(
        studentList.map(async (studentIdentifier: string) => {
          return prisma.notice.create({
            data: {
              title: title.trim(),
              content: content.trim(),
              category: cat,
              audience: "SPECIFIC_STUDENT",
              targetStudentId: studentIdentifier.trim(),
              department: department || null,
              postedBy: authorName,
              authorId: user.id
            }
          });
        })
      );

      return NextResponse.json({ success: true, count: createdNotices.length, data: createdNotices[0] });
    }

    const newNotice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        audience: aud,
        category: cat,
        department: department || null,
        postedBy: authorName,
        authorId: user.id
      }
    });

    return NextResponse.json({ success: true, data: newNotice });
  } catch (error: any) {
    console.error("Error creating notice:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
