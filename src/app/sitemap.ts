import type { MetadataRoute } from "next";
import { EDUCATION_PATH, SITE_URL } from "@/lib/constants";
import { getAllClasses, getAllEvents } from "@/lib/queries";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/education",
    "/events",
    "/gallery",
    "/donations",
    "/contact",
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "" ? 1 : 0.8,
  }));

  const events = await getAllEvents();
  const eventEntries = events.map((event) => ({
    url: `${SITE_URL}/events/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const classes = await getAllClasses();
  const educationEntries = classes.map((classItem) => ({
    url: `${SITE_URL}${EDUCATION_PATH}/${classItem.slug}`,
    lastModified: new Date(classItem.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...eventEntries, ...educationEntries];
}
