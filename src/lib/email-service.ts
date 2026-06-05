import nodemailer from "nodemailer";
import { SITE_NAME } from "@/lib/constants";
import {
  getNotificationEmail,
  getResolvedDefaultSmtpEmailSetting,
  getResolvedSmtpEmailSetting,
  type ResolvedSmtpEmailSetting,
} from "@/lib/email-settings-store";

export type EmailSendResult = "sent" | "fallback" | "failed";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface EmailValidationResult {
  valid: boolean;
  errors: string[];
}

function logDevEmailFallback(label: string, to: string, subject: string, html: string) {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  console.info(
    `[dev email] ${label}\n  To: ${to}\n  Subject: ${subject}\n  Body: ${html}`
  );
  return true;
}

export function validateEmailSettingsConfig(
  config: Partial<ResolvedSmtpEmailSetting> | null
): EmailValidationResult {
  const errors: string[] = [];

  if (!config) {
    return { valid: false, errors: ["No default email setting is configured"] };
  }

  if (!config.smtpHost?.trim()) {
    errors.push("SMTP host is required");
  }

  if (!config.smtpPort || config.smtpPort < 1 || config.smtpPort > 65535) {
    errors.push("SMTP port must be between 1 and 65535");
  }

  if (!config.smtpUsername?.trim()) {
    errors.push("SMTP username is required");
  }

  if (!config.smtpPassword?.trim()) {
    errors.push("SMTP password is required");
  }

  if (!config.fromEmail?.trim()) {
    errors.push("From email is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function createTransporter(config: ResolvedSmtpEmailSetting) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUsername,
      pass: config.smtpPassword,
    },
  });
}

function formatFromAddress(config: ResolvedSmtpEmailSetting) {
  const name = config.fromName?.trim() || SITE_NAME;
  return `"${name}" <${config.fromEmail}>`;
}

async function resolveConfig(settingId?: string) {
  if (settingId) {
    return getResolvedSmtpEmailSetting(settingId);
  }
  return getResolvedDefaultSmtpEmailSetting();
}

export async function sendEmail(
  input: SendEmailInput,
  options?: { settingId?: string }
): Promise<EmailSendResult> {
  const config = await resolveConfig(options?.settingId);
  const validation = validateEmailSettingsConfig(config);

  if (!validation.valid || !config) {
    if (
      logDevEmailFallback("send-email", input.to, input.subject, input.html)
    ) {
      return "fallback";
    }
    return "failed";
  }

  try {
    const transporter = createTransporter(config);

    await transporter.sendMail({
      from: formatFromAddress(config),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType ?? "application/octet-stream",
      })),
    });

    return "sent";
  } catch (error) {
    console.warn("Failed to send email.", error);

    if (
      logDevEmailFallback("send-email-fallback", input.to, input.subject, input.html)
    ) {
      return "fallback";
    }

    return "failed";
  }
}

export async function sendTestEmail(options?: {
  to?: string;
  settingId?: string;
}): Promise<EmailSendResult> {
  const config = await resolveConfig(options?.settingId);
  const validation = validateEmailSettingsConfig(config);

  if (!validation.valid || !config) {
    throw new Error(validation.errors.join(". "));
  }

  const notificationEmail = await getNotificationEmail();
  const recipient = options?.to?.trim() || notificationEmail;

  if (!recipient) {
    throw new Error(
      "No recipient email. Set a notification email in Site settings or pass a test address."
    );
  }

  return sendEmail(
    {
      to: recipient,
      subject: `Test Email — ${SITE_NAME}`,
      html: `
      <h2>SMTP Test Successful</h2>
      <p>This is a test email from ${SITE_NAME} using <strong>${config.provider}</strong>.</p>
      <p>If you received this message, your SMTP configuration is working correctly.</p>
    `,
      text: `This is a test email from ${SITE_NAME}. If you received this message, your SMTP configuration is working correctly.`,
    },
    { settingId: options?.settingId }
  );
}

export async function isEmailConfigured() {
  const config = await getResolvedDefaultSmtpEmailSetting();
  return validateEmailSettingsConfig(config).valid;
}

export { getNotificationEmail } from "@/lib/email-settings-store";
