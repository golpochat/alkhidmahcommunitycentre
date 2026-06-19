import { format } from "date-fns";
import type { Donation } from "@prisma/client";
import { getCategoryLabel } from "@/lib/donations";
import {
  formatDonationMoney,
  getDonationTotalCents,
  normalizeDonationCurrency,
} from "@/lib/donation-processing-fee";
import { generateDonationReceiptPdf } from "@/lib/generate-donation-receipt";
import { getDonationStatementBranding } from "@/lib/donation-statement-branding";
import { getSiteBranding } from "@/lib/site-branding";
import {
  getNotificationEmail,
  sendEmail,
  type EmailSendResult,
} from "@/lib/email-service";

export type { EmailSendResult } from "@/lib/email-service";

async function brandedSiteName() {
  const branding = await getSiteBranding();
  return branding.siteName;
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const notificationEmail = await getNotificationEmail();

  if (!notificationEmail) {
    console.warn("Email not configured — contact message stored in database only.");
    return false;
  }

  const result = await sendEmail({
    to: notificationEmail,
    replyTo: data.email,
    subject: `[Contact] ${data.subject}`,
    text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p>${data.message.replace(/\n/g, "<br>")}</p>
    `,
  });

  return result !== "failed";
}

export async function sendContactAutoReply(data: {
  name: string;
  email: string;
  subject: string;
}) {
  const siteName = await brandedSiteName();
  const result = await sendEmail({
    to: data.email,
    subject: `We received your message — ${data.subject}`,
    html: `
      <h2>Thank you for contacting us</h2>
      <p>Dear ${data.name},</p>
      <p>We have received your message regarding <strong>${data.subject}</strong>.</p>
      <p>Our team will review your enquiry and respond as soon as possible.</p>
      <p>JazakAllah khair,<br>${siteName}</p>
    `,
  });

  return result !== "failed";
}

export async function sendDonationReceipt(donation: Donation) {
  const branding = await getDonationStatementBranding();
  const { buffer, filename } = await generateDonationReceiptPdf(donation);
  const receiptUrl = `${branding.website}/api/donations/${donation.id}/receipt`;
  const siteName = branding.siteName;

  const donorLabel = donation.donorName || "Supporter";
  const categoryLabel = getCategoryLabel(donation.category);
  const formattedDate = format(donation.createdAt, "d MMMM yyyy HH:mm");
  const transactionId = donation.providerId || "—";
  const currency = normalizeDonationCurrency(donation.currency);
  const formattedAmount = formatDonationMoney(donation.amount, currency);

  const htmlBody = `
      <h2>Thank you for your donation</h2>
      <p>Dear ${donorLabel},</p>
      <p>We have received your donation to ${siteName}.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #ddd">${formattedAmount}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Category</strong></td><td style="padding:8px;border:1px solid #ddd">${categoryLabel}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${formattedDate}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Provider</strong></td><td style="padding:8px;border:1px solid #ddd">${donation.provider}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Transaction ID</strong></td><td style="padding:8px;border:1px solid #ddd">${transactionId}</td></tr>
      </table>
      <p>Your PDF receipt is attached. You can also <a href="${receiptUrl}">download your receipt here</a>.</p>
      <p>JazakAllah khair for your generosity.</p>
      <p>${siteName}<br>Registered charity: ${branding.charityNumber}</p>
    `;

  if (!donation.donorEmail) {
    console.warn(
      `Donation ${donation.id} succeeded without email — receipt PDF generated but not emailed.`
    );
    return false;
  }

  const result = await sendEmail({
    to: donation.donorEmail,
    subject: `Donation Receipt — ${categoryLabel}`,
    html: htmlBody,
    text: `Thank you for your donation to ${siteName}. Amount: ${formattedAmount}. Download receipt: ${receiptUrl}`,
    attachments: [
      {
        filename,
        content: buffer,
        contentType: "application/pdf",
      },
    ],
  });

  return result !== "failed";
}

export async function sendDonationAdminNotification(donation: Donation) {
  const notificationEmail = await getNotificationEmail();

  if (!notificationEmail) {
    console.warn("Email not configured — donation stored without staff notification.");
    return false;
  }

  const categoryLabel = getCategoryLabel(donation.category);
  const donorLabel = donation.donorName || "Anonymous";
  const donorEmail = donation.donorEmail || "Not provided";
  const formattedDate = format(donation.createdAt, "d MMMM yyyy HH:mm");
  const transactionId = donation.providerId || "—";
  const totalEuros = getDonationTotalCents(donation) / 100;
  const currency = normalizeDonationCurrency(donation.currency);
  const formattedAmount = formatDonationMoney(totalEuros, currency);

  const result = await sendEmail({
    to: notificationEmail,
    replyTo: donation.donorEmail || undefined,
    subject: `[Donation] ${categoryLabel} — ${formattedAmount}`,
    text: `Donor: ${donorLabel}\nEmail: ${donorEmail}\nAmount: ${formattedAmount}\nCategory: ${categoryLabel}\nProvider: ${donation.provider}\nDate: ${formattedDate}\nTransaction ID: ${transactionId}`,
    html: `
      <h2>New Donation Received</h2>
      <p><strong>Donor:</strong> ${donorLabel}</p>
      <p><strong>Email:</strong> ${donorEmail}</p>
      <p><strong>Amount:</strong> ${formattedAmount}</p>
      <p><strong>Category:</strong> ${categoryLabel}</p>
      <p><strong>Provider:</strong> ${donation.provider}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
    `,
  });

  return result !== "failed";
}

export async function sendRegistrationConfirmation(data: {
  name: string;
  email: string;
  classTitle: string;
  classSchedule?: string | null;
}) {
  const siteName = await brandedSiteName();
  const result = await sendEmail({
    to: data.email,
    subject: "Class Registration Confirmation",
    html: `
      <h2>Registration Confirmed</h2>
      <p>Dear ${data.name},</p>
      <p>Thank you for registering for <strong>${data.classTitle}</strong>.</p>
      ${data.classSchedule ? `<p><strong>Schedule:</strong> ${data.classSchedule}</p>` : ""}
      <p>We will contact you shortly with further class details.</p>
      <p>JazakAllah khair,<br>${siteName}</p>
    `,
  });

  return result !== "failed";
}

export async function sendRegistrationAdminNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  classTitle: string;
}) {
  const notificationEmail = await getNotificationEmail();

  if (!notificationEmail) {
    console.warn("Email not configured — registration stored in database only.");
    return false;
  }

  const result = await sendEmail({
    to: notificationEmail,
    replyTo: data.email,
    subject: `[Class Registration] ${data.classTitle}`,
    text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || "N/A"}\nClass: ${data.classTitle}\nNotes: ${data.notes || "N/A"}`,
    html: `
      <h2>New Class Registration</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
      <p><strong>Class:</strong> ${data.classTitle}</p>
      <p><strong>Notes:</strong> ${data.notes || "N/A"}</p>
    `,
  });

  return result !== "failed";
}

