import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/notices
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    // If include fails due to relations or fallback, fallback to standard findMany
    try {
      const fallbackNotices = await prisma.notice.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, notices: fallbackNotices });
    } catch (innerError: any) {
      return NextResponse.json({ success: false, error: innerError.message }, { status: 500 });
    }
  }
}

// POST /api/admin/notices
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const { title, content, category, audience, department } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and Content are required" }, { status: 400 });
    }

    const cat = category || "GENERAL";
    const aud = audience || "ALL";

    const newNotice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: cat,
        audience: aud,
        department: department?.trim() || null,
        postedBy: "Admin",
      },
    });

    return NextResponse.json({ success: true, notice: newNotice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/notices
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.notice.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

