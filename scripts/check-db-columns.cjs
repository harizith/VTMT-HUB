const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const query = `
    SELECT table_name, column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `;

  const res = await client.query(query);
  const byTable = {};
  for (const row of res.rows) {
    if (!byTable[row.table_name]) byTable[row.table_name] = [];
    byTable[row.table_name].push(row.column_name);
  }

  console.log('ACTUAL_COLUMNS_IN_POSTGRES:', JSON.stringify(byTable, null, 2));
  await client.end();
}

main().catch(console.error);
