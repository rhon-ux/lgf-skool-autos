import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { ensureGhInstalled } from "./install-gh.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gh = await ensureGhInstalled({ quiet: true });

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

function runGh(args) {
  execFileSync(gh, args, { stdio: "inherit" });
}

const env = { ...loadEnvFile(".env.local"), ...loadEnvFile(".env") };
const secretKeys = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_DB_PASSWORD",
];

console.log("Checking GitHub auth...");
try {
  runGh(["auth", "status"]);
} catch {
  console.error("\nNot logged in. Run: npm run gh:auth");
  process.exit(1);
}

let setCount = 0;
for (const key of secretKeys) {
  const value = process.env[key] || env[key];
  if (!value) {
    console.log(`  skip  ${key} (not in .env.local)`);
    continue;
  }
  console.log(`  set   ${key}`);
  execFileSync(gh, ["secret", "set", key, "--body", value], { stdio: "inherit" });
  setCount += 1;
}

if (setCount === 0) {
  console.log("\nNo secrets found. Copy .env.example to .env.local and add your Supabase values.");
} else {
  console.log(`\nSet ${setCount} repository secret(s).`);
}
