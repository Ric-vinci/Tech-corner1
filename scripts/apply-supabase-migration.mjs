#!/usr/bin/env node
/**
 * Apply trade_in_submissions migration via Supabase SQL API.
 * Requires SUPABASE_DB_URL in .env.local (Database → Connection string → URI).
 * Or run supabase/migrations/001_trade_in_submissions.sql manually in SQL Editor.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const migrationsDir = path.join(__dirname, "../supabase/migrations");
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log("SUPABASE_DB_URL not set in .env.local.\n");
    console.log("Run these SQL files in Supabase Dashboard → SQL Editor:\n");
    for (const file of files) {
      console.log(`--- ${file} ---\n`);
      console.log(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
      console.log("\n");
    }
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
    console.log(`Applied ${file}`);
  }
  await client.end();
  console.log("All migrations applied successfully.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
