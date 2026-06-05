import { NextRequest, NextResponse } from "next/server";
import {
  requireSession,
  canManageSettings,
  canManageGallery,
  canManageEvents,
} from "@/lib/auth";
import { saveUploadedImage, type UploadFolder } from "@/lib/upload-image";

function errorStatus(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  return 400;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as UploadFolder) || "events";

    if (folder === "logo" && !canManageSettings(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (folder === "favicon" && !canManageSettings(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (folder === "gallery" && !canManageGallery(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (folder === "events" && !canManageEvents(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedFolder: UploadFolder =
      folder === "gallery"
        ? "gallery"
        : folder === "logo"
          ? "logo"
          : folder === "favicon"
            ? "favicon"
            : "events";

    const url = await saveUploadedImage(file, allowedFolder);

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: message },
      { status: errorStatus(message) }
    );
  }
}
