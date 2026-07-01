import { execFileSync } from "node:child_process";
import { ensureGhInstalled } from "./install-gh.mjs";
import { ensureGitInstalled, gitPathEnv } from "./install-git.mjs";

const gh = await ensureGhInstalled({ quiet: true });
const git = await ensureGitInstalled({ quiet: true });
const gitEnv = gitPathEnv(git);
const workflow = process.argv[2] ?? "Deploy to GitHub Pages";

function runGh(args) {
  execFileSync(gh, args, { stdio: "inherit", env: gitEnv });
}

console.log("Checking GitHub auth...");
try {
  runGh(["auth", "status"]);
} catch {
  console.error("\nNot logged in. Run: npm run gh:auth");
  process.exit(1);
}

console.log(`\nTriggering workflow: ${workflow}`);
runGh(["workflow", "run", workflow, "--ref", "main"]);

console.log("\nWatch progress:");
runGh(["run", "list", "--workflow", workflow, "--limit", "3"]);

console.log("\nOpen in browser:");
runGh(["run", "watch"]);
