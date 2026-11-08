/**
 * Seeder script for Student Account and Sample Attendance records
 * Target: student@vtmt.org (Roll: 23CS101, Class: II-CSE-A)
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SAMPLE_ATTENDANCE = [
  // Day 1: 2026-11-03 (Day Order I) - 7 PRESENT, 1 ON_DUTY
  { dateString: "2026-11-03", dayOrder: "I", period: 1, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 2, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 3, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 4, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 5, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 6, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 7, subjectCode: "231CS32A", facultyName: "Dr. Saravanan", status: "PRESENT" },
  { dateString: "2026-11-03", dayOrder: "I", period: 8, subjectCode: "231CS32A", facultyName: "Dr. Saravanan", status: "ON_DUTY" },

  // Day 2: 2026-11-04 (Day Order II) - 8 PRESENT
  { dateString: "2026-11-04", dayOrder: "II", period: 1, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 2, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 3, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 4, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 5, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 6, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 7, subjectCode: "231CS32B", facultyName: "Mr. Rajesh", status: "PRESENT" },
  { dateString: "2026-11-04", dayOrder: "II", period: 8, subjectCode: "231CS32B", facultyName: "Mr. Rajesh", status: "PRESENT" },

  // Day 3: 2026-11-05 (Day Order III) - 6 PRESENT, 1 ON_DUTY, 1 ABSENT
  { dateString: "2026-11-05", dayOrder: "III", period: 1, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 2, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 3, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 4, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "ON_DUTY" },
  { dateString: "2026-11-05", dayOrder: "III", period: 5, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 6, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "ABSENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 7, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT" },
  { dateString: "2026-11-05", dayOrder: "III", period: 8, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT" },
];

async function main() {
  console.log("Seeding student account and attendance records...");

  // 1. Ensure CSE Department exists
  await prisma.department.upsert({
    where: { code: "CSE" },
    update: { name: "Computer Science and Engineering" },
    create: { code: "CSE", name: "Computer Science and Engineering" },
  });

  // 2. Hash password for student123
  const hashedPassword = bcrypt.hashSync("student123", 10);

  // 3. Upsert User
  const user = await prisma.user.upsert({
    where: { email: "student@vtmt.org" },
    update: {
      vmNo: "23CS101",
      name: "Vasanth Kumar R",
      role: "STUDENT",
      status: "ACTIVE",
      password: hashedPassword,
    },
    create: {
      id: "stu-vtmt-23cs101",
      vmNo: "23CS101",
      email: "student@vtmt.org",
      name: "Vasanth Kumar R",
      role: "STUDENT",
      status: "ACTIVE",
      password: hashedPassword,
    },
  });
  console.log(`✓ User upserted: ${user.email} (${user.id})`);

  // 4. Upsert StudentProfile
  const profile = await prisma.studentProfile.upsert({
    where: { userEmail: "student@vtmt.org" },
    update: {
      rollNumber: "23CS101",
      department: "CSE",
      semester: 3,
      year: "II",
      section: "A",
      batch: "2024-2028",
    },
    create: {
      userEmail: "student@vtmt.org",
      rollNumber: "23CS101",
      department: "CSE",
      semester: 3,
      year: "II",
      section: "A",
      batch: "2024-2028",
    },
  });
  console.log(`✓ StudentProfile upserted for: ${profile.userEmail} (Class: II-CSE-A)`);

  // 5. Upsert UserMode
  const userMode = await prisma.userMode.upsert({
    where: { vmno: "23CS101" },
    update: {
      emailid: "student@vtmt.org",
      password: "student123",
      usermode: "STUDENT",
    },
    create: {
      vmno: "23CS101",
      emailid: "student@vtmt.org",
      password: "student123",
      usermode: "STUDENT",
    },
  });
  console.log(`✓ UserMode upserted: ${userMode.vmno} - ${userMode.emailid}`);

  // 6. Upsert Attendance records
  let createdCount = 0;
  for (const item of SAMPLE_ATTENDANCE) {
    await prisma.attendance.upsert({
      where: {
        studentId_dateString_period: {
          studentId: user.id,
          dateString: item.dateString,
          period: item.period,
        },
      },
      update: {
        classId: "II-CSE-A",
        dayOrder: item.dayOrder,
        subjectCode: item.subjectCode,
        facultyName: item.facultyName,
        status: item.status,
      },
      create: {
        studentId: user.id,
        classId: "II-CSE-A",
        dateString: item.dateString,
        dayOrder: item.dayOrder,
        period: item.period,
        subjectCode: item.subjectCode,
        facultyName: item.facultyName,
        status: item.status,
      },
    });
    createdCount++;
  }
  console.log(`✓ Upserted ${createdCount} attendance records for ${user.id} (II-CSE-A)`);

  // Calculate stats for confirmation
  const total = SAMPLE_ATTENDANCE.length;
  const present = SAMPLE_ATTENDANCE.filter((a) => a.status === "PRESENT").length;
  const od = SAMPLE_ATTENDANCE.filter((a) => a.status === "ON_DUTY").length;
  const absent = SAMPLE_ATTENDANCE.filter((a) => a.status === "ABSENT").length;
  const attended = present + od;
  const percentage = Math.round((attended / total) * 100);

  console.log("\nSummary of Seeded Attendance:");
  console.log(`- Total Periods: ${total}`);
  console.log(`- Attended (Present + OD): ${attended} (${present} Present, ${od} OD)`);
  console.log(`- Absent: ${absent}`);
  console.log(`- Attendance Rate: ${percentage}%`);
  console.log("\nStudent account seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
