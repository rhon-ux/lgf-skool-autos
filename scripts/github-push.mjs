import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { ensureGhInstalled } from "./install-gh.mjs";
import { ensureGitInstalled, gitPathEnv } from "./install-git.mjs";
import {
  DEPLOY_WORKFLOW,
  GITHUB_PAGES_URL,
  GITHUB_REMOTE,
  GITHUB_OWNER,
  GITHUB_REPO,
} from "./repo-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gh = await ensureGhInstalled({ quiet: true });
const git = await ensureGitInstalled({ quiet: true });
const gitEnv = gitPathEnv(git);

function runGit(args, { allowFail = false } = {}) {
  try {
    execFileSync(git, args, { cwd: root, stdio: "inherit", env: gitEnv });
    return true;
  } catch {
    if (!allowFail) throw new Error(`git ${args.join(" ")} failed`);
    return false;
  }
}

function runGh(args) {
  execFileSync(gh, args, { cwd: root, stdio: "inherit", env: gitEnv });
}

console.log("Checking GitHub auth...");
try {
  runGh(["auth", "status"]);
} catch {
  console.error("\nLog in first:\n  npm run gh:auth\n");
  process.exit(1);
}

console.log("Configuring git credentials via gh...");
runGh(["auth", "setup-git"]);

if (!existsSync(join(root, ".git"))) {
  console.log("Initializing git repository...");
  runGit(["init"]);
}

runGit(["config", "user.name", "recillagimson"], { allowFail: true });
runGit(["config", "user.email", "recillagimson@users.noreply.github.com"], {
  allowFail: true,
});

const remotes = execFileSync(git, ["remote"], {
  cwd: root,
  encoding: "utf8",
  env: gitEnv,
}).trim();
if (!remotes.includes("origin")) {
  runGit(["remote", "add", "origin", GITHUB_REMOTE]);
} else {
  runGit(["remote", "set-url", "origin", GITHUB_REMOTE]);
}

runGit(["add", "-A"]);
const nothingStaged = runGit(["diff", "--cached", "--quiet"], { allowFail: true });
if (nothingStaged) {
  console.log("No new changes to commit.");
} else {
  console.log("Creating commit...");
  runGit(["commit", "-m", "Deploy HighThrive admin dashboard to GitHub Pages"]);
}

runGit(["branch", "-M", "main"]);

console.log(`\nPushing to ${GITHUB_REMOTE} ...`);
runGit(["push", "-u", "origin", "main"]);

console.log("\nEnabling GitHub Pages (Actions workflow)...");
try {
  execFileSync(
    gh,
    [
      "api",
      `repos/${GITHUB_OWNER}/${GITHUB_REPO}/pages`,
      "-X",
      "POST",
      "-f",
      "build_type=workflow",
    ],
    { cwd: root, stdio: "inherit", env: gitEnv },
  );
} catch {
  execFileSync(
    gh,
    [
      "api",
      `repos/${GITHUB_OWNER}/${GITHUB_REPO}/pages`,
      "-X",
      "PUT",
      "-f",
      "build_type=workflow",
    ],
    { cwd: root, stdio: "inherit", env: gitEnv },
  );
}

console.log(`\nTriggering deploy workflow: ${DEPLOY_WORKFLOW}`);
runGh(["workflow", "run", DEPLOY_WORKFLOW, "--ref", "main"]);

console.log(`
Done! Your repo is live at:
  https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}

After the workflow finishes (1–2 min), open:
  ${GITHUB_PAGES_URL}

Optional — connect Supabase for live data:
  copy .env.example .env.local
  npm run github:secrets
  npm run github:deploy
`);
