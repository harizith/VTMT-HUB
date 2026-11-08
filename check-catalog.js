const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCatalog() {
  try {
    const subjects = await prisma.subject.findMany();
    console.log('Total Subjects in DB:', subjects.length);
    for (const s of subjects.slice(0, 20)) {
      console.log(`${s.code} | ${s.name} | Sem: ${s.semester} | Dept: ${s.departmentCode}`);
    }
  } catch (e) {
    console.error('Error fetching subjects:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCatalog();
