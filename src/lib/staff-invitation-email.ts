import { EMAIL_BRAND, getDefaultEmailBranding } from "@/lib/email-brand";

const { gold, emerald, black, white, pageBg, cardBg, border, text, textMuted, textOnDark } =
  EMAIL_BRAND;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stepBlock(number: string, title: string, description: string) {
  return `
    <tr>
      <td style="padding:0 0 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid ${border};border-left:3px solid ${emerald};border-radius:6px;">
          <tr>
            <td style="padding:14px 16px;vertical-align:top;width:36px;">
              <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:${emerald};color:${white};font-size:13px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">
                ${number}
              </span>
            </td>
            <td style="padding:14px 16px 14px 0;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${text};font-family:Arial,Helvetica,sans-serif;">
                ${title}
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:${textMuted};font-family:Arial,Helvetica,sans-serif;">
                ${description}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildStaffInvitationEmailHtml(data: {
  recipientName: string;
  roleName: string;
  acceptUrl: string;
  siteName?: string;
  website?: string;
  logoUrl?: string;
}) {
  const defaults = getDefaultEmailBranding();
  const siteName = data.siteName ?? defaults.siteName;
  const website = data.website ?? defaults.website;
  const logoUrl = escapeHtml(data.logoUrl ?? defaults.logoUrl);

  const greetingName = escapeHtml(data.recipientName);
  const roleName = escapeHtml(data.roleName);
  const acceptUrl = escapeHtml(data.acceptUrl);
  const brand = escapeHtml(siteName);
  const siteLink = escapeHtml(website);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${brand} – Staff invitation</title>
</head>
<body style="margin:0;padding:32px 16px;background:${pageBg};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:10px;overflow:hidden;border:1px solid ${border};box-shadow:0 4px 24px rgba(10,10,10,0.06);">
          <tr>
            <td style="background:${black};padding:0;border-bottom:3px solid ${gold};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:28px 32px 24px;text-align:center;">
                    <img src="${logoUrl}" alt="${brand}" width="160" style="display:block;margin:0 auto 16px;max-width:160px;height:auto;border:0;" />
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:${gold};letter-spacing:0.02em;line-height:1.3;">
                      ${brand}
                    </p>
                    <p style="margin:10px 0 0;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${textOnDark};font-family:Arial,Helvetica,sans-serif;">
                      Staff invitation
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${cardBg};padding:32px 32px 28px;">
              <p style="margin:0 0 16px;font-size:16px;color:${text};font-family:Arial,Helvetica,sans-serif;">
                Hello ${greetingName},
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${text};font-family:Arial,Helvetica,sans-serif;">
                You have been invited to join <strong style="color:${emerald};">${brand}</strong> as
                <strong>${roleName}</strong>. Complete the steps below using the button at the end of this email.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                ${stepBlock("1", "Verify your email", "Confirm this is your correct email address.")}
                ${stepBlock("2", "Activate your account", "Activate your staff account for the admin area.")}
                ${stepBlock("3", "Set your password", "Create a secure password to sign in.")}
              </table>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${textMuted};font-family:Arial,Helvetica,sans-serif;text-align:center;">
                This invitation link expires in <strong style="color:${text};">7 days</strong>.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:8px;background:${gold};box-shadow:0 2px 8px rgba(212,175,55,0.35);">
                    <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:${black};text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
                      Complete setup
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.55;color:${textMuted};font-family:Arial,Helvetica,sans-serif;text-align:center;">
                If you did not expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:16px 32px;border-top:1px solid ${border};text-align:center;">
              <p style="margin:0;font-size:12px;color:${textMuted};font-family:Arial,Helvetica,sans-serif;">
                <a href="${siteLink}" style="color:${emerald};text-decoration:none;font-weight:600;">${brand}</a>
                <span style="color:${border};"> · </span>
                Staff invitation
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;text-align:center;font-size:11px;line-height:1.5;color:${textMuted};font-family:Arial,Helvetica,sans-serif;">
          ${brand}<br />
          <span style="color:${textOnDark};">Serving the Muslim community of Clondalkin</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildStaffInvitationEmailText(data: {
  recipientName: string;
  roleName: string;
  acceptUrl: string;
  siteName?: string;
}) {
  const siteName = data.siteName ?? getDefaultEmailBranding().siteName;

  return `Hello ${data.recipientName},

You have been invited to join ${siteName} as ${data.roleName}.

Complete your setup (verify email, activate account, set password):
${data.acceptUrl}

This link expires in 7 days.

If you did not expect this email, you can safely ignore it.

${siteName}`;
}
