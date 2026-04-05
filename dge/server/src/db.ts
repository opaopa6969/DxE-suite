import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DGE_DB_PATH || join(__dirname, "..", "data", "dge.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function migrate() {
  const migrationPath = join(__dirname, "..", "migrations", "001_init.sql");
  const sql = readFileSync(migrationPath, "utf-8");
  db.exec(sql);
  console.log("  Database migrated.");
}

export default db;
