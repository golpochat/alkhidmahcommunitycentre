import { NextRequest, NextResponse } from "next/server";
import { AuthTokenType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  deleteAuthToken,
  findValidAuthToken,
} from "@/lib/auth-tokens";
import { getFreshSession, applyRefreshedSession } from "@/lib/auth";
import { buildSessionUserFromRecord } from "@/lib/session-access";
import { userSessionSelect } from "@/lib/user-session-select";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const record = await findValidAuthToken(token, AuthTokenType.EMAIL_CHANGE);

    if (!record || !record.newEmail) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: record.newEmail },
    });

    if (existing && existing.id !== record.userId) {
      await deleteAuthToken(record.id);
      return NextResponse.json(
        { error: "That email address is already in use" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: record.userId },
      data: { email: record.newEmail },
      select: userSessionSelect,
    });

    await deleteAuthToken(record.id);

    const session = await getFreshSession();
    const isCurrentUser = session?.id === user.id;

    if (isCurrentUser) {
      const response = NextResponse.json({
        success: true,
        email: user.email,
        refreshed: true,
      });
      return applyRefreshedSession(response, buildSessionUserFromRecord(user));
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      refreshed: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
