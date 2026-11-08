import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    const mode = formData.get("mode") === "replace" ? "replace" : "append";

    if (!file) {
      return NextResponse.json({ success: false, error: "No Word document uploaded" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".docx") && !fileName.endsWith(".doc")) {
      return NextResponse.json({ success: false, error: "Uploaded file must be a Word document (.docx or .doc)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { allSlots, warnings } = await parseTimetableDocBuffer(buffer);

    if (allSlots.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid timetable rows found in document" },
        { status: 400 }
      );
    }

    if (mode === "replace") {
      const classIds = [...new Set(allSlots.map((slot) => slot.classId).filter((v): v is string => Boolean(v)))];
      const facultyNames = [...new Set(allSlots.map((slot) => slot.facultyName).filter((v): v is string => Boolean(v)))];
      const vmsNumbers = [...new Set(allSlots.map((slot) => slot.vmsNo).filter((v): v is string => Boolean(v)))];

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
        } catch (hErr) {
          console.warn("Failed to archive timetable history:", hErr);
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
      semType: slot.semType || "ODD",
    }));

    const result = await prisma.timetableEntry.createMany({ data: dbEntries });
    const distinctClasses = [...new Set(allSlots.map((s) => s.classId).filter(Boolean))];
    const distinctFaculty = [...new Set(allSlots.map((s) => s.facultyName).filter(Boolean))];

    try {
      await prisma.auditLog.create({
        data: {
          action: "DOC_TIMETABLE_IMPORT",
          details: `Imported ${result.count} timetable slots from Word document (${file.name}). Mode: ${mode}.`,
          performedBy: authorization.email,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for DOC import:", auditErr);
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      totalProcessed: allSlots.length,
      classes: distinctClasses,
      faculty: distinctFaculty,
      sampleSlots: allSlots.slice(0, 10),
      warnings,
      message: `Successfully imported ${result.count} timetable entries from Word document.`,
    });
  } catch (error: any) {
    console.error("Error importing timetable from Word document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Word document" },
      { status: 500 }
    );
  }
}
