import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialSubjects = [
  { code: "231CS321", name: "Data Structures", credits: 3, semester: 3, departmentCode: "CSE" },
  { code: "231CS322", name: "Digital Principles and Computer Organization", credits: 4, semester: 3, departmentCode: "CSE" },
  { code: "231CS323", name: "Object Oriented Programming", credits: 3, semester: 3, departmentCode: "CSE" },
  { code: "231CS324", name: "Operating Systems", credits: 3, semester: 3, departmentCode: "CSE" },
  { code: "231CS325", name: "Software Engineering", credits: 3, semester: 3, departmentCode: "CSE" },
  { code: "231MA302", name: "Probability and Queuing Theory", credits: 4, semester: 3, departmentCode: "CSE" },
  { code: "231CS32A", name: "Data Structures and Algorithms Laboratory", credits: 2, semester: 3, departmentCode: "CSE" },
  { code: "231CS32B", name: "Object Oriented Programming Laboratory", credits: 2, semester: 3, departmentCode: "CSE" },
  { code: "231CS32C", name: "Operating Systems Laboratory", credits: 2, semester: 3, departmentCode: "CSE" },
  { code: "21CS501", name: "Database Management Systems", credits: 3, semester: 5, departmentCode: "CSE" },
  { code: "21CS502", name: "Computer Networks & Protocols", credits: 4, semester: 5, departmentCode: "CSE" },
  { code: "21CS503", name: "Theory of Computation", credits: 3, semester: 5, departmentCode: "CSE" },
  { code: "21CS504", name: "Web Technologies & Full Stack", credits: 3, semester: 5, departmentCode: "CSE" },
  { code: "21CS701", name: "Cloud Computing & DevOps", credits: 3, semester: 7, departmentCode: "CSE" },
  { code: "21CS702", name: "Cryptography and Network Security", credits: 3, semester: 7, departmentCode: "CSE" },
  { code: "21AI401", name: "Artificial Intelligence & Machine Learning", credits: 4, semester: 4, departmentCode: "AIDS" },
  { code: "21EC301", name: "Signals and Digital Communication", credits: 4, semester: 3, departmentCode: "ECE" },
];

async function main() {
  console.log("Seeding subjects catalog...");

  // Ensure departments exist
  const depts = [
    { code: "CSE", name: "Computer Science and Engineering", hodName: "Dr. Saravanan" },
    { code: "ECE", name: "Electronics & Communication Engineering", hodName: "Dr. Ramesh" },
    { code: "AIDS", name: "Artificial Intelligence & Data Science", hodName: "Dr. K. Priya" },
    { code: "MECH", name: "Mechanical Engineering", hodName: "Dr. Balaji" },
  ];

  for (const d of depts) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: { code: d.code, name: d.name, hodName: d.hodName }
    });
  }

  for (const s of initialSubjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        credits: s.credits,
        semester: s.semester,
        departmentCode: s.departmentCode
      },
      create: s
    });
    console.log(`✓ Upserted: ${s.code} - ${s.name}`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
