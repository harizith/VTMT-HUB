const { Client } = require('pg');

async function syncDbColumns() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  const queries = [
    'ALTER TABLE "TimetableEntry" ADD COLUMN IF NOT EXISTS "category" TEXT;',
    'ALTER TABLE "FacultyProfile" ADD COLUMN IF NOT EXISTS "subject1" TEXT;',
    'ALTER TABLE "FacultyProfile" ADD COLUMN IF NOT EXISTS "subject2" TEXT;',
    'ALTER TABLE "FacultyProfile" ADD COLUMN IF NOT EXISTS "lab1" TEXT;',
    'ALTER TABLE "FacultyProfile" ADD COLUMN IF NOT EXISTS "additional1" TEXT;',
    'ALTER TABLE "FacultyProfile" ADD COLUMN IF NOT EXISTS "additional2" TEXT;',
  ];

  for (const q of queries) {
    console.log('Executing:', q);
    await client.query(q);
  }

  console.log('SUCCESS: All missing schema columns have been synchronized with Supabase.');
  await client.end();
}

syncDbColumns().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
