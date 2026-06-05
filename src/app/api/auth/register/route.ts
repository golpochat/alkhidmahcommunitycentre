import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createSession,
  getHomeRouteForSession,
  setAuthCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { getRoleIdBySlug } from "@/lib/seed-rbac";
import { MEMBER_ROLE_SLUG } from "@/lib/rbac-seed";
import { buildSessionUserFromRecord } from "@/lib/session-access";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existing = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const memberRoleId = await getRoleIdBySlug(db, MEMBER_ROLE_SLUG);
    const passwordHash = await bcrypt.hash(validated.password, 12);
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        passwordHash,
        roleId: memberRoleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            slug: true,
            name: true,
            tier: true,
            permissions: {
              select: {
                permission: { select: { key: true } },
              },
            },
          },
        },
      },
    });

    const sessionUser = await buildSessionUserFromRecord(user);
    const token = await createSession(sessionUser);
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        roleSlug: sessionUser.roleSlug,
        roleName: sessionUser.roleName,
        name: user.name,
      },
      redirect: getHomeRouteForSession(sessionUser),
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
