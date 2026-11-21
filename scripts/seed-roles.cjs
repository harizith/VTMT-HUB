const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Admin, Teacher, and HOD accounts into Supabase...");

  // 1. Admin Accounts
  const adminPass = bcrypt.hashSync("administrator", 10);
  const adminEmails = ["admin@vtmt.org", "admin@veltechmultitech.org"];
  
  for (const email of adminEmails) {
    const vmNo = email.includes("veltechmultitech") ? "ADM-SECRET-02" : "ADM-SECRET-01";
    await prisma.user.upsert({
      where: { email },
      update: {
        vmNo,
        name: "System Administrator",
        role: "ADMIN",
        status: "ACTIVE",
        password: adminPass,
      },
      create: {
        id: email.includes("veltechmultitech") ? "admin-root-vtu" : "admin-secret-root",
        vmNo,
        email,
        name: "System Administrator",
        role: "ADMIN",
        status: "ACTIVE",
        password: adminPass,
      },
    });
    await prisma.userMode.upsert({
      where: { emailid: email },
      update: { vmno: vmNo, password: "administrator", usermode: "ADMIN" },
      create: { vmno: vmNo, emailid: email, password: "administrator", usermode: "ADMIN" },
    });
  }

  // 2. Teacher / Faculty Accounts
  const teacherPass = bcrypt.hashSync("teacher123", 10);
  const teacherEmails = ["teacher@vtmt.org", "teacher@veltechmultitech.org"];
  for (const email of teacherEmails) {
    const vmNo = email.includes("veltechmultitech") ? "EMP-CSE-002" : "EMP-CSE-001";
    await prisma.user.upsert({
      where: { email },
      update: {
        vmNo,
        name: "Dr. Saravanan",
        role: "FACULTY",
        status: "ACTIVE",
        password: teacherPass,
      },
      create: {
        id: email.includes("veltechmultitech") ? "fac-vtmt-emp02" : "fac-vtmt-emp01",
        vmNo,
        email,
        name: "Dr. Saravanan",
        role: "FACULTY",
        status: "ACTIVE",
        password: teacherPass,
      },
    });
    await prisma.userMode.upsert({
      where: { emailid: email },
      update: { vmno: vmNo, password: "teacher123", usermode: "TEACHER" },
      create: { vmno: vmNo, emailid: email, password: "teacher123", usermode: "TEACHER" },
    });
    await prisma.facultyProfile.upsert({
      where: { vmNo },
      update: { department: "CSE", designation: "Associate Professor" },
      create: { vmNo, department: "CSE", designation: "Associate Professor" },
    });
  }

  // 3. HOD Accounts
  const hodPass = bcrypt.hashSync("hod123", 10);
  const hodEmails = ["hod@vtmt.org", "hod@veltechmultitech.org", "rsaravanan@veltechmultitech.org"];
  for (const email of hodEmails) {
    let vmNo = "HOD-CSE-01";
    if (email === "hod@veltechmultitech.org") vmNo = "HOD-CSE-02";
    if (email === "rsaravanan@veltechmultitech.org") vmNo = "MTS1944";

    await prisma.user.upsert({
      where: { email },
      update: {
        vmNo,
        name: "Dr. Saravanan (HOD)",
        role: "HOD",
        status: "ACTIVE",
        password: hodPass,
      },
      create: {
        id: "hod-" + vmNo.toLowerCase(),
        vmNo,
        email,
        name: "Dr. Saravanan (HOD)",
        role: "HOD",
        status: "ACTIVE",
        password: hodPass,
      },
    });
    await prisma.userMode.upsert({
      where: { emailid: email },
      update: { vmno: vmNo, password: "hod123", usermode: "HOD" },
      create: { vmno: vmNo, emailid: email, password: "hod123", usermode: "HOD" },
    });
    await prisma.hodProfile.upsert({
      where: { vmNo },
      update: { department: "CSE", designation: "Head of Department" },
      create: { vmNo, department: "CSE", designation: "Head of Department" },
    });
  }

  console.log("✓ All accounts (Admin, HOD, Teacher) successfully seeded and synchronized in Supabase!");
}

main()
  .catch((e) => {
    console.error("Error seeding roles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
