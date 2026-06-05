import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";
import { join } from "path";
import { getRoleIdBySlug, seedRbac } from "../src/lib/seed-rbac";
import { SUPER_ADMIN_ROLE_SLUG } from "../src/lib/rbac-seed";
import {
  ensureSingleSuperAdmin,
  getSuperAdminEmail,
} from "../src/lib/super-admin";

const prisma = new PrismaClient();

const STAFF_AND_MEMBER_USERS = [
  {
    level: 2,
    roleSlug: "admin",
    label: "Admin",
    email: "staff-admin@alkhidmah.ie",
    password: "Admin2026!",
    name: "Staff Admin",
    route: "/admin",
  },
  {
    level: 2,
    roleSlug: "editor",
    label: "Editor",
    email: "editor@alkhidmah.ie",
    password: "Editor2026!",
    name: "Content Editor",
    route: "/admin",
  },
  {
    level: 2,
    roleSlug: "web-admin",
    label: "Web Admin",
    email: "webadmin@alkhidmah.ie",
    password: "WebAdmin2026!",
    name: "Web Admin",
    route: "/admin",
  },
  {
    level: 2,
    roleSlug: "account-admin",
    label: "Account Admin",
    email: "accountadmin@alkhidmah.ie",
    password: "AccountAdmin2026!",
    name: "Account Admin",
    route: "/admin",
  },
  {
    level: 3,
    roleSlug: "member",
    label: "Member",
    email: "member@alkhidmah.ie",
    password: "Member2026!",
    name: "Community Member",
    route: "/user",
  },
] as const;

function getSuperAdminCredentials() {
  return {
    email: getSuperAdminEmail(),
    password: process.env.ADMIN_PASSWORD || "SuperAdmin2026!",
    name: "Super Admin",
    route: "/super-admin",
  };
}

function buildMarkdownDoc() {
  const superAdmin = getSuperAdminCredentials();

  const lines = [
    "# Al Khidmah Mosque — Test User Accounts",
    "",
    "Development / staging credentials for each RBAC level and role.",
    "",
    "**Login URL:** [http://localhost:3000/login](http://localhost:3000/login)",
    "",
    "**Member registration:** [http://localhost:3000/register](http://localhost:3000/register)",
    "",
    "> Keep this file private. Do not commit to version control.",
    "",
    "> **Super-admin:** Only one account exists. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`.",
    "",
    "---",
    "",
    "## Level 1 — Super Admin",
    "",
    "Single super-admin account (from `.env.local`). Cannot be duplicated via the panel.",
    "",
    "| Role | Name | Email | Password | After login |",
    "|------|------|-------|----------|-------------|",
    `| Super Admin | ${superAdmin.name} | \`${superAdmin.email}\` | \`${superAdmin.password}\` | \`${superAdmin.route}\` |`,
    "",
    "## Level 2 — Staff",
    "",
    "Staff roles with different permissions in the admin panel.",
    "",
    "| Role | Name | Email | Password | After login |",
    "|------|------|-------|----------|-------------|",
  ];

  for (const user of STAFF_AND_MEMBER_USERS.filter((u) => u.level === 2)) {
    lines.push(
      `| ${user.label} | ${user.name} | \`${user.email}\` | \`${user.password}\` | \`${user.route}\` |`
    );
  }

  lines.push(
    "",
    "### Staff permissions summary",
    "",
    "| Role | Events | Gallery | Classes | Donations | Prayer times | Users | Settings |",
    "|------|--------|---------|---------|-----------|--------------|-------|----------|",
    "| Admin | Full | Full | Full | Full | Full | — | — |",
    "| Editor | Create/edit | — | Create/edit | — | Full | — | — |",
    "| Web Admin | Full | Full | — | — | Full | — | — |",
    "| Account Admin | — | — | Full | Full | — | — | — |",
    "",
    "## Level 3 — Member",
    "",
    "General community users (donors, class registrants).",
    "",
    "| Role | Name | Email | Password | After login |",
    "|------|------|-------|----------|-------------|",
  );

  for (const user of STAFF_AND_MEMBER_USERS.filter((u) => u.level === 3)) {
    lines.push(
      `| ${user.label} | ${user.name} | \`${user.email}\` | \`${user.password}\` | \`${user.route}\` |`
    );
  }

  lines.push("", "---", "", "## Quick copy", "", "### Super Admin");
  lines.push(`- **Email:** ${superAdmin.email}`);
  lines.push(`- **Password:** ${superAdmin.password}`);
  lines.push(`- **Route:** ${superAdmin.route}`);
  lines.push("");

  for (const user of STAFF_AND_MEMBER_USERS) {
    lines.push(`### ${user.label}`);
    lines.push(`- **Email:** ${user.email}`);
    lines.push(`- **Password:** ${user.password}`);
    lines.push(`- **Route:** ${user.route}`);
    lines.push("");
  }

  lines.push("---", "", `*Generated: ${new Date().toISOString()}*`, "");

  return lines.join("\n");
}

async function main() {
  await seedRbac(prisma);

  const superAdminRoleId = await getRoleIdBySlug(prisma, SUPER_ADMIN_ROLE_SLUG);
  const superAdmin = getSuperAdminCredentials();
  const superAdminHash = await bcrypt.hash(superAdmin.password, 12);

  await prisma.user.upsert({
    where: { email: superAdmin.email },
    update: {
      name: superAdmin.name,
      roleId: superAdminRoleId,
      passwordHash: superAdminHash,
    },
    create: {
      email: superAdmin.email,
      name: superAdmin.name,
      roleId: superAdminRoleId,
      passwordHash: superAdminHash,
    },
  });

  console.log(`✓ Super Admin: ${superAdmin.email}`);

  for (const user of STAFF_AND_MEMBER_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const roleId = await getRoleIdBySlug(prisma, user.roleSlug);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        roleId,
        passwordHash,
      },
    });

    console.log(`✓ ${user.label}: ${user.email}`);
  }

  const fix = await ensureSingleSuperAdmin(prisma);
  if (fix && fix.demotedCount > 0) {
    console.log(
      `\nDemoted ${fix.demotedCount} duplicate super-admin account(s) to ADMIN.`
    );
  }

  const docPath = join(process.cwd(), "TEST-ACCOUNTS.md");
  writeFileSync(docPath, buildMarkdownDoc(), "utf-8");
  console.log(`\nCredentials saved to ${docPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
