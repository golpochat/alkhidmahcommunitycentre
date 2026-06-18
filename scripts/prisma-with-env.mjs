import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parsePgUrl(raw) {
  const url = raw.trim().replace(/^["']|["']$/g, "");
  const parsed = new URL(url.replace(/^postgresql:/, "http:"));
  return { parsed };
}

function toPgUrl(parsed) {
  const auth =
    parsed.password != null && parsed.password !== ""
      ? `${parsed.username}:${decodeURIComponent(parsed.password)}@`
      : parsed.username
        ? `${parsed.username}@`
        : "";
  return `postgresql://${auth}${parsed.host}${parsed.pathname}${parsed.search}`;
}

function usesPooler(databaseUrl) {
  const { parsed } = parsePgUrl(databaseUrl);
  return (
    parsed.hostname.includes("-pooler") ||
    parsed.searchParams.get("pgbouncer") === "true"
  );
}

function deriveDirectUrl(databaseUrl) {
  const { parsed } = parsePgUrl(databaseUrl);
  parsed.hostname = parsed.hostname.replace("-pooler", "");
  parsed.searchParams.delete("pgbouncer");

  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  return toPgUrl(parsed);
}

function resolveCliDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is missing. Copy .env.example to .env.local and set your PostgreSQL connection string."
    );
    process.exit(1);
  }

  if (process.env.DIRECT_URL?.trim()) {
    return process.env.DIRECT_URL.trim();
  }

  if (usesPooler(databaseUrl)) {
    return deriveDirectUrl(databaseUrl);
  }

  return databaseUrl;
}

function releasePrismaEngineLock() {
  if (!isWindows) return 0;

  const marker = path.basename(projectRoot);
  const scriptPath = path.join(projectRoot, "scripts", "release-prisma-engine-lock.ps1");

  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-ProjectMarker",
      marker,
      "-SelfPid",
      String(process.pid),
    ],
    { stdio: "inherit", shell: false },
  );

  if (result.status !== 0) {
    console.warn("Could not release Prisma engine lock automatically.");
    return 0;
  }

  return 1;
}

function isPrismaEngineLockError(output) {
  return (
    output.includes("EPERM") &&
    output.includes("query_engine") &&
    output.includes(".dll.node")
  );
}

function runPrisma(args, env, { capture = false } = {}) {
  return spawnSync("npx", ["prisma", ...args], {
    stdio: capture ? "pipe" : "inherit",
    env,
    shell: true,
    encoding: capture ? "utf8" : undefined,
  });
}

function runPrismaGenerate(env, { forceUnlock = false } = {}) {
  const maxAttempts = isWindows ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (forceUnlock && attempt === 1) {
      releasePrismaEngineLock();
    }

    const result = runPrisma(["generate"], env, { capture: isWindows });

    if (result.status === 0) {
      if (isWindows) {
        process.stdout.write(result.stdout ?? "");
        process.stderr.write(result.stderr ?? "");
      }
      return 0;
    }

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    if (
      isWindows &&
      isPrismaEngineLockError(output) &&
      attempt < maxAttempts
    ) {
      console.warn(
        `Prisma generate failed with a Windows file lock (attempt ${attempt}/${maxAttempts}).`,
      );
      releasePrismaEngineLock();
      continue;
    }

    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (isWindows && isPrismaEngineLockError(output)) {
      console.error(
        "\nPrisma could not update the query engine while another process holds the file lock.",
      );
      console.error("Use: npm run db:generate");
      console.error("Or:  npm run db:generate:unlock");
      console.error("Avoid: npx prisma generate (bypasses the Windows lock handler)");
    }
    return result.status ?? 1;
  }

  return 1;
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const prismaArgs = process.argv.slice(2);
const subcommand = prismaArgs[0] ?? "";
const forceUnlock = prismaArgs.includes("--unlock");
const filteredArgs = prismaArgs.filter((arg) => arg !== "--unlock");
const offlineCommands = new Set(["generate", "format", "validate", "version"]);
const needsDatabase = !offlineCommands.has(subcommand);
const env = { ...process.env };

if (needsDatabase) {
  env.DATABASE_URL = resolveCliDatabaseUrl();
}

let exitCode;

if (subcommand === "generate") {
  exitCode = runPrismaGenerate(env, { forceUnlock });
} else {
  const result = runPrisma(filteredArgs, env);
  exitCode = result.status ?? 1;
}

process.exit(exitCode);
