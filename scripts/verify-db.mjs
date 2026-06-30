/**
 * Verify Supabase connection and schema.
 * Usage: node scripts/verify-db.mjs
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local (via dotenv-style parse).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const fileEnv = { ...loadEnvFile(".env.local"), ...loadEnvFile(".env") };
const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
  console.error("Copy .env.example to .env.local and fill in your Supabase project values.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const checks = [
  { name: "members", query: supabase.from("members").select("id", { count: "exact", head: true }) },
  {
    name: "daily_send_log",
    query: supabase.from("daily_send_log").select("id", { count: "exact", head: true }),
  },
  {
    name: "app_settings",
    query: supabase.from("app_settings").select("key").limit(1),
  },
];

let failed = false;

console.log(`Connecting to ${url} ...`);

for (const { name, query } of checks) {
  const { error } = await query;
  if (error) {
    console.error(`  FAIL  ${name}: ${error.message}`);
    failed = true;
  } else {
    console.log(`  OK    ${name}`);
  }
}

const { error: rpcError } = await supabase.rpc("zapier_get_daily_batch", {
  p_api_key: "invalid-test-key",
  p_limit: 1,
});

if (rpcError?.message?.includes("Unauthorized")) {
  console.log("  OK    zapier_get_daily_batch RPC");
} else if (rpcError) {
  console.error(`  FAIL  zapier_get_daily_batch: ${rpcError.message}`);
  failed = true;
} else {
  console.log("  OK    zapier_get_daily_batch RPC");
}

if (failed) {
  console.error("\nDatabase verification failed. Run migrations: npm run db:push");
  process.exit(1);
}

console.log("\nDatabase is connected and schema looks good.");
