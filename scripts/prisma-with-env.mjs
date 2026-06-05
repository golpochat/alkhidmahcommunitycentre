import fs from "fs";
import { spawnSync } from "child_process";

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

loadEnvFile(".env");
loadEnvFile(".env.local");

const prismaArgs = process.argv.slice(2);
const subcommand = prismaArgs[0] ?? "";
const offlineCommands = new Set(["generate", "format", "validate", "version"]);
const needsDatabase = !offlineCommands.has(subcommand);
const env = { ...process.env };

if (needsDatabase) {
  env.DATABASE_URL = resolveCliDatabaseUrl();
}

const result = spawnSync("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
