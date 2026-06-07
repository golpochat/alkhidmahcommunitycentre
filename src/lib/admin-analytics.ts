import { db } from "@/lib/db";
import { ensureDisplaySettings } from "@/lib/display-settings";
import { startOfMonth, subDays, format, eachMonthOfInterval, subMonths } from "date-fns";

export interface DashboardStats {
  totalDonations: number;
  monthDonations: number;
  monthDonationTotal: number;
  allTimeDonationTotal: number;
  upcomingEvents: number;
  publishedUpcomingEvents: number;
  newRegistrations: number;
  galleryImages: number;
  publishedGalleryImages: number;
  pendingContactMessages: number;
  displayLastSeenAt: string | null;
  displayLastOrientation: string | null;
}

export interface DonationTrendPoint {
  month: string;
  amount: number;
  count: number;
}

export interface RegistrationByClassPoint {
  className: string;
  count: number;
}

export interface EventCategoryPoint {
  category: string;
  count: number;
}

export interface DonationCategoryPoint {
  category: string;
  amount: number;
  count: number;
}

export interface DonationProviderPoint {
  provider: string;
  amount: number;
  count: number;
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  donationTrend: DonationTrendPoint[];
  registrationsByClass: RegistrationByClassPoint[];
  eventsByCategory: EventCategoryPoint[];
  donationsByCategory: DonationCategoryPoint[];
  donationsByProvider: DonationProviderPoint[];
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);
  const sixMonthsAgo = subMonths(now, 5);

  const [
    totalDonations,
    monthDonations,
    succeededDonations,
    monthSucceededDonations,
    upcomingEvents,
    publishedUpcomingEvents,
    newRegistrations,
    galleryImages,
    publishedGalleryImages,
    pendingContactMessages,
    displaySettings,
    recentDonations,
    registrationsWithClass,
    events,
    donationsByCategoryRaw,
    donationsByProviderRaw,
  ] = await Promise.all([
    db.donation.count(),
    db.donation.count({ where: { createdAt: { gte: monthStart } } }),
    db.donation.findMany({ where: { status: "succeeded" }, select: { amount: true } }),
    db.donation.findMany({
      where: { status: "succeeded", createdAt: { gte: monthStart } },
      select: { amount: true },
    }),
    db.event.count({ where: { startAt: { gte: now } } }),
    db.event.count({ where: { startAt: { gte: now }, published: true } }),
    db.registration.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.galleryItem.count(),
    db.galleryItem.count({ where: { published: true, album: { published: true } } }),
    db.contactMessage.count({ where: { status: "pending" } }),
    ensureDisplaySettings(),
    db.donation.findMany({
      where: { status: "succeeded", createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    }),
    db.registration.groupBy({
      by: ["classId"],
      _count: { classId: true },
    }),
    db.event.findMany({ select: { category: true } }),
    db.donation.groupBy({
      by: ["category"],
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: { category: true },
    }),
    db.donation.groupBy({
      by: ["provider"],
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: { provider: true },
    }),
  ]);

  const months = eachMonthOfInterval({
    start: startOfMonth(sixMonthsAgo),
    end: startOfMonth(now),
  });

  const donationTrend = months.map((month) => {
    const monthKey = format(month, "yyyy-MM");
    const monthDonationsList = recentDonations.filter(
      (donation) => format(donation.createdAt, "yyyy-MM") === monthKey,
    );

    return {
      month: format(month, "MMM yyyy"),
      amount: monthDonationsList.reduce((sum, item) => sum + item.amount, 0),
      count: monthDonationsList.length,
    };
  });

  const classIds = registrationsWithClass.map((item) => item.classId);
  const classes = classIds.length
    ? await db.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, title: true },
      })
    : [];

  const classTitleMap = Object.fromEntries(classes.map((cls) => [cls.id, cls.title]));

  const registrationsByClass = registrationsWithClass
    .map((item) => ({
      className: classTitleMap[item.classId] || "Unknown",
      count: item._count.classId,
    }))
    .sort((a, b) => b.count - a.count);

  const categoryCounts = events.reduce<Record<string, number>>((acc, event) => {
    const key = event.category || "Uncategorised";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const eventsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    count,
  }));

  const donationsByCategory = donationsByCategoryRaw
    .map((item) => ({
      category: item.category.replace(/-/g, " "),
      amount: item._sum.amount ?? 0,
      count: item._count.category,
    }))
    .sort((a, b) => b.amount - a.amount);

  const donationsByProvider = donationsByProviderRaw
    .map((item) => ({
      provider: item.provider,
      amount: item._sum.amount ?? 0,
      count: item._count.provider,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    stats: {
      totalDonations,
      monthDonations,
      monthDonationTotal: monthSucceededDonations.reduce((sum, item) => sum + item.amount, 0),
      allTimeDonationTotal: succeededDonations.reduce((sum, item) => sum + item.amount, 0),
      upcomingEvents,
      publishedUpcomingEvents,
      newRegistrations,
      galleryImages,
      publishedGalleryImages,
      pendingContactMessages,
      displayLastSeenAt: displaySettings.lastSeenAt?.toISOString() ?? null,
      displayLastOrientation: displaySettings.lastOrientation ?? null,
    },
    donationTrend,
    registrationsByClass,
    eventsByCategory,
    donationsByCategory,
    donationsByProvider,
  };
}
