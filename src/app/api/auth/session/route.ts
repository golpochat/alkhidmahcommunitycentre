import { NextResponse } from "next/server";
import {
  canDeleteClasses,
  canDeleteEvents,
  canDeleteGallery,
  canManageClasses,
  canManageDonations,
  canManageEvents,
  canManageGallery,
  canManageSettings,
  canManageUsers,
  canWriteAdmin,
  getFreshSession,
  roleLabel,
} from "@/lib/auth";

export async function GET() {
  try {
    const session = await getFreshSession();

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
      tier: session.tier,
      permissions: session.permissions,
      canManageEvents: canManageEvents(session),
      canDeleteEvents: canDeleteEvents(session),
      canManageGallery: canManageGallery(session),
      canDeleteGallery: canDeleteGallery(session),
      canManageClasses: canManageClasses(session),
      canDeleteClasses: canDeleteClasses(session),
      canManageDonations: canManageDonations(session),
      canManageSettings: canManageSettings(session),
      canManageUsers: canManageUsers(session),
      canWriteAdmin: canWriteAdmin(session),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
