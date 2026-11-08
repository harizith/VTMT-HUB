const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFaculty() {
  try {
    const faculty = await prisma.facultyProfile.findMany({
      select: {
        vmNo: true,
        user: { select: { name: true } },
        subject1: true,
        subject2: true,
        lab1: true,
        lab2: true
      }
    });
    console.log('Total Faculty in DB:', faculty.length);
    for (const p of faculty.slice(0, 15)) {
      console.log(`${p.vmNo || 'NO-VM'} | ${p.user?.name} | Sub1: ${p.subject1 || '-'} | Lab1: ${p.lab1 || '-'}`);
    }
  } catch (e) {
    console.error('Error fetching faculty:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFaculty();
