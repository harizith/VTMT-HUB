import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

interface AllocationPayloadItem {
  subjectCode: string;
  facultyName: string;
  vmsNo?: string | null;
  roomNo?: string | null;
}

// POST /api/admin/subjects/allocate
// Connects and saves teacher-subject allocations to Course Catalog and Faculty Profiles
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { classId, departmentCode, allocations } = body as {
      classId?: string;
      departmentCode?: string;
      allocations: AllocationPayloadItem[];
    };

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { success: false, error: "No teacher allocations provided." },
        { status: 400 }
      );
    }

    // 1. Fetch existing users to identify faculty members
    const allUsers = await prisma.user.findMany({
      where: { role: { in: ["FACULTY", "HOD"] } },
      include: { facultyProfile: true },
    });

    const results: any[] = [];

    // Helper to get class aliases
    function getClassAliases(cid: string): string[] {
      const aliases = new Set<string>([cid]);
      const parts = cid.split('-');
      if (parts.length >= 3) {
        const yearOrSem = parts[0].toUpperCase();
        const dept = parts[1];
        const sec = parts[2];
        if (yearOrSem === 'IV' || yearOrSem === 'VII' || yearOrSem === 'VIII') {
          aliases.add(`IV-${dept}-${sec}`);
          aliases.add(`VII-${dept}-${sec}`);
          aliases.add(`VIII-${dept}-${sec}`);
        } else if (yearOrSem === 'III' || yearOrSem === 'V' || yearOrSem === 'VI') {
          aliases.add(`III-${dept}-${sec}`);
          aliases.add(`V-${dept}-${sec}`);
          aliases.add(`VI-${dept}-${sec}`);
        } else if (yearOrSem === 'II') {
          aliases.add(`II-${dept}-${sec}`);
        } else if (yearOrSem === 'I') {
          aliases.add(`I-${dept}-${sec}`);
        }
      }
      return Array.from(aliases);
    }

    const classAliases = classId ? getClassAliases(classId) : [];

    for (const alloc of allocations) {
      const { subjectCode, facultyName, vmsNo, roomNo } = alloc;
      if (!subjectCode || !facultyName) continue;

      const cleanCode = subjectCode.toUpperCase().trim();
      const rawFacultyName = facultyName.trim();

      // Support multi-staff (e.g. "Staff 1, Staff 2" for labs, or "Staff 1, Staff 2, Staff 3" for electives)
      const staffList = rawFacultyName.split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
      const vmList = (vmsNo || "").split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);

      for (let sIdx = 0; sIdx < staffList.length; sIdx++) {
        const staffName = staffList[sIdx];
        const staffVm = vmList[sIdx] || "";

        // Find user matching staffName or staffVm
        const matchedUser = allUsers.find((u: any) => {
          if (staffVm && (u.vmNo === staffVm || u.facultyProfile?.vmNo === staffVm)) return true;
          const uName = (u.name || "").toLowerCase().trim();
          const fName = staffName.toLowerCase();
          return (
            uName === fName ||
            uName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, "") === fName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, "")
          );
        });

        if (matchedUser) {
          const userVmNo = matchedUser.vmNo || staffVm;
          if (userVmNo) {
            // Update facultyProfile subject slots if not already mapped
            const profile = matchedUser.facultyProfile;
            const isLab = cleanCode.toLowerCase().includes("lab");

            let updateData: any = {};
            if (profile) {
              if (isLab) {
                // If it is a lab subject, assign to lab1 or lab2 if lab1 already taken
                const existingLab1 = (profile.lab1 || "").toUpperCase().trim();
                const existingLab2 = (profile.lab2 || "").toUpperCase().trim();

                if (!existingLab1 || existingLab1 === cleanCode) {
                  updateData.lab1 = cleanCode;
                } else if (!existingLab2 || existingLab2 === cleanCode) {
                  updateData.lab2 = cleanCode;
                } else {
                  // Fallback update lab1
                  updateData.lab1 = cleanCode;
                }
              } else {
                const currentSubs = [
                  profile.subject1,
                  profile.subject2,
                  profile.additional1,
                  profile.additional2,
                ]
                  .filter(Boolean)
                  .map((s) => String(s).toUpperCase().trim());

                if (!currentSubs.includes(cleanCode)) {
                  if (!profile.subject1) {
                    updateData.subject1 = cleanCode;
                  } else if (!profile.subject2) {
                    updateData.subject2 = cleanCode;
                  } else if (!profile.additional1) {
                    updateData.additional1 = cleanCode;
                  } else if (!profile.additional2) {
                    updateData.additional2 = cleanCode;
                  } else {
                    updateData.subject1 = cleanCode;
                  }
                }
              }

              if (Object.keys(updateData).length > 0) {
                await prisma.facultyProfile.update({
                  where: { vmNo: userVmNo },
                  data: updateData,
                });
              }
            } else {
              // Create faculty profile if none exists
              await prisma.facultyProfile.create({
                data: {
                  vmNo: userVmNo,
                  department: departmentCode || "CSE",
                  ...(isLab ? { lab1: cleanCode } : { subject1: cleanCode }),
                },
              });
            }
          }
        }
      }

      // Ensure subject exists in database
      const existingSub = await prisma.subject.findUnique({
        where: { code: cleanCode },
      });

      if (!existingSub && departmentCode) {
        await prisma.subject.create({
          data: {
            code: cleanCode,
            name: cleanCode,
            credits: 3,
            semester: 3,
            departmentCode: departmentCode.toUpperCase(),
          },
        });
      }

      // If classId is provided, sync or create active timetable slot for this subject in this class
      if (classId) {
        try {
          const semNum = existingSub?.semester || 3;
          const semType = semNum % 2 !== 0 ? "ODD" : "EVEN";

          const updateResult = await prisma.timetableEntry.updateMany({
            where: {
              classId: { in: classAliases.length > 0 ? classAliases : [classId] },
              subjectCode: cleanCode,
            },
            data: {
              facultyName: rawFacultyName,
              vmsNo: vmsNo || null,
              semType,
              ...(roomNo ? { roomNo } : {}),
            },
          });

          // If no existing slot was updated (e.g. before full timetable generation),
          // create a baseline entry so this class's allocated teacher persists and immediately displays!
          if (updateResult.count === 0) {
            await prisma.timetableEntry.create({
              data: {
                classId,
                subjectCode: cleanCode,
                subjectName: existingSub?.name || cleanCode,
                facultyName: rawFacultyName,
                vmsNo: vmsNo || null,
                roomNo: roomNo || null,
                period: 1,
                dayOrder: "I",
                semType,
              },
            });
          }
        } catch (updateErr) {
          console.warn("Could not sync active timetable entry during allocation:", updateErr);
        }
      }

      results.push({ subjectCode: cleanCode, facultyName: rawFacultyName, classId: classId || "ALL", success: true });
    }

    // Log to AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "ALLOCATE_TEACHER_SUBJECTS",
          details: `Updated teacher allocations for ${results.length} subjects (Class: ${classId || "General"})`,
          performedBy: auth.email || "Admin",
        },
      });
    } catch (e) {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected and allocated teachers for ${results.length} subjects.`,
      allocatedCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error("Error saving subject allocations:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save subject allocations." },
      { status: 500 }
    );
  }
}
