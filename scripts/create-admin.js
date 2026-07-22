const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

const db = createClient({
  url: "libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ3NTUzMDgsImlkIjoiMDE5ZjhiYjEtZTEwMS03YjFjLThjMGMtODRjZGI4ZWQ5MGQ4Iiwia2lkIjoidm9nSHl3cVBCY1J6d1NPVlJDWWhTZkFpN25VSGlNM0FlV0tONktsY0hoSSIsInJpZCI6IjNmNDlkMGViLTc3OWQtNGZmMy04YzQ2LTg5YWE4MTAwOGFjMSJ9.dqt-6Wyw4cJtvRQVQ08ojRqBfM4Ztnikg6Ge7N792ROaaMkWSqE8Xso_9d3tfqsv-w2UOr_DqtHxDIs9PRyJAw",
});

async function main() {
  const hash = await bcrypt.hash("Admin123!", 12);
  await db.execute({
    sql: "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    args: ["admin@leadgen.com", hash, "admin"],
  });
  console.log("Admin user created: admin@leadgen.com");

  const check = await db.execute({ sql: "SELECT email, role FROM users" });
  console.log("Users:", JSON.stringify(check.rows));
  db.close();
}
main();
