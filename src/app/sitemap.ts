import { EDUCATION_PATH } from "@/lib/constants";
import { getAllClasses, getAllEvents } from "@/lib/queries";
import { getSiteBranding } from "@/lib/site-branding";

export default async function sitemap(): Promise<import("next").MetadataRoute.Sitemap> {
  const branding = await getSiteBranding();
  const siteUrl = branding.siteUrl;

  const staticRoutes = [
    "",
    "/about",
    "/education",
    "/events",
    "/gallery",
    "/donations",
    "/contact",
    "/eid",
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "" ? 1 : 0.8,
  }));

  const events = await getAllEvents();
  const eventEntries = events.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const classes = await getAllClasses();
  const educationEntries = classes.map((classItem) => ({
    url: `${siteUrl}${EDUCATION_PATH}/${classItem.slug}`,
    lastModified: new Date(classItem.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...eventEntries, ...educationEntries];
}
