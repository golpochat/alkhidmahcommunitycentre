/**
 * Migrates existing User.role (enum) → User.roleId (AccessRole FK).
 * Run once after pulling the dynamic RBAC schema:
 *
 *   npm run db:migrate-rbac
 */
import { PrismaClient } from "@prisma/client";
import { getRoleIdBySlug, seedRbac } from "../src/lib/seed-rbac";

const prisma = new PrismaClient();

const LEGACY_ROLE_TO_SLUG: Record<string, string> = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  EDITOR: "editor",
  WEB_ADMIN: "web-admin",
  ACCOUNT_ADMIN: "account-admin",
  MEMBER: "member",
};

async function columnExists(table: string, column: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function tableExists(table: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${table}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function ensureRbacTables() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "AccountTier" AS ENUM ('SUPER_ADMIN', 'STAFF', 'MEMBER');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  if (!(await tableExists("Permission"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Permission" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "group" TEXT NOT NULL,
        "isSystem" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key")`
    );
  }

  if (!(await tableExists("AccessRole"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "AccessRole" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "tier" "AccountTier" NOT NULL,
        "isSystem" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX "AccessRole_slug_key" ON "AccessRole"("slug")`
    );
  }

  if (!(await tableExists("AccessRolePermission"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "AccessRolePermission" (
        "roleId" TEXT NOT NULL,
        "permissionId" TEXT NOT NULL,
        CONSTRAINT "AccessRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "AccessRolePermission_permissionId_idx" ON "AccessRolePermission"("permissionId")`
    );
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AccessRolePermission" ADD CONSTRAINT "AccessRolePermission_roleId_fkey"
        FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AccessRolePermission" ADD CONSTRAINT "AccessRolePermission_permissionId_fkey"
        FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
}

async function main() {
  const hasLegacyRole = await columnExists("User", "role");
  const hasRoleId = await columnExists("User", "roleId");

  if (hasRoleId && !hasLegacyRole) {
    console.log("RBAC migration already applied (User.roleId exists, User.role removed).");
    await seedRbac(prisma);
    console.log("Permissions and roles re-synced from seed.");
    return;
  }

  if (!hasLegacyRole && !hasRoleId) {
    console.error(
      'User table has neither "role" nor "roleId". Run `npm run db:push` on a fresh database, then `npm run db:seed`.'
    );
    process.exit(1);
  }

  console.log("Creating RBAC tables…");
  await ensureRbacTables();

  console.log("Seeding permissions and roles…");
  await seedRbac(prisma);

  if (!(await columnExists("User", "roleId"))) {
    console.log('Adding User.roleId column…');
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "roleId" TEXT`);
  }

  const users = await prisma.$queryRaw<Array<{ id: string; role: string }>>`
    SELECT "id", "role"::text AS "role" FROM "User"
  `;

  console.log(`Mapping ${users.length} user(s) to access roles…`);

  for (const user of users) {
    const slug = LEGACY_ROLE_TO_SLUG[user.role];
    if (!slug) {
      throw new Error(`Unknown legacy role "${user.role}" for user ${user.id}`);
    }
    const roleId = await getRoleIdBySlug(prisma, slug);
    await prisma.$executeRaw`
      UPDATE "User" SET "roleId" = ${roleId} WHERE "id" = ${user.id}
    `;
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;
  `);

  const fkExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'User_roleId_fkey'
    ) AS "exists"
  `;

  if (!fkExists[0]?.exists) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD CONSTRAINT "User_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }

  const indexExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'User_roleId_idx'
    ) AS "exists"
  `;

  if (!indexExists[0]?.exists) {
    await prisma.$executeRawUnsafe(`CREATE INDEX "User_roleId_idx" ON "User"("roleId")`);
  }

  console.log('Dropping legacy User.role column and "Role" enum…');
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" DROP COLUMN IF EXISTS "role"`);
  await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Role"`);

  console.log("RBAC migration complete. Run: npm run db:push");
  console.log("(db push should report schema is already in sync.)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
