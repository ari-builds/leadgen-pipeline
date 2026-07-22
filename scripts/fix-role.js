const { createClient } = require("@libsql/client");
const path = require("path");
const db = createClient({ url: "file:" + path.join(__dirname, "..", "local.db") });
async function main() {
  const r = await db.execute({
    sql: "UPDATE users SET role = 'admin' WHERE email = 'admin@leadgen.com'",
  });
  console.log("Updated:", r.rowsAffected);
  const check = await db.execute({ sql: "SELECT email, role FROM users" });
  console.log("Users:", JSON.stringify(check.rows));
  db.close();
}
main();
