import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const GH_VERSION = "2.95.0";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = join(root, "tools", "gh");

export function ghBinaryPath() {
  const name = process.platform === "win32" ? "gh.exe" : "gh";
  return join(toolsDir, name);
}

function platformAsset() {
  const { platform, arch } = process;

  if (platform === "win32") {
    if (arch === "arm64") return { file: `gh_${GH_VERSION}_windows_arm64.zip`, inner: "bin/gh.exe" };
    if (arch === "ia32") return { file: `gh_${GH_VERSION}_windows_386.zip`, inner: "bin/gh.exe" };
    return { file: `gh_${GH_VERSION}_windows_amd64.zip`, inner: "bin/gh.exe" };
  }

  if (platform === "darwin") {
    const mac = arch === "arm64" ? "arm64" : "amd64";
    return { file: `gh_${GH_VERSION}_macOS_${mac}.zip`, inner: `gh_${GH_VERSION}_macOS_${mac}/bin/gh` };
  }

  const linux = arch === "arm64" ? "arm64" : arch === "ia32" ? "386" : "amd64";
  return { file: `gh_${GH_VERSION}_linux_${linux}.tar.gz`, inner: `gh_${GH_VERSION}_linux_${linux}/bin/gh` };
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

function extractTarGz(tarPath, destDir) {
  execFileSync("tar", ["-xzf", tarPath, "-C", destDir], { stdio: "inherit" });
}

export async function ensureGhInstalled({ quiet = false } = {}) {
  const binary = ghBinaryPath();
  if (existsSync(binary)) {
    if (!quiet) console.log(`GitHub CLI ready: ${binary}`);
    return binary;
  }

  const asset = platformAsset();
  const url = `https://github.com/cli/cli/releases/download/v${GH_VERSION}/${asset.file}`;
  const cacheDir = join(root, "tools", ".cache");
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(toolsDir, { recursive: true });

  const archivePath = join(cacheDir, asset.file);
  if (!quiet) console.log(`Downloading GitHub CLI v${GH_VERSION}...`);

  await download(url, archivePath);

  const extractDir = join(cacheDir, "extract");
  rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });

  if (asset.file.endsWith(".zip")) {
    extractWindowsZip(archivePath, extractDir);
  } else {
    extractTarGz(archivePath, extractDir);
  }

  const extracted = join(extractDir, asset.inner);
  if (!existsSync(extracted)) {
    throw new Error(`Expected binary not found after extract: ${extracted}`);
  }

  writeFileSync(binary, readFileSync(extracted));
  if (process.platform !== "win32") {
    execFileSync("chmod", ["+x", binary]);
  }

  if (!quiet) console.log(`Installed GitHub CLI to ${binary}`);
  return binary;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await ensureGhInstalled();
}
