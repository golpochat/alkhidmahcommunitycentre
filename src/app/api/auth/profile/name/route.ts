import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFreshSession, applyRefreshedSession } from "@/lib/auth";
import { buildSessionUserFromRecord } from "@/lib/session-access";
import { userSessionSelect } from "@/lib/user-session-select";
import { updateProfileNameSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getFreshSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = updateProfileNameSchema.parse(body);

    const user = await db.user.update({
      where: { id: session.id },
      data: { name },
      select: userSessionSelect,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
      },
    });

    return applyRefreshedSession(response, buildSessionUserFromRecord(user));  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
