import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AccountTier } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildSessionUserFromRecord,
  hasPermission,
} from "@/lib/session-access";
import { loadSessionUserById } from "@/lib/access-control";
import { getSessionUserFromDb } from "@/lib/session-user";
import { AUTH_COOKIE, JWT_SECRET } from "@/lib/auth-cookie";
import {
  canManageEvents,
  canWriteAdminContent,
  getHomeRouteForSession,
  hasPermission as checkPermission,
  INVITABLE_STAFF_ROLE_SLUGS,
  isEditorReadOnly,
  isProtectedSuperAdminAccount,
  isInvitableStaffRoleSlug,
  isMemberRoleSlug,
  roleLabel,
  PERMISSIONS,
  canAccessAdminRoutes,
  canAccessSuperAdminRoutes,
  canAccessUserRoutes,
  canDeleteClasses,
  canDeleteEvents,
  canDeleteGallery,
  canManageClasses,
  canManageDonations,
  canManageGallery,
  canManagePrayerTimes,
  canManageDisplay,
  canManageAboutPage,
  canManageLegalPolicies,
  canManageRegistrations,
  canManageContactMessages,
  canViewContentAudit,
  canManageSettings,
  canManageUsers,
} from "@/lib/rbac";

export { AUTH_COOKIE } from "@/lib/auth-cookie";
export {
  canAccessAdminRoutes,
  canAccessSuperAdminRoutes,
  canAccessUserRoutes,
  canDeleteClasses,
  canDeleteEvents,
  canDeleteGallery,
  canManageClasses,
  canManageContactMessages,
  canManageDonations,
  canManageEvents,
  canManageGallery,
  canManagePrayerTimes,
  canManageDisplay,
  canManageAboutPage,
  canManageLegalPolicies,
  canManageRegistrations,
  canManageSettings,
  canManageUsers,
  canViewContentAudit,
  canWriteAdminContent,
  getHomeRouteForSession,
  hasPermission,
  INVITABLE_STAFF_ROLE_SLUGS,
  isEditorReadOnly,
  isProtectedSuperAdminAccount,
  isInvitableStaffRoleSlug,
  isMemberRoleSlug,
  roleLabel,
  PERMISSIONS,
};

/** @deprecated Use canManageEvents */
export function canManageContent(session: SessionUser) {
  return canManageEvents(session);
}

/** @deprecated Use canWriteAdminContent */
export function canWriteAdmin(session: SessionUser) {
  return canWriteAdminContent(session);
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  roleId: string;
  roleSlug: string;
  roleName: string;
  tier: import("@/lib/account-tier").AccountTier;
  permissions: string[];
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerified: true,
        isActive: true,
        role: {
          select: {
            id: true,
            slug: true,
            name: true,
            tier: true,
            isActive: true,
            permissions: {
              select: {
                permission: { select: { key: true } },
              },
            },
          },
        },
      },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  if (!user.isActive || !user.role.isActive) {
    throw new Error("Account deactivated");
  }

  if (user.role.tier === AccountTier.MEMBER && !user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return buildSessionUserFromRecord(user);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    roleSlug: user.roleSlug,
    roleName: user.roleName,
    tier: user.tier,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (
      !payload.sub ||
      !payload.email ||
      !payload.roleId ||
      !payload.roleSlug ||
      !payload.tier
    ) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
      roleId: payload.roleId as string,
      roleSlug: payload.roleSlug as string,
      roleName: (payload.roleName as string) || "User",
      tier: payload.tier as SessionUser["tier"],
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

export async function getFreshSession(): Promise<SessionUser | null> {
  const cached = await getSession();
  if (!cached) {
    return null;
  }

  return getSessionUserFromDb(cached);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getFreshSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const session = await requireSession();
  if (!checkPermission(session, permission)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (!canAccessSuperAdminRoutes(session)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function applyRefreshedSession(
  response: NextResponse,
  user: SessionUser
) {
  const token = await createSession(user);
  setAuthCookie(response, token);
  return response;
}

export async function refreshSessionByUserId(userId: string) {
  return loadSessionUserById(userId);
}
