#!/usr/bin/env node
const { createClient } = require("@libsql/client");

const db = createClient({ url: "file:./local.db" });

// Read payload from env var DB_PAYLOAD (avoids PowerShell escaping issues)
const action = process.argv[2];
const raw = process.env.DB_PAYLOAD || "{}";
const payload = JSON.parse(raw);

async function main() {
  switch (action) {
    case "get-leads": {
      const where = payload.where || "1=1";
      const params = payload.params || [];
      const result = await db.execute({ sql: `SELECT * FROM leads WHERE ${where}`, args: params });
      console.log(JSON.stringify(result.rows));
      break;
    }
    case "update-lead": {
      const { id, fields } = payload;
      const keys = Object.keys(fields);
      if (keys.length === 0) { console.log("[]"); break; }
      const sets = keys.map(k => `${k} = ?`).join(", ");
      const values = keys.map(k => fields[k]);
      values.push(id);
      await db.execute({ sql: `UPDATE leads SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, args: values });
      console.log(JSON.stringify({ updated: id }));
      break;
    }
    case "count": {
      const where = payload.where || "1=1";
      const result = await db.execute({ sql: `SELECT COUNT(*) as cnt FROM leads WHERE ${where}`, args: payload.params || [] });
      console.log(JSON.stringify(result.rows[0]));
      break;
    }
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
