const { createClient } = require("@libsql/client");
const path = require("path");
const db = createClient({ url: "file:" + path.join(__dirname, "..", "local.db") });
async function main() {
  const r = await db.execute({
    sql: "SELECT code FROM otp_codes ORDER BY id DESC LIMIT 1",
  });
  console.log(r.rows[0].code);
  db.close();
}
main();
