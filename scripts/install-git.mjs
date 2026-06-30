import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const GIT_VERSION = "2.49.0";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = join(root, "tools", "git");

export function portableGitPath() {
  return join(toolsDir, "cmd", "git.exe");
}

function findGitHubDesktopGit() {
  const base = join(process.env.LOCALAPPDATA || "", "GitHubDesktop");
  if (!existsSync(base)) return null;

  const appDirs = readdirSync(base)
    .filter((name) => name.startsWith("app-"))
    .sort()
    .reverse();

  for (const appDir of appDirs) {
    const git = join(base, appDir, "resources", "app", "git", "cmd", "git.exe");
    if (existsSync(git)) return git;
  }

  return null;
}

function findProgramFilesGit() {
  const candidates = [
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

function findGitOnPath() {
  try {
    const result = execFileSync("where.exe", ["git"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const first = result.split(/\r?\n/).find((line) => line.endsWith("git.exe"));
    return first && existsSync(first) ? first : null;
  } catch {
    return null;
  }
}

export function gitPathEnv(gitPath) {
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const existing = process.env[pathKey] || process.env.PATH || "";
  const dirs = new Set([dirname(gitPath)]);

  // GitHub Desktop / MinGit need extra dirs on PATH for subprocesses.
  const gitRoot = dirname(dirname(gitPath));
  for (const sub of ["mingw64/bin", "usr/bin", "cmd"]) {
    const dir = join(gitRoot, sub);
    if (existsSync(dir)) dirs.add(dir);
  }

  return {
    ...process.env,
    [pathKey]: [...dirs, existing].join(process.platform === "win32" ? ";" : ":"),
  };
}

function windowsAsset() {
  if (process.arch === "arm64") {
    return {
      file: `MinGit-${GIT_VERSION}-arm64.zip`,
      url: `https://github.com/git-for-windows/git/releases/download/v${GIT_VERSION}.windows.1/MinGit-${GIT_VERSION}-arm64.zip`,
    };
  }
  return {
    file: `MinGit-${GIT_VERSION}-64-bit.zip`,
    url: `https://github.com/git-for-windows/git/releases/download/v${GIT_VERSION}.windows.1/MinGit-${GIT_VERSION}-64-bit.zip`,
  };
}

async function download(url, dest) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
}

function extractWindowsZip(zipPath, destDir) {
  const escapedZip = zipPath.replace(/'/g, "''");
  const escapedDest = destDir.replace(/'/g, "''");
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDest}' -Force`,
    ],
    { stdio: "inherit" },
  );
}

async function downloadPortableGit() {
  const binary = portableGitPath();
  const asset = windowsAsset();
  const cacheDir = join(root, "tools", ".cache");
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(toolsDir, { recursive: true });

  const archivePath = join(cacheDir, asset.file);
  console.log(`Downloading MinGit ${GIT_VERSION}...`);
  await download(asset.url, archivePath);
  extractWindowsZip(archivePath, toolsDir);

  if (!existsSync(binary)) {
    throw new Error(`Expected git binary not found after extract: ${binary}`);
  }

  return binary;
}

export async function ensureGitInstalled({ quiet = false } = {}) {
  if (process.platform !== "win32") {
    try {
      execFileSync("git", ["--version"], { stdio: "pipe" });
      return "git";
    } catch {
      throw new Error("Git is not installed. Install from https://git-scm.com/");
    }
  }

  const candidates = [
    { label: "GitHub Desktop", path: findGitHubDesktopGit() },
    { label: "PATH", path: findGitOnPath() },
    { label: "Git for Windows", path: findProgramFilesGit() },
    { label: "project tools", path: existsSync(portableGitPath()) ? portableGitPath() : null },
  ];

  for (const { label, path } of candidates) {
    if (!path) continue;
    if (!quiet) console.log(`Using ${label} git: ${path}`);
    return path;
  }

  const binary = await downloadPortableGit();
  if (!quiet) console.log(`Installed Git to ${binary}`);
  return binary;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await ensureGitInstalled();
}
