import fs from "fs";

const path = ".env.local";
const content = fs.readFileSync(path, "utf8");
const match = content.match(/^DATABASE_URL=(.+)$/m);

if (!match) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

function parsePgUrl(raw) {
  const url = raw.trim().replace(/^["']|["']$/g, "");
  const parsed = new URL(url.replace(/^postgresql:/, "http:"));
  return { url, parsed };
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

function ensureNeonRuntimeParams(rawUrl) {
  const { parsed } = parsePgUrl(rawUrl);

  if (!parsed.hostname.includes("-pooler")) {
    parsed.hostname = parsed.hostname.replace(/^([^.]+)/, "$1-pooler");
  }

  parsed.searchParams.set("sslmode", "require");
  parsed.searchParams.set("pgbouncer", "true");
  if (!parsed.searchParams.has("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "15");
  }

  return toPgUrl(parsed);
}

let databaseUrl = match[1].trim().replace(/^["']|["']$/g, "");
const directMatch = content.match(/^DIRECT_URL=(.+)$/m);
const directUrl = directMatch
  ? directMatch[1].trim().replace(/^["']|["']$/g, "")
  : databaseUrl;

const poolUrl = ensureNeonRuntimeParams(databaseUrl);

let updated = content;
if (/^DIRECT_URL=/m.test(content)) {
  updated = updated.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${poolUrl}`);
} else {
  updated = updated.replace(
    /^DATABASE_URL=.*$/m,
    `DIRECT_URL=${directUrl}\nDATABASE_URL=${poolUrl}`
  );
}

fs.writeFileSync(path, updated);
console.log("Updated .env.local:");
console.log("  DATABASE_URL -> pooler host + sslmode=require + pgbouncer=true");
