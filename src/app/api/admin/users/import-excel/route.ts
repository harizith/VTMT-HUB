import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireAdmin } from "@/lib/adminAuth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

type Role = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

function normalizeRole(value: unknown): Role {
  const role = String(value ?? "").trim().toUpperCase();
  if (role === "HOD" || role.includes("HEAD")) return "HOD";
  if (role === "FACULTY" || role === "TEACHER" || role === "STAFF" || role.includes("PROF")) return "FACULTY";
  if (role === "ADMIN" || role.includes("ADMINISTRATOR")) return "ADMIN";
  return "STUDENT";
}

function field(row: Record<string, unknown>, ...names: string[]) {
  const aliases = new Set(names.map((name) => name.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const key = Object.keys(row).find((name) => aliases.has(name.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return {
    provided: key !== undefined,
    value: key === undefined ? undefined : String(row[key] ?? "").trim(),
  };
}

function nullableText(value: string | undefined) {
  return value?.trim() || null;
}

export async function POST(req: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  try {
    const body = await req.json();
    const rows = body.users;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No user rows provided in request" }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const [index, rawRow] of rows.entries()) {
      const row = rawRow as Record<string, unknown>;
      const rowNum = index + 2;
      const email = String(field(row, "email", "emailid", "email address", "email id").value ?? "").toLowerCase();
      const name = String(field(row, "name", "full name", "user name").value ?? "").trim();
      const role = normalizeRole(field(row, "role", "user role", "usermode").value);
      let vmNo = nullableText(field(row, "vmNo", "vmno", "vms no", "mts no").value);
      if (vmNo && role !== "ADMIN") {
        const upper = vmNo.toUpperCase();
        if (role === "STUDENT") {
          vmNo = upper.startsWith("VM") ? upper : `VM${vmNo.replace(/^#+/, "")}`;
        } else {
          vmNo = upper.startsWith("MTS") ? upper : `MTS${vmNo.replace(/^#+/, "")}`;
        }
      }
      const passwordValue = nullableText(field(row, "password", "pass").value);
      const password = encrypt(passwordValue || "Welcome@123");
      const departmentField = field(row, "department", "dept");
      const department = nullableText(departmentField.value)?.toUpperCase() ?? null;

      if (!email || !name) {
        errors.push(`Row ${rowNum}: skipped because ${!email ? "email" : "name"} is missing`);
        continue;
      }

      if (department) {
        await prisma.department.upsert({
          where: { code: department },
          update: {},
          create: { code: department, name: `${department} Department` },
        });
      }

      let existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        const id = crypto.randomUUID();
        await prisma.user.create({
          data: {
            id,
            email,
            name,
            password,
            role,
            status: "ACTIVE",
            vmNo,
          },
        });
        createdCount++;
      } else {
        await prisma.user.update({
          where: { email },
          data: {
            name,
            role,
            ...(vmNo ? { vmNo } : {}),
            ...(passwordValue ? { password } : {}),
          },
        });
        updatedCount++;
      }

      const activeUser = await prisma.user.findUnique({ where: { email } });
      const effectiveVmNo = activeUser?.vmNo ?? vmNo;
      const designationField = field(row, "designation");
      const designation = nullableText(designationField.value);

      if (role === "STUDENT") {
        const rollNumberField = field(row, "rollNumber", "roll number", "roll no");
        const yearField = field(row, "year");
        const sectionField = field(row, "section", "sec");
        const semesterField = field(row, "semester");
        const batchField = field(row, "batch");
        const parsedSemester = Number.parseInt(semesterField.value ?? "", 10);
        const createProfile = {
          userEmail: email,
          rollNumber: nullableText(rollNumberField.value),
          department,
          year: nullableText(yearField.value),
          section: nullableText(sectionField.value),
          semester: Number.isFinite(parsedSemester) && semesterField.value ? parsedSemester : null,
          batch: nullableText(batchField.value),
        };
        const updateProfile = {
          ...(rollNumberField.value ? { rollNumber: rollNumberField.value } : {}),
          ...(department ? { department } : {}),
          ...(nullableText(yearField.value) ? { year: yearField.value } : {}),
          ...(nullableText(sectionField.value) ? { section: sectionField.value } : {}),
          ...(Number.isFinite(parsedSemester) && semesterField.value ? { semester: parsedSemester } : {}),
          ...(nullableText(batchField.value) ? { batch: batchField.value } : {}),
        };
        await prisma.studentProfile.upsert({
          where: { userEmail: email },
          update: updateProfile,
          create: createProfile,
        });
      } else if (role === "FACULTY" && effectiveVmNo) {
        const subjectFields = ["subject1", "subject2", "lab1", "additional1", "additional2"] as const;
        const assignments = Object.fromEntries(subjectFields.flatMap((key) => {
          const value = field(row, key);
          return value.value ? [[key, value.value]] : [];
        }));
        const update = {
          ...(department ? { department } : {}),
          ...(designation ? { designation } : {}),
          ...assignments,
        };
        await prisma.facultyProfile.upsert({
          where: { vmNo: effectiveVmNo },
          update,
          create: {
            vmNo: effectiveVmNo,
            department,
            designation,
            subject1: nullableText(field(row, "subject1").value),
            subject2: nullableText(field(row, "subject2").value),
            lab1: nullableText(field(row, "lab1").value),
            additional1: nullableText(field(row, "additional1").value),
            additional2: nullableText(field(row, "additional2").value),
          },
        });
      } else if (role === "HOD" && effectiveVmNo) {
        const update = {
          ...(department ? { department } : {}),
          ...(designation ? { designation } : {}),
        };
        await prisma.hodProfile.upsert({
          where: { vmNo: effectiveVmNo },
          update,
          create: { vmNo: effectiveVmNo, department, designation },
        });
      }

      if (effectiveVmNo) {
        try {
          await prisma.userMode.upsert({
            where: { vmno: effectiveVmNo },
            update: {
              emailid: email,
              ...(passwordValue ? { password } : {}),
              usermode: role,
            },
            create: { vmno: effectiveVmNo, emailid: email, password, usermode: role },
          });
        } catch (error) {
          console.warn("UserMode sync warning:", error);
        }
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: "EXCEL_BULK_USER_IMPORT",
          details: `Imported users from Excel. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${errors.length}`,
          performedBy: authorization.email,
        },
      });
    } catch (error) {
      console.warn("Audit log creation skipped:", error);
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: rows.length,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Bulk User Import Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
