import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AuthTokenType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  deleteAuthToken,
  findValidAuthToken,
} from "@/lib/auth-tokens";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const record = await findValidAuthToken(token, AuthTokenType.PASSWORD_RESET);

    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    await deleteAuthToken(record.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
