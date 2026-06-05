import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getEvents<T>() {
  return readJsonFile<T[]>("events.json", []);
}

export async function saveEvents<T>(events: T[]) {
  await writeJsonFile("events.json", events);
}

export async function getGallery<T>() {
  return readJsonFile<T[]>("gallery.json", []);
}

export async function saveGallery<T>(gallery: T[]) {
  await writeJsonFile("gallery.json", gallery);
}

export async function getDonations<T>() {
  return readJsonFile<T[]>("donations.json", []);
}

export async function saveDonations<T>(donations: T[]) {
  await writeJsonFile("donations.json", donations);
}

export async function getPrayerTimesOverrides<T>() {
  return readJsonFile<T[]>("prayer-times.json", []);
}

export async function savePrayerTimesOverrides<T>(overrides: T[]) {
  await writeJsonFile("prayer-times.json", overrides);
}

export async function getClassRegistrations<T>() {
  return readJsonFile<T[]>("class-registrations.json", []);
}

export async function saveClassRegistrations<T>(registrations: T[]) {
  await writeJsonFile("class-registrations.json", registrations);
}

export async function getContactSubmissions<T>() {
  return readJsonFile<T[]>("contact-submissions.json", []);
}

export async function saveContactSubmissions<T>(submissions: T[]) {
  await writeJsonFile("contact-submissions.json", submissions);
}
