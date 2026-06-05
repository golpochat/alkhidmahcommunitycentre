import { PrismaClient } from "@prisma/client";
import {
  ensureSingleSuperAdmin,
  getSuperAdminEmail,
} from "../src/lib/super-admin";
import { getRoleIdBySlug } from "../src/lib/seed-rbac";
import { SUPER_ADMIN_ROLE_SLUG } from "../src/lib/rbac-seed";

const prisma = new PrismaClient();

async function main() {
  const superAdminRoleId = await getRoleIdBySlug(prisma, SUPER_ADMIN_ROLE_SLUG);

  const before = await prisma.user.findMany({
    where: { roleId: superAdminRoleId },
    select: { email: true },
  });

  const result = await ensureSingleSuperAdmin(prisma);

  const after = await prisma.user.findMany({
    where: { roleId: superAdminRoleId },
    select: { email: true },
  });

  console.log(`Canonical super-admin email: ${getSuperAdminEmail()}`);

  if (before.length > 1) {
    console.log(
      `Fixed duplicate super-admins. Demoted ${result?.demotedCount ?? 0} account(s) to admin.`
    );
    console.log(`Previously: ${before.map((user) => user.email).join(", ")}`);
  }

  if (after.length === 1) {
    console.log(`Super-admin is now: ${after[0].email}`);
  } else if (after.length === 0) {
    console.log("No super-admin account found. Run npm run db:seed first.");
  } else {
    console.error("ERROR: Multiple super-admins still exist:", after);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
