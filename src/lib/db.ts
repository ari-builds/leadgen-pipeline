import { createClient } from "@libsql/client";
import path from "path";

const db = createClient({
  url: process.env.DATABASE_URL || "file:" + path.join(process.cwd(), "local.db"),
});

export default db;
