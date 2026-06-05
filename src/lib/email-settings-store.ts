import "server-only";

import type { SmtpEncryption } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import {
  encryptionToSecure,
  type SmtpEncryptionType,
} from "@/lib/smtp-providers";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

export interface SmtpEmailSettingInput {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  encryption: SmtpEncryptionType;
  smtpUsername: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
  isDefault?: boolean;
}

export interface PublicSmtpEmailSetting {
  id: string;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  encryption: SmtpEncryptionType;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedSmtpEmailSetting extends PublicSmtpEmailSetting {
  smtpPassword: string;
  smtpSecure: boolean;
}

function toEncryptionType(value: SmtpEncryption): SmtpEncryptionType {
  if (value === "NONE" || value === "TLS" || value === "SSL") {
    return value;
  }
  return "TLS";
}

function toPublic(record: {
  id: string;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  encryption: SmtpEncryption;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
  smtpPasswordEnc: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicSmtpEmailSetting {
  return {
    id: record.id,
    provider: record.provider,
    smtpHost: record.smtpHost,
    smtpPort: record.smtpPort,
    encryption: toEncryptionType(record.encryption),
    smtpUsername: record.smtpUsername,
    fromEmail: record.fromEmail,
    fromName: record.fromName,
    isDefault: record.isDefault,
    hasPassword: Boolean(record.smtpPasswordEnc),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function decryptPassword(stored: string) {
  if (!stored) {
    return "";
  }

  try {
    return decryptSecret(stored);
  } catch {
    return stored;
  }
}

function toResolved(record: Parameters<typeof toPublic>[0]): ResolvedSmtpEmailSetting {
  const encryption = toEncryptionType(record.encryption);
  return {
    ...toPublic(record),
    smtpPassword: decryptPassword(record.smtpPasswordEnc),
    smtpSecure: encryptionToSecure(encryption),
  };
}

async function readLegacyEmailSettings() {
  const legacyKeys = [
    SETTING_KEYS.smtpHost,
    SETTING_KEYS.smtpPort,
    SETTING_KEYS.smtpSecure,
    SETTING_KEYS.smtpUser,
    SETTING_KEYS.smtpPass,
    SETTING_KEYS.smtpFrom,
  ];

  const rows = await db.setting.findMany({
    where: { key: { in: legacyKeys } },
  });

  if (rows.length === 0) {
    return null;
  }

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  if (!map[SETTING_KEYS.smtpHost] && !map[SETTING_KEYS.smtpUser]) {
    return null;
  }

  const secure = map[SETTING_KEYS.smtpSecure] === "true";
  const port = Number(map[SETTING_KEYS.smtpPort] || DEFAULT_SETTINGS[SETTING_KEYS.smtpPort]);

  return {
    provider: "Custom",
    smtpHost: map[SETTING_KEYS.smtpHost] || "",
    smtpPort: port || 587,
    encryption: (secure ? "SSL" : "TLS") as SmtpEncryptionType,
    smtpUsername: map[SETTING_KEYS.smtpUser] || "",
    smtpPassword: map[SETTING_KEYS.smtpPass] || "",
    fromEmail: map[SETTING_KEYS.smtpFrom] || "",
    fromName: DEFAULT_SETTINGS[SETTING_KEYS.siteName] || "",
  };
}

async function migrateLegacyIfEmpty() {
  const count = await db.smtpEmailSetting.count();
  if (count > 0) {
    return;
  }

  const legacy = await readLegacyEmailSettings();
  if (!legacy?.smtpHost && !legacy?.smtpUsername) {
    return;
  }

  await db.smtpEmailSetting.create({
    data: {
      provider: legacy.provider,
      smtpHost: legacy.smtpHost,
      smtpPort: legacy.smtpPort,
      encryption: legacy.encryption,
      smtpUsername: legacy.smtpUsername,
      smtpPasswordEnc: legacy.smtpPassword
        ? encryptSecret(legacy.smtpPassword)
        : "",
      fromEmail: legacy.fromEmail,
      fromName: legacy.fromName,
      isDefault: true,
    },
  });
}

async function clearOtherDefaults(exceptId?: string) {
  await db.smtpEmailSetting.updateMany({
    where: exceptId ? { id: { not: exceptId }, isDefault: true } : { isDefault: true },
    data: { isDefault: false },
  });
}

export async function listPublicSmtpEmailSettings(): Promise<PublicSmtpEmailSetting[]> {
  await migrateLegacyIfEmpty();
  const records = await db.smtpEmailSetting.findMany({
    orderBy: [{ isDefault: "desc" }, { provider: "asc" }],
  });
  return records.map(toPublic);
}

export async function getPublicSmtpEmailSetting(
  id: string
): Promise<PublicSmtpEmailSetting | null> {
  await migrateLegacyIfEmpty();
  const record = await db.smtpEmailSetting.findUnique({ where: { id } });
  return record ? toPublic(record) : null;
}

export async function getResolvedDefaultSmtpEmailSetting(): Promise<ResolvedSmtpEmailSetting | null> {
  await migrateLegacyIfEmpty();
  const record = await db.smtpEmailSetting.findFirst({
    where: { isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!record) {
    return null;
  }

  const resolved = toResolved(record);
  if (!resolved.smtpHost || !resolved.smtpUsername || !resolved.smtpPassword) {
    return null;
  }

  return resolved;
}

export async function getResolvedSmtpEmailSetting(
  id: string
): Promise<ResolvedSmtpEmailSetting | null> {
  const record = await db.smtpEmailSetting.findUnique({ where: { id } });
  if (!record) {
    return null;
  }

  const resolved = toResolved(record);
  if (!resolved.smtpHost || !resolved.smtpUsername || !resolved.smtpPassword) {
    return null;
  }

  return resolved;
}

export async function createSmtpEmailSetting(input: SmtpEmailSettingInput) {
  const password = input.smtpPassword?.trim();
  if (!password) {
    throw new Error("SMTP password is required");
  }

  const existingCount = await db.smtpEmailSetting.count();
  const shouldDefault = input.isDefault ?? existingCount === 0;

  if (shouldDefault) {
    await clearOtherDefaults();
  }

  const record = await db.smtpEmailSetting.create({
    data: {
      provider: input.provider.trim(),
      smtpHost: input.smtpHost.trim(),
      smtpPort: input.smtpPort,
      encryption: input.encryption,
      smtpUsername: input.smtpUsername.trim(),
      smtpPasswordEnc: encryptSecret(password),
      fromEmail: input.fromEmail.trim().toLowerCase(),
      fromName: input.fromName.trim(),
      isDefault: shouldDefault,
    },
  });

  return toPublic(record);
}

export async function updateSmtpEmailSetting(
  id: string,
  input: SmtpEmailSettingInput
) {
  const current = await db.smtpEmailSetting.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Email setting not found");
  }

  const nextPasswordEnc =
    input.smtpPassword && input.smtpPassword.trim()
      ? encryptSecret(input.smtpPassword.trim())
      : current.smtpPasswordEnc;

  if (!nextPasswordEnc) {
    throw new Error("SMTP password is required");
  }

  if (input.isDefault === false && current.isDefault) {
    const otherDefaults = await db.smtpEmailSetting.count({
      where: { isDefault: true, id: { not: id } },
    });
    if (otherDefaults === 0) {
      throw new Error(
        "At least one email setting must be default. Set another profile as default first."
      );
    }
  }

  if (input.isDefault) {
    await clearOtherDefaults(id);
  }

  const record = await db.smtpEmailSetting.update({
    where: { id },
    data: {
      provider: input.provider.trim(),
      smtpHost: input.smtpHost.trim(),
      smtpPort: input.smtpPort,
      encryption: input.encryption,
      smtpUsername: input.smtpUsername.trim(),
      smtpPasswordEnc: nextPasswordEnc,
      fromEmail: input.fromEmail.trim().toLowerCase(),
      fromName: input.fromName.trim(),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    },
  });

  return toPublic(record);
}

export async function deleteSmtpEmailSetting(id: string) {
  const current = await db.smtpEmailSetting.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Email setting not found");
  }

  const total = await db.smtpEmailSetting.count();
  if (total <= 1) {
    throw new Error("At least one email setting must remain");
  }

  if (current.isDefault) {
    throw new Error(
      "Cannot delete the default email setting. Set another profile as default first."
    );
  }

  await db.smtpEmailSetting.delete({ where: { id } });
}

export async function setDefaultSmtpEmailSetting(id: string) {
  const current = await db.smtpEmailSetting.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Email setting not found");
  }

  await clearOtherDefaults(id);

  const record = await db.smtpEmailSetting.update({
    where: { id },
    data: { isDefault: true },
  });

  return toPublic(record);
}

export async function getNotificationEmail() {
  const row = await db.setting.findUnique({
    where: { key: SETTING_KEYS.notificationEmail },
  });

  const value =
    row?.value?.trim() ||
    DEFAULT_SETTINGS[SETTING_KEYS.notificationEmail]?.trim() ||
    "";

  return value || null;
}

/** @deprecated Use listPublicSmtpEmailSettings */
export async function getPublicEmailSettings() {
  const list = await listPublicSmtpEmailSettings();
  const defaults = list.find((item) => item.isDefault) ?? list[0];
  if (!defaults) {
    return {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: "",
      fromEmail: "",
      notificationEmail: (await getNotificationEmail()) || "",
      hasPassword: false,
      updatedAt: null,
    };
  }

  return {
    smtpHost: defaults.smtpHost,
    smtpPort: defaults.smtpPort,
    smtpSecure: encryptionToSecure(defaults.encryption),
    smtpUsername: defaults.smtpUsername,
    fromEmail: defaults.fromEmail,
    notificationEmail: (await getNotificationEmail()) || "",
    hasPassword: defaults.hasPassword,
    updatedAt: defaults.updatedAt,
  };
}

/** @deprecated Use getResolvedDefaultSmtpEmailSetting */
export async function getResolvedEmailSettings() {
  const config = await getResolvedDefaultSmtpEmailSetting();
  if (!config) {
    return null;
  }

  return {
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpUsername: config.smtpUsername,
    smtpPassword: config.smtpPassword,
    fromEmail: config.fromEmail,
    notificationEmail: (await getNotificationEmail()) || "",
    hasPassword: config.hasPassword,
    updatedAt: config.updatedAt,
  };
}
