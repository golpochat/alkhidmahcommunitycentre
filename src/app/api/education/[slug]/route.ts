import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { serializeClass } from "@/lib/classes";
import { logContentPublishAction } from "@/lib/content-audit-log";
import { classSchema, publishStatusSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const cls =
      (await db.class.findUnique({ where: { slug: params.slug } })) ??
      (await db.class.findUnique({ where: { id: params.slug } }));

    if (!cls) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    return NextResponse.json(serializeClass(cls));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch programme" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requirePermission(PERMISSIONS.education.manage);

    const body = await request.json();
    const validated = classSchema.parse(body);

    const duplicateSlug = await db.class.findFirst({
      where: { slug: validated.slug, NOT: { id: params.slug } },
    });
    if (duplicateSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const cls = await db.class.update({
      where: { id: params.slug },
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

    return NextResponse.json(serializeClass(cls));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await requirePermission(PERMISSIONS.education.manage);

    const existing = await db.class.findUnique({ where: { id: params.slug } });
    if (!existing) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    const body = await request.json();
    const { published } = publishStatusSchema.parse(body);

    const cls = await db.class.update({
      where: { id: params.slug },
      data: { published },
    });

    if (existing.published !== published) {
      await logContentPublishAction({
        entityType: "class",
        entityId: cls.id,
        entityTitle: cls.title,
        published,
        actorEmail: session.email,
      });
    }

    return NextResponse.json(serializeClass(cls));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requirePermission(PERMISSIONS.education.delete);

    await db.class.delete({ where: { id: params.slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
