import { createClient } from "@libsql/client";
import path from "path";

const url = process.env.DATABASE_URL || "file:" + path.join(process.cwd(), "local.db");
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

const db = createClient({
  url,
  authToken,
});

export default db;
