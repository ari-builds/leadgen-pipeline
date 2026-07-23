const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const password = "Admin2026!"; // Change this to whatever you want
  const hash = await bcrypt.hash(password, 10);

  // Update admin password
  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE email = ?",
    args: [hash, "admin@leadgen.com"],
  });

  console.log("Admin password updated");
  console.log(`Email: admin@leadgen.com`);
  console.log(`Password: ${password}`);
}

main().catch(console.error);
