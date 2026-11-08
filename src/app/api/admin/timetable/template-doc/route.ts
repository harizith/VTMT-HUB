import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "docx";

    let filename = "timetable-import-template.docx";
    let contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (format === "doc") {
      filename = "timetable-import-template.docx";
    }

    const filePath = path.join(process.cwd(), "public", "templates", filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "Word template file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error serving Word template:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
