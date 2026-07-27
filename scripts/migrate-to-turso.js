require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const fs = require('fs');

async function migrate() {
  // Source: local.db
  const local = createClient({ url: 'file:./local.db' });
  
  // Target: Turso
  const remote = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Get all table names from local.db
  const tables = await local.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('Tables found:', tables.rows.map(r => r.name));

  for (const table of tables.rows) {
    const name = table.name;
    
    // Get schema
    const schema = await local.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${name}'`);
    const createSQL = schema.rows[0]?.sql;
    if (!createSQL) continue;
    
    console.log(`\nMigrating: ${name}`);
    console.log(`  Schema: ${createSQL.substring(0, 80)}...`);
    
    // Create table in remote
    try {
      await remote.execute(createSQL);
      console.log(`  ✓ Table created`);
    } catch (e) {
      console.log(`  ⚠ Table create: ${e.message}`);
    }

    // Copy data
    const data = await local.execute(`SELECT * FROM ${name}`);
    if (data.rows.length === 0) {
      console.log(`  No data to copy`);
      continue;
    }

    // Get column names
    const cols = await local.execute(`PRAGMA table_info(${name})`);
    const colNames = cols.rows.map(c => c.name);
    
    // Insert in batches
    let inserted = 0;
    for (const row of data.rows) {
      try {
        const placeholders = colNames.map(() => '?').join(', ');
        const values = colNames.map(c => row[c] === undefined ? null : row[c]);
        await remote.execute({
          sql: `INSERT OR REPLACE INTO ${name} (${colNames.join(', ')}) VALUES (${placeholders})`,
          args: values,
        });
        inserted++;
      } catch (e) {
        console.log(`  ⚠ Insert error for row: ${e.message}`);
      }
    }
    console.log(`  ✓ Inserted ${inserted}/${data.rows.length} rows`);
  }

  // Verify
  const verify = await remote.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\n=== Remote tables ===');
  for (const v of verify.rows) {
    const count = await remote.execute(`SELECT COUNT(*) as count FROM ${v.name}`);
    console.log(`  ${v.name}: ${count.rows[0].count} rows`);
  }
}

migrate().catch(e => console.error('Migration failed:', e));
