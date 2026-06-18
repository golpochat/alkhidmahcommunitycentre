import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAboutPageContent,
  saveAboutPageContent,
  type AboutPageContent,
} from "@/lib/about-content";
import { requirePermission, PERMISSIONS } from "@/lib/auth";

const aboutValueSchema = z.object({
  id: z.string().min(1),
  icon: z.enum(["book", "heart", "users", "award"]),
  title: z.string().min(2).max(80),
  description: z.string().min(10).max(500),
});

const aboutCommitteeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80),
  role: z.string().min(2).max(80),
  bio: z.string().max(500),
  imageUrl: z.string().max(500),
  published: z.boolean(),
});

const aboutContentSchema = z.object({
  valuesVisible: z.boolean(),
  committeeVisible: z.boolean(),
  values: z.array(aboutValueSchema).min(1).max(12),
  committee: z.array(aboutCommitteeSchema).max(24),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.about.manage);
    const content = await getAboutPageContent();
    return NextResponse.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load about content";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.about.manage);

    const body = await request.json();
    const validated = aboutContentSchema.parse(body) as AboutPageContent;
    await saveAboutPageContent(validated);

    const content = await getAboutPageContent();
    return NextResponse.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
