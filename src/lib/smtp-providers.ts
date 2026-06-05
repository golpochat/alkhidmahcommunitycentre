export type SmtpEncryptionType = "NONE" | "TLS" | "SSL";

export interface SmtpProviderPreset {
  id: string;
  label: string;
  smtpHost: string;
  smtpPort: number;
  encryption: SmtpEncryptionType;
}

export const SMTP_PROVIDER_PRESETS: SmtpProviderPreset[] = [
  {
    id: "gmail",
    label: "Gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "sendgrid",
    label: "SendGrid",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "outlook",
    label: "Outlook",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "mailgun",
    label: "Mailgun",
    smtpHost: "smtp.mailgun.org",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "amazon-ses",
    label: "Amazon SES",
    smtpHost: "email-smtp.eu-west-1.amazonaws.com",
    smtpPort: 587,
    encryption: "TLS",
  },
  {
    id: "custom",
    label: "Custom",
    smtpHost: "",
    smtpPort: 587,
    encryption: "TLS",
  },
];

export const SMTP_PORT_OPTIONS = ["25", "465", "587"] as const;

export const SMTP_ENCRYPTION_OPTIONS: { value: SmtpEncryptionType; label: string }[] =
  [
    { value: "NONE", label: "None" },
    { value: "TLS", label: "TLS" },
    { value: "SSL", label: "SSL" },
  ];

export function findProviderPreset(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return (
    SMTP_PROVIDER_PRESETS.find(
      (preset) =>
        preset.id === normalized ||
        preset.label.toLowerCase() === normalized
    ) ?? SMTP_PROVIDER_PRESETS.find((preset) => preset.id === "custom")
  );
}

export function encryptionToSecure(encryption: SmtpEncryptionType) {
  return encryption === "SSL";
}
