import { NextRequest, NextResponse } from "next/server";
import { AccountTier } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

import { requirePermission, PERMISSIONS, isProtectedSuperAdminAccount } from "@/lib/auth";

import { sendPasswordResetEmail } from "@/lib/email";

import {

  updateUserRoleSchema,

  userPasswordResetSchema,

  userStatusChangeSchema,

} from "@/lib/validations";

import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

import { loadSessionUserById } from "@/lib/access-control";

import { logUserAdminAction } from "@/lib/user-admin-log";



function generateTemporaryPassword() {

  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);

}



const userSelect = {

  id: true,

  email: true,

  name: true,

  roleId: true,

  isActive: true,

  role: {

    select: {

      id: true,

      slug: true,

      name: true,

      tier: true,

    },

  },

  createdAt: true,

  updatedAt: true,

} as const;



export async function PUT(

  request: NextRequest,

  { params }: { params: { id: string } }

) {

  try {

    const session = await requirePermission(PERMISSIONS.users.manage);



    const body = await request.json();

    const targetUser = await db.user.findUnique({

      where: { id: params.id },

      include: {

        role: {

          select: {

            id: true,

            slug: true,

            name: true,

            tier: true,

            permissions: {

              select: { permission: { select: { key: true } } },

            },

          },

        },

      },

    });



    if (!targetUser) {

      return NextResponse.json({ error: "User not found" }, { status: 404 });

    }



    const sessionUser = await loadSessionUserById(targetUser.id);

    const isProtected = sessionUser && isProtectedSuperAdminAccount(sessionUser);



    if (body.resetPassword) {

      const validated = userPasswordResetSchema.parse(body);

      const temporaryPassword = generateTemporaryPassword();

      const passwordHash = await bcrypt.hash(temporaryPassword, 12);



      await db.user.update({

        where: { id: params.id },

        data: { passwordHash },

      });



      await logUserAdminAction({

        userId: params.id,

        actorEmail: session.email,

        action: "PASSWORD_RESET",

        reason: validated.reason,

      });



      await sendPasswordResetEmail({

        email: targetUser.email,

        name: targetUser.name,

        temporaryPassword,

      });



      return NextResponse.json({ success: true, temporaryPassword });

    }



    if (body.isActive !== undefined) {

      if (isProtected) {

        return NextResponse.json(

          { error: "Super admin status cannot be changed" },

          { status: 400 }

        );

      }



      const validated = userStatusChangeSchema.parse(body);



      await db.user.update({

        where: { id: params.id },

        data: { isActive: validated.isActive },

      });



      await logUserAdminAction({

        userId: params.id,

        actorEmail: session.email,

        action: "STATUS_CHANGE",

        reason: validated.reason,

        details: validated.isActive ? "Activated" : "Deactivated",

      });



      const user = await db.user.findUnique({

        where: { id: params.id },

        select: userSelect,

      });



      return NextResponse.json(user);

    }



    if (isProtected) {

      return NextResponse.json(

        { error: "Super admin role cannot be changed" },

        { status: 400 }

      );

    }



    const validated = updateUserRoleSchema.parse(body);

    const role = await db.accessRole.findUnique({

      where: { id: validated.roleId },

    });



    if (!role) {

      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    }



    if (role.slug === SUPER_ADMIN_ROLE_SLUG) {

      return NextResponse.json(

        { error: "Super admin role cannot be assigned here" },

        { status: 400 }

      );

    }



    if (targetUser.role.tier === AccountTier.MEMBER) {

      return NextResponse.json(

        {

          error:

            "Member accounts are created via public signup only. Their role cannot be changed here.",

        },

        { status: 400 }

      );

    }



    if (role.tier !== AccountTier.STAFF) {

      return NextResponse.json(

        {

          error:

            "Only level 2 (staff) roles can be assigned. Member role is signup-only.",

        },

        { status: 400 }

      );

    }



    if (!role.isActive) {

      return NextResponse.json(

        { error: "Cannot assign an inactive role" },

        { status: 400 }

      );

    }



    const previousRoleName = targetUser.role.name;



    const user = await db.user.update({

      where: { id: params.id },

      data: { roleId: validated.roleId },

      select: userSelect,

    });



    if (targetUser.roleId !== validated.roleId) {

      await logUserAdminAction({

        userId: params.id,

        actorEmail: session.email,

        action: "ROLE_CHANGE",

        reason: "Role updated by administrator",

        details: `${previousRoleName} → ${role.name}`,

      });

    }



    return NextResponse.json(user);

  } catch (error) {

    const message = error instanceof Error ? error.message : "Update failed";

    const status =

      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;

    return NextResponse.json({ error: message }, { status });

  }

}


