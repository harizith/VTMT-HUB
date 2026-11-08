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

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        vmNo: true,
        studentProfile: {
          select: {
            rollNumber: true,
            department: true,
            semester: true,
            year: true,
            section: true,
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const formatted = students.map((s) => {
      const sp = s.studentProfile;
      const yr = sp?.year?.trim() || (sp?.semester && sp.semester <= 2 ? "I" : sp?.semester && sp.semester <= 4 ? "II" : sp?.semester && sp.semester <= 6 ? "III" : "IV");
      const dept = (sp?.department || "CSE").replace(/^(B\.E\s+|B\.Tech\s+)/i, "").trim();
      const sec = (sp?.section || "A").toUpperCase();
      const classId = `${yr}-${dept}-${sec}`;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        vmNo: s.vmNo,
        rollNumber: sp?.rollNumber || s.vmNo || "",
        department: sp?.department || "",
        classId
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("HOD Students List API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