export async function sendStaffInvitationEmail(data: {
  email: string;
  name?: string | null;
  roleName: string;
  acceptUrl: string;
}) {
  const {
    buildStaffInvitationEmailHtml,
    buildStaffInvitationEmailText,
  } = await import("@/lib/staff-invitation-email");
  const { getDonationStatementBranding } = await import(
    "@/lib/donation-statement-branding"
  );
  const { getEmailLogoUrl } = await import("@/lib/email-brand");

  const branding = await getDonationStatementBranding();
  const recipientName = data.name?.trim() || data.email.split("@")[0] || "there";
  const logoUrl = getEmailLogoUrl(branding.website, branding.logoPath);

  const result = await sendEmail({
    to: data.email,
    subject: `${branding.siteName} – Staff invitation (${data.roleName})`,
    html: buildStaffInvitationEmailHtml({
      recipientName,
      roleName: data.roleName,
      acceptUrl: data.acceptUrl,
      siteName: branding.siteName,
      website: branding.website,
      logoUrl,
    }),
    text: buildStaffInvitationEmailText({
      recipientName,
      roleName: data.roleName,
      acceptUrl: data.acceptUrl,
      siteName: branding.siteName,
    }),
  });

  return result !== "failed";
}

export async function sendPasswordResetEmail(data: {
  email: string;
  name?: string | null;
  temporaryPassword: string;
}) {
  const siteName = await brandedSiteName();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const result = await sendEmail({
    to: data.email,
    subject: `Password Reset — ${siteName}`,
    html: `
      <h2>Password Reset</h2>
      <p>Dear ${data.name || "Admin"},</p>
      <p>Your admin password has been reset.</p>
      <p><strong>Login URL:</strong> <a href="${siteUrl}/login">${siteUrl}/login</a></p>
      <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
      <p>Please sign in and change your password after logging in.</p>
      <p>${siteName}</p>
    `,
  });

  return result !== "failed";
}

export async function sendPasswordResetLinkEmail(data: {
  email: string;
  name?: string | null;
  resetUrl: string;
}) {
  const siteName = await brandedSiteName();
  const result = await sendEmail({
    to: data.email,
    subject: `Reset Your Password — ${siteName}`,
    html: `
      <h2>Reset Your Password</h2>
      <p>Dear ${data.name || "User"},</p>
      <p>We received a request to reset your password for ${siteName}.</p>
      <p><a href="${data.resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      <p>${siteName}</p>
    `,
  });

  return result !== "failed";
}

export async function sendEmailChangeVerificationEmail(data: {
  email: string;
  name?: string | null;
  verifyUrl: string;
}): Promise<EmailSendResult> {
  const siteName = await brandedSiteName();
  return sendEmail({
    to: data.email,
    subject: `Confirm Your New Email — ${siteName}`,
    html: `
      <h2>Confirm Email Change</h2>
      <p>Dear ${data.name || "User"},</p>
      <p>Please confirm that you want to use this email address for your ${siteName} account.</p>
      <p><a href="${data.verifyUrl}">Click here to confirm your new email</a></p>
      <p>This link expires in 24 hours. If you did not request this change, you can ignore this email.</p>
      <p>${siteName}</p>
    `,
  });
}

export async function sendRegistrationVerificationEmail(data: {
  email: string;
  name?: string | null;
  verifyUrl: string;
}): Promise<EmailSendResult> {
  const siteName = await brandedSiteName();
  return sendEmail({
    to: data.email,
    subject: `Verify Your Email — ${siteName}`,
    html: `
      <h2>Welcome to ${siteName}</h2>
      <p>Dear ${data.name || "Member"},</p>
      <p>Thank you for creating a member account. Please verify your email address to sign in and access your portal.</p>
      <p><a href="${data.verifyUrl}">Click here to verify your email</a></p>
      <p>This link expires in 48 hours. If you did not create this account, you can ignore this email.</p>
      <p>${siteName}</p>
    `,
  });
}
