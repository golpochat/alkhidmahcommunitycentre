import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  canManageClasses,
  getFreshSession,
  requirePermission,
  PERMISSIONS,
} from "@/lib/auth";
import { serializeClass } from "@/lib/classes";
import { classSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getFreshSession();
    const canViewUnpublished = session ? canManageClasses(session) : false;

    const classes = await db.class.findMany({
      where: canViewUnpublished ? {} : { published: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(classes.map(serializeClass));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch education programmes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.education.manage);

    const body = await request.json();
    const validated = classSchema.parse(body);

    const existing = await db.class.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const cls = await db.class.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        description: validated.description,
        ageGroup: validated.ageGroup ?? null,
        schedule: validated.schedule ?? null,
        fee: validated.fee ?? null,
        teacher: validated.teacher ?? null,
        publishAt: validated.publishAt ? new Date(validated.publishAt) : null,
        unpublishAt: validated.unpublishAt ? new Date(validated.unpublishAt) : null,
      },
    });

    return NextResponse.json(serializeClass(cls), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
