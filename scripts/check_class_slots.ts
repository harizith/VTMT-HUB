import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.timetableEntry.findMany();
  console.log(`Total database entries: ${entries.length}`);

  const classMap: Record<string, { uniquePeriods: Set<string>; entries: any[] }> = {};

  for (const e of entries) {
    const key = e.classId || 'UNASSIGNED';
    if (!classMap[key]) {
      classMap[key] = { uniquePeriods: new Set(), entries: [] };
    }
    classMap[key].uniquePeriods.add(`Day${e.dayOrder}-P${e.period}`);
    classMap[key].entries.push(e);
  }

  console.log('\n================================================================');
  console.log('CLASS PERIOD OCCUPANCY BREAKDOWN (5 Days x 8 Periods = 40 possible slots)');
  console.log('================================================================');

  const allDays = ['I', 'II', 'III', 'IV', 'V'];

  for (const [cls, data] of Object.entries(classMap).sort()) {
    console.log(
      `\n🏫 Class [${cls}]: ${data.uniquePeriods.size} / 40 periods occupied (${data.entries.length} timetable records)`
    );

    const missing: string[] = [];
    for (const d of allDays) {
      for (let p = 1; p <= 8; p++) {
        const slotKey = `Day${d}-P${p}`;
        if (!data.uniquePeriods.has(slotKey)) {
          missing.push(`Day ${d} Period ${p}`);
        }
      }
    }

    if (missing.length === 0) {
      console.log(`   ✅ 100% Complete! All 40 periods filled.`);
    } else {
      console.log(`   ⚠️ Empty / Unassigned Slots (${missing.length}):`);
      console.log(`      ${missing.join(', ')}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
