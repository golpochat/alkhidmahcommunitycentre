import { AccountTier } from "@prisma/client";
import { db } from "@/lib/db";
import { sendStaffInvitationEmail } from "@/lib/email";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";
import { isInvitableStaffRoleSlug } from "@/lib/rbac";
import {
  STAFF_INVITATION_TTL_MS,
  generateInvitationTokenValue,
  getInvitationAcceptUrl,
  hashInvitationToken,
} from "@/lib/staff-invitation-tokens";

export async function assertInvitableStaffRole(roleId: string) {
  const role = await db.accessRole.findUnique({ where: { id: roleId } });

  if (!role || role.slug === SUPER_ADMIN_ROLE_SLUG) {
    throw new Error("Invalid role");
  }

  if (role.tier !== AccountTier.STAFF) {
    throw new Error("Only staff roles can be invited from this page");
  }

  if (!isInvitableStaffRoleSlug(role.slug)) {
    throw new Error("This role cannot be invited");
  }

  return role;
}

export async function createStaffInvitation(data: {
  email: string;
  name?: string;
  roleId: string;
  invitedByEmail?: string | null;
}) {
  const email = data.email.trim().toLowerCase();
  const role = await assertInvitableStaffRole(data.roleId);

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const pending = await db.staffInvitation.findFirst({
    where: { email, status: "PENDING" },
  });

  if (pending) {
    throw new Error("An invitation is already pending for this email");
  }

  const token = generateInvitationTokenValue();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + STAFF_INVITATION_TTL_MS);

  const invitation = await db.staffInvitation.create({
    data: {
      email,
      name: data.name?.trim() || null,
      roleId: role.id,
      tokenHash,
      expiresAt,
      invitedByEmail: data.invitedByEmail ?? null,
    },
    include: {
      role: { select: { id: true, name: true, slug: true, tier: true } },
    },
  });

  const acceptUrl = getInvitationAcceptUrl(token);
  const emailed = await sendStaffInvitationEmail({
    email,
    name: invitation.name,
    roleName: role.name,
    acceptUrl,
  });

  if (!emailed) {
    await db.staffInvitation.delete({ where: { id: invitation.id } });
    throw new Error("Failed to send invitation email. Check email settings.");
  }

  return invitation;
}

export async function resendStaffInvitation(invitationId: string) {
  const invitation = await db.staffInvitation.findUnique({
    where: { id: invitationId },
    include: { role: { select: { name: true, slug: true, tier: true } } },
  });

  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("Invitation not found");
  }

  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
  });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const token = generateInvitationTokenValue();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + STAFF_INVITATION_TTL_MS);

  const updated = await db.staffInvitation.update({
    where: { id: invitation.id },
    data: { tokenHash, expiresAt },
    include: {
      role: { select: { id: true, name: true, slug: true, tier: true } },
    },
  });

  const acceptUrl = getInvitationAcceptUrl(token);
  const emailed = await sendStaffInvitationEmail({
    email: updated.email,
    name: updated.name,
    roleName: updated.role.name,
    acceptUrl,
  });

  if (!emailed) {
    throw new Error("Failed to send invitation email. Check email settings.");
  }

  return updated;
}

export async function cancelStaffInvitation(invitationId: string) {
  const invitation = await db.staffInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("Invitation not found");
  }

  await db.staffInvitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED" },
  });
}
