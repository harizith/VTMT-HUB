import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { parseTimetableDocBuffer } from "@/utils/timetableDocParser";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No Word document provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".docx") && !fileName.endsWith(".doc")) {
      return NextResponse.json({ success: false, error: "Uploaded file must be a Word document (.docx or .doc)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { allSlots, warnings } = await parseTimetableDocBuffer(buffer);

    return NextResponse.json({
      success: true,
      rows: allSlots,
      count: allSlots.length,
      warnings,
    });
  } catch (error: any) {
    console.error("Error previewing Word timetable document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to preview document" },
      { status: 400 }
    );
  }
}
