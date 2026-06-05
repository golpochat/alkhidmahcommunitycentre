import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

function getMigrationNames() {
  const migrationsDir = path.join("prisma", "migrations");

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runPrisma(args, { allowAlreadyApplied = false } = {}) {
  const result = spawnSync("node", ["scripts/prisma-with-env.mjs", ...args], {
    encoding: "utf8",
    shell: true,
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (result.status === 0) {
    if (output.trim()) {
      process.stdout.write(output);
    }
    return "applied";
  }

  if (
    allowAlreadyApplied &&
    (output.includes("P3008") ||
      output.includes("already recorded as applied"))
  ) {
    return "skipped";
  }

  if (output.trim()) {
    process.stderr.write(output);
  }

  process.exit(result.status ?? 1);
}

const migrations = getMigrationNames();

if (migrations.length === 0) {
  console.error("No migrations found in prisma/migrations.");
  process.exit(1);
}

console.log("Step 1/2: Sync schema with db push...");
runPrisma(["db", "push"]);

console.log(`\nStep 2/2: Baselining ${migrations.length} migrations as already applied...`);

let appliedCount = 0;
let skippedCount = 0;

for (const name of migrations) {
  console.log(`\n→ ${name}`);
  const result = runPrisma(["migrate", "resolve", "--applied", name], {
    allowAlreadyApplied: true,
  });

  if (result === "skipped") {
    console.log("  already applied, skipping");
    skippedCount += 1;
  } else {
    appliedCount += 1;
  }
}

console.log("\nBaseline complete.");
console.log(`  Marked applied: ${appliedCount}`);
console.log(`  Already applied: ${skippedCount}`);
console.log("\nFuture schema updates:");
console.log("  npm run db:migrate   # create + apply new migrations in development");
console.log("  npm run db:deploy    # apply pending migrations in production");

console.log("\nVerifying migration status...");
runPrisma(["migrate", "deploy"]);
