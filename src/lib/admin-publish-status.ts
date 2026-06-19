import "server-only";

import { format } from "date-fns";
import { db } from "@/lib/db";
import { getMonthlyTimetablePublishState } from "@/lib/monthly-timetable";
import { getRamadanTimetableHomePublishState } from "@/lib/ramadan-timetable";

export interface PublishStatusRow {
  key: string;
  label: string;
  published: number;
  unpublished: number;
  adminHref: string;
  detail?: string;
}

export interface PublishStatusOverview {
  rows: PublishStatusRow[];
  totalPublished: number;
  totalUnpublished: number;
  hasUnpublishedContent: boolean;
}

export async function getPublishStatusOverview(): Promise<PublishStatusOverview> {
  const [
    eventsPublished,
    eventsUnpublished,
    classesPublished,
    classesUnpublished,
    albumsPublished,
    albumsUnpublished,
    categoriesPublished,
    categoriesUnpublished,
    publishedMonthly,
    publishedRamadan,
  ] = await Promise.all([
    db.event.count({ where: { published: true } }),
    db.event.count({ where: { published: false } }),
    db.class.count({ where: { published: true } }),
    db.class.count({ where: { published: false } }),
    db.galleryAlbum.count({ where: { published: true } }),
    db.galleryAlbum.count({ where: { published: false } }),
    db.donationCategory.count({ where: { isActive: true } }),
    db.donationCategory.count({ where: { isActive: false } }),
    getMonthlyTimetablePublishState(),
    getRamadanTimetableHomePublishState(),
  ]);

  const monthlyPublished = publishedMonthly.published ? 1 : 0;
  const monthlyUnpublished = publishedMonthly.published ? 0 : 1;
  const monthlyDetail = publishedMonthly.published && publishedMonthly.month && publishedMonthly.year
    ? format(
        new Date(publishedMonthly.year, publishedMonthly.month - 1, 1),
        "MMMM yyyy",
      )
    : "Not published on homepage";

  const ramadanPublished = publishedRamadan.published ? 1 : 0;
  const ramadanUnpublished = publishedRamadan.published ? 0 : 1;
  const ramadanDetail = publishedRamadan.published
    ? publishedRamadan.year
      ? `Ramadan ${publishedRamadan.year}`
      : "Active Ramadan timetable"
    : "Not published on homepage";

  const rows: PublishStatusRow[] = [
    {
      key: "events",
      label: "Events",
      published: eventsPublished,
      unpublished: eventsUnpublished,
      adminHref: "/admin/events",
    },
    {
      key: "education",
      label: "Education programmes",
      published: classesPublished,
      unpublished: classesUnpublished,
      adminHref: "/admin/education",
    },
    {
      key: "gallery",
      label: "Gallery albums",
      published: albumsPublished,
      unpublished: albumsUnpublished,
      adminHref: "/admin/gallery",
    },
    {
      key: "donation-categories",
      label: "Donation categories",
      published: categoriesPublished,
      unpublished: categoriesUnpublished,
      adminHref: "/admin/donations",
    },
    {
      key: "monthly-timetable",
      label: "Monthly timetable (homepage)",
      published: monthlyPublished,
      unpublished: monthlyUnpublished,
      adminHref: "/admin/special-prayers",
      detail: monthlyDetail,
    },
    {
      key: "ramadan-timetable",
      label: "Ramadan timetable (homepage)",
      published: ramadanPublished,
      unpublished: ramadanUnpublished,
      adminHref: "/admin/special-prayers",
      detail: ramadanDetail,
    },
  ];

  const totalPublished = rows.reduce((sum, row) => sum + row.published, 0);
  const totalUnpublished = rows.reduce((sum, row) => sum + row.unpublished, 0);

  return {
    rows,
    totalPublished,
    totalUnpublished,
    hasUnpublishedContent: totalUnpublished > 0,
  };
}
