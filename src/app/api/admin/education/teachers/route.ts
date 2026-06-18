import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getEducationPageContent,
  saveEducationPageContent,
  type EducationPageContent,
} from "@/lib/education-content";
import { requirePermission, PERMISSIONS } from "@/lib/auth";

const educationTeacherSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80),
  role: z.string().min(2).max(80),
  bio: z.string().max(500),
  imageUrl: z.string().max(500),
  published: z.boolean(),
});

const educationContentSchema = z.object({
  teachersVisible: z.boolean(),
  teachers: z.array(educationTeacherSchema).max(24),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.education.manage);
    const content = await getEducationPageContent();
    return NextResponse.json(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load education teachers";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.education.manage);

    const body = await request.json();
    const validated = educationContentSchema.parse(body) as EducationPageContent;
    await saveEducationPageContent(validated);

    const content = await getEducationPageContent();
    return NextResponse.json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
