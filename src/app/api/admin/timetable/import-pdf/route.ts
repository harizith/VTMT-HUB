import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseTimetablePdfBuffer } from "@/utils/timetablePdfParser";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") === "replace" ? "replace" : "append";

    if (!file) {
      return NextResponse.json({ success: false, error: "No PDF file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { facultySheets, allSlots } = await parseTimetablePdfBuffer(buffer);

    if (mode === "replace") {
      const classIds = [...new Set(allSlots.map((slot) => slot.classId).filter((value): value is string => Boolean(value)))];
      const facultyNames = [...new Set(allSlots.map((slot) => slot.facultyName).filter((value): value is string => Boolean(value)))];
      const vmsNumbers = [...new Set(allSlots.map((slot) => slot.vmsNo).filter((value): value is string => Boolean(value)))];
      const targets: any[] = [];
      if (classIds.length) targets.push({ classId: { in: classIds } });
      if (facultyNames.length) targets.push({ facultyName: { in: facultyNames } });
      if (vmsNumbers.length) targets.push({ vmsNo: { in: vmsNumbers } });

      if (targets.length) {
        try {
          const oldEntries = await prisma.timetableEntry.findMany({ where: { OR: targets } });
          if (oldEntries.length > 0) {
            await (prisma as any).timetableHistory.createMany({
              data: oldEntries.map((e: any) => {
                let yr = 2;
                if (e.classId && e.classId.startsWith('I-')) yr = 1;
                else if (e.classId && e.classId.startsWith('II-')) yr = 2;
                else if (e.classId && e.classId.startsWith('III-')) yr = 3;
                else if (e.classId && e.classId.startsWith('IV-')) yr = 4;
                return {
                  classId: e.classId,
                  academicYear: e.academicYear || "2026-2027",
                  year: yr,
                  semType: e.semType || "ODD",
                  dayOrder: e.dayOrder,
                  period: e.period,
                  timeRange: e.timeRange,
                  subjectCode: e.subjectCode,
                  subjectName: e.subjectName,
                  facultyName: e.facultyName,
                  roomNo: e.roomNo,
                  vmsNo: e.vmsNo,
                  category: e.category,
                };
              }),
            });
          }
        } catch (archErr) {
          console.warn("Failed to archive PDF timetable to history:", archErr);
        }

        await prisma.timetableEntry.deleteMany({ where: { OR: targets } });
      }
    }

    const dbEntries = allSlots.map((slot) => ({
      classId: slot.classId,
      dayOrder: slot.dayOrder,
      period: slot.period,
      timeRange: slot.timeRange,
      subjectCode: slot.subjectCode,
      subjectName: slot.subjectName,
      facultyName: slot.facultyName,
      roomNo: slot.roomNo,
      vmsNo: slot.vmsNo || null,
      category: slot.category || null,
    }));

    const result = await prisma.timetableEntry.createMany({ data: dbEntries });
    const classes = new Set(allSlots.map((slot) => slot.classId).filter(Boolean));

    try {
      await prisma.auditLog.create({
        data: {
          action: "PDF_TIMETABLE_IMPORT",
          details: `Imported ${result.count} extracted timetable rows from PDF (${file.name}).`,
          performedBy: authorization.email,
        },
      });
    } catch (error) {
      console.warn("Audit log creation skipped:", error);
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      totalProcessed: allSlots.length,
      isMasterClass: false,
      classCount: classes.size,
      facultyCount: facultySheets.filter((sheet) => sheet.facultyName).length,
      message: `Imported ${result.count} rows that were explicitly present in the PDF.`,
      faculties: facultySheets.map((sheet) => ({
        name: sheet.facultyName,
        vmsNo: sheet.vmsNo,
        designation: sheet.designation,
        slotCount: sheet.slots.length,
      })),
      sampleSlots: allSlots.slice(0, 10),
    });
  } catch (error: any) {
    console.error("PDF Timetable Import Error:", error);
    const status = String(error?.message || "").startsWith("No timetable rows could be read") ? 422 : 500;
    return NextResponse.json({ success: false, error: error.message || "Failed to read timetable PDF" }, { status });
  }
}
