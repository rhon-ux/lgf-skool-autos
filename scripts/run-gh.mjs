import { spawnSync } from "node:child_process";
import { ensureGhInstalled } from "./install-gh.mjs";

const gh = await ensureGhInstalled({ quiet: true });
const args = process.argv.slice(2);

const result = spawnSync(gh, args, { stdio: "inherit", shell: false });
process.exit(result.status ?? 1);
