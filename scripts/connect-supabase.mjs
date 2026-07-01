/**
 * Connect this app to your Supabase project.
 *
 * Usage:
 *   1. Get your anon key: Supabase → Project Settings → API → anon public
 *   2. Run:
 *        node scripts/connect-supabase.mjs YOUR_ANON_KEY
 *      Or set VITE_SUPABASE_ANON_KEY in .env.local first, then:
 *        npm run db:connect
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const PROJECT_REF = "waefmcqudevcwpmdkvqu";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

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

const anonKey =
  process.argv[2] ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  loadEnvFile(".env.local").VITE_SUPABASE_ANON_KEY;

if (!anonKey || anonKey.includes("your-anon-key")) {
  console.error(`
Missing Supabase anon key.

1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api
2. Copy the "anon" "public" key
3. Run:
     node scripts/connect-supabase.mjs YOUR_ANON_KEY

Or add to .env.local:
  VITE_SUPABASE_URL=${SUPABASE_URL}
  VITE_SUPABASE_ANON_KEY=your-key-here
`);
  process.exit(1);
}

const envContent = `# Supabase — ${PROJECT_REF}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${anonKey}

# Optional — for automatic migrations via GitHub Actions / CLI:
# SUPABASE_ACCESS_TOKEN=your-personal-access-token
# SUPABASE_PROJECT_REF=${PROJECT_REF}
# SUPABASE_DB_PASSWORD=your-database-password
`;

writeFileSync(envPath, envContent, "utf8");
console.log(`Wrote ${envPath}`);

console.log("\nVerifying database connection...");
try {
  execFileSync(process.execPath, ["scripts/verify-db.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_ANON_KEY: anonKey },
  });
} catch {
  console.error(`
Connection failed. Your tables may not exist yet.

Apply the schema in Supabase SQL Editor:
  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new

Paste the contents of supabase/schema.sql and click Run.
Then run this script again.
`);
  process.exit(1);
}

console.log("\nPushing secrets to GitHub...");
try {
  execFileSync(process.execPath, ["scripts/github-secrets.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_ANON_KEY: anonKey },
  });
} catch {
  console.log("Skipped GitHub secrets (run npm run gh:auth first).");
}

console.log("\nTriggering live deploy...");
try {
  execFileSync(process.execPath, ["scripts/github-deploy.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
} catch {
  console.log("Skipped deploy trigger (run npm run github:deploy manually).");
}

console.log(`
Done! Database connected to ${SUPABASE_URL}

Local dev:  npm run dev
Live site:  https://rhon-ux.github.io/lgf-skool-autos/
`);
