import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
export type UploadFolder = "events" | "gallery" | "logo" | "favicon";

const FOLDER_ALLOWED_TYPES: Record<UploadFolder, string[]> = {
  events: ["image/jpeg", "image/png", "image/webp"],
  gallery: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  favicon: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
  ],
};

export async function saveUploadedImage(file: File, folder: UploadFolder) {
  const allowedTypes = FOLDER_ALLOWED_TYPES[folder];

  if (!allowedTypes) {
    throw new Error("Invalid upload folder");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("File type is not allowed for this upload");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File must be under 5MB");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}
