/**
 * One-time migration: copies legacy email config into SmtpEmailSetting.
 * Safe to re-run — skips if rows already exist.
 *
 *   npm run db:migrate-email
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_SETTING_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "notification_email",
] as const;

type LegacyEmailRow = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPasswordEnc: string;
  fromEmail: string;
  notificationEmail: string;
};

async function readLegacyEmailSettingsTable(): Promise<LegacyEmailRow | null> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUsername: string;
        smtpPasswordEnc: string;
        fromEmail: string;
        notificationEmail: string;
      }>
    >`SELECT "smtpHost", "smtpPort", "smtpSecure", "smtpUsername", "smtpPasswordEnc", "fromEmail", "notificationEmail"
      FROM "EmailSettings"
      WHERE id = 'singleton'
      LIMIT 1`;

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function readLegacySettingKeys(): Promise<LegacyEmailRow | null> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...LEGACY_SETTING_KEYS] } },
  });

  if (rows.length === 0) {
    return null;
  }

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const smtpHost = map.smtp_host || "";
  const smtpUsername = map.smtp_user || "";

  if (!smtpHost && !smtpUsername) {
    return null;
  }

  const secure = map.smtp_secure === "true";
  const port = Number(map.smtp_port) || 587;

  return {
    smtpHost,
    smtpPort: port,
    smtpSecure: secure,
    smtpUsername,
    smtpPasswordEnc: map.smtp_pass || "",
    fromEmail: map.smtp_from || "",
    notificationEmail: map.notification_email || "",
  };
}

async function main() {
  const existing = await prisma.smtpEmailSetting.count();
  if (existing > 0) {
    console.log("SmtpEmailSetting already has rows; nothing to migrate.");
    return;
  }

  const legacy =
    (await readLegacyEmailSettingsTable()) ?? (await readLegacySettingKeys());

  if (!legacy) {
    console.log("No legacy email configuration found to migrate.");
    return;
  }

  await prisma.smtpEmailSetting.create({
    data: {
      provider: "Custom",
      smtpHost: legacy.smtpHost,
      smtpPort: legacy.smtpPort || 587,
      encryption: legacy.smtpSecure ? "SSL" : "TLS",
      smtpUsername: legacy.smtpUsername,
      smtpPasswordEnc: legacy.smtpPasswordEnc,
      fromEmail: legacy.fromEmail,
      fromName: "Al Khidmah Community Centre",
      isDefault: true,
    },
  });

  if (legacy.notificationEmail) {
    await prisma.setting.upsert({
      where: { key: "notification_email" },
      create: { key: "notification_email", value: legacy.notificationEmail },
      update: { value: legacy.notificationEmail },
    });
  }

  console.log("Migrated legacy email settings to SmtpEmailSetting.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
