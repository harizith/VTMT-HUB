import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = ['I-CSE-A', 'II-CSE-A', 'II-CSE-B', 'II-CSE-C', 'III-CSE-A', 'III-CSE-B', 'III-CSE-C', 'IV-CSE-A', 'IV-CSE-B', 'IV-CSE-C'];
  
  for (const c of classes) {
    const res = await fetch(`http://localhost:3000/api/admin/timetable?classId=${c}`).then(r => r.json());
    console.log(`Class ${c}: found ${res.timetable?.length || 0} entries (matched aliases: ${res.matchedAliases?.join(', ')})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
