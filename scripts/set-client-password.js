const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const password = "Legacy2026!"; // Change this to whatever you want
  const hash = await bcrypt.hash(password, 10);

  // Find Joseph's client
  const clients = await db.execute("SELECT id, name, slug FROM clients");
  console.log("Clients:", JSON.stringify(clients.rows));

  // Set password for all clients
  for (const client of clients.rows) {
    await db.execute({
      sql: "UPDATE clients SET dashboard_password_hash = ? WHERE id = ?",
      args: [hash, client.id],
    });
    console.log(`Password set for "${client.name}" (ID: ${client.id})`);
  }

  console.log(`\nPassword: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log("\nClient login URL: /client/{slug}");
  console.log("Slugs:", clients.rows.map(r => r.slug).join(", "));
}

main().catch(console.error);
