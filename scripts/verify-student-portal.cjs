/**
 * Verification script for Milestone 1:
 * Validates database contents, in-memory store, password verification, and attendance calculations.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function verifyDatabase() {
  console.log("=== 1. VERIFYING POSTGRESQL DATABASE ===");
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: "student@vtmt.org" },
      include: { studentProfile: true },
    });

    if (!user) throw new Error("Student user not found in PostgreSQL!");
    console.log("✓ User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      vmNo: user.vmNo,
      role: user.role,
      status: user.status,
    });

    if (!user.studentProfile) throw new Error("StudentProfile not found in PostgreSQL!");
    console.log("✓ StudentProfile found:", user.studentProfile);

    // Verify Password
    const passwordMatch = await bcrypt.compare("student123", user.password);
    console.log("✓ Password hash verified for 'student123':", passwordMatch);
    if (!passwordMatch) throw new Error("Password verification failed!");

    // Verify UserMode
    const userMode = await prisma.userMode.findUnique({
      where: { vmno: "23CS101" },
    });
    console.log("✓ UserMode found:", userMode);

    // Verify Attendance Records
    const studentIds = [user.id, user.email, user.vmNo, user.studentProfile?.rollNumber].filter(Boolean);
    const records = await prisma.attendance.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: [{ dateString: "desc" }, { period: "asc" }],
    });

    console.log(`✓ Total Attendance Records in DB: ${records.length}`);
    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const odCount = records.filter((r) => r.status === "ON_DUTY").length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    const attendedCount = presentCount + odCount;
    const percentage = Math.round((attendedCount / records.length) * 100);

    console.log("✓ Attendance breakdown:", {
      total: records.length,
      present: presentCount,
      onDuty: odCount,
      absent: absentCount,
      attended: attendedCount,
      percentage: `${percentage}%`,
    });

    if (records.length < 24) throw new Error(`Expected at least 24 records, found ${records.length}`);
    if (presentCount !== 21 || odCount !== 2 || absentCount !== 1) {
      throw new Error(`Expected 21 PRESENT, 2 ON_DUTY, 1 ABSENT, got ${presentCount}P, ${odCount}OD, ${absentCount}A`);
    }

    // Verify Subject Breakdown
    const subjectMap = {};
    records.forEach((r) => {
      const code = r.subjectCode || "GENERAL";
      if (!subjectMap[code]) subjectMap[code] = { total: 0, attended: 0 };
      subjectMap[code].total++;
      if (r.status === "PRESENT" || r.status === "ON_DUTY") subjectMap[code].attended++;
    });

    console.log("✓ Subject-wise breakdown in DB:");
    for (const [code, s] of Object.entries(subjectMap)) {
      console.log(`  - ${code}: ${s.attended}/${s.total} (${Math.round((s.attended / s.total) * 100)}%)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyInMemoryStore() {
  console.log("\n=== 2. VERIFYING IN-MEMORY FALLBACK STORE ===");
  const fs = require("fs");
  const prismaSource = fs.readFileSync("src/lib/prisma.ts", "utf-8");
  if (!prismaSource.includes("student@vtmt.org")) {
    throw new Error("InMemoryStore in src/lib/prisma.ts does not contain student@vtmt.org!");
  }
  if (!prismaSource.includes("23CS101")) {
    throw new Error("InMemoryStore in src/lib/prisma.ts does not contain 23CS101!");
  }
  if (!prismaSource.includes("att-seed-24")) {
    throw new Error("InMemoryStore in src/lib/prisma.ts does not contain all 24 attendance seed records!");
  }
  console.log("✓ InMemoryStore source contains student account, profile, userMode, and 24 seed attendance records.");

  // Test functional execution of inMemoryPrisma
  const path = require("path");
  const { inMemoryPrisma } = require(path.resolve(__dirname, "../src/lib/prisma.ts"));
  const user = await inMemoryPrisma.user.findFirst({ where: { email: "student@vtmt.org" } });
  if (!user) throw new Error("inMemoryPrisma.user.findFirst returned null for student@vtmt.org");
  console.log("✓ inMemoryPrisma user lookup verified:", user.email, `(${user.id})`);

  const userMode = await inMemoryPrisma.userMode.findFirst({ where: { vmno: "23CS101" } });
  if (!userMode) throw new Error("inMemoryPrisma.userMode.findFirst returned null for 23CS101");
  console.log("✓ inMemoryPrisma userMode verified:", userMode.vmno, userMode.emailid);

  const studentIds = [user.id, user.email, user.vmNo, user.studentProfile?.rollNumber].filter(Boolean);
  const records = await inMemoryPrisma.attendance.findMany({ where: { studentId: { in: studentIds } } });
  if (records.length < 24) throw new Error(`inMemoryPrisma expected 24 records, got ${records.length}`);
  const pCount = records.filter((r) => r.status === "PRESENT").length;
  const odCount = records.filter((r) => r.status === "ON_DUTY").length;
  const aCount = records.filter((r) => r.status === "ABSENT").length;
  if (pCount !== 21 || odCount !== 2 || aCount !== 1) {
    throw new Error(`inMemoryPrisma attendance counts mismatch: P=${pCount}, OD=${odCount}, A=${aCount}`);
  }
  console.log(`✓ inMemoryPrisma attendance query verified: 24 records (${pCount} P, ${odCount} OD, ${aCount} A = 96%)`);

  // Test composite unique key matcher
  const compositeItem = await inMemoryPrisma.attendance.findUnique({
    where: {
      studentId_dateString_period: {
        studentId: user.id,
        dateString: "2026-11-03",
        period: 1,
      },
    },
  });
  if (!compositeItem || compositeItem.period !== 1) {
    throw new Error("inMemoryPrisma composite unique key lookup failed!");
  }
  console.log("✓ inMemoryPrisma composite key matcher verified:", compositeItem.studentId, compositeItem.dateString, `Period ${compositeItem.period}`);

  // Test range filters
  const rangeItems = await inMemoryPrisma.attendance.findMany({
    where: { period: { gte: 7, lte: 8 } },
  });
  if (rangeItems.length !== 6) {
    throw new Error(`inMemoryPrisma range query expected 6 items (periods 7-8 over 3 days), got ${rangeItems.length}`);
  }
  console.log(`✓ inMemoryPrisma range filter (gte/lte) verified: ${rangeItems.length} records returned`);
}

async function run() {
  try {
    await verifyDatabase();
    await verifyInMemoryStore();
    console.log("\n✅ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("\n❌ VERIFICATION FAILED:", err);
    process.exit(1);
  }
}

run();
