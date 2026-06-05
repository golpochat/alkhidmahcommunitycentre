import { NextResponse } from "next/server";
import { getSession, roleLabel } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: session.id,
      email: session.email,
      name: session.name,
      roleId: session.roleId,
      roleSlug: session.roleSlug,
      roleName: session.roleName,
      roleLabel: roleLabel(session),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

