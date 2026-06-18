import type { SessionUser } from "@/lib/auth";
import {
  canManageAboutPage,
  canManageClasses,
  canManageContactMessages,
  canManageDisplay,
  canManageDonations,
  canManageEvents,
  canManageGallery,
  canManagePrayerTimes,
  canManageRegistrations,
} from "@/lib/rbac";
import type { PublishStatusOverview } from "@/lib/admin-publish-status";

const PUBLISH_ROW_ACCESS: Record<string, (session: SessionUser) => boolean> = {
  events: canManageEvents,
  education: canManageClasses,
  gallery: canManageGallery,
  "donation-categories": canManageDonations,
  "monthly-timetable": canManagePrayerTimes,
};

export interface DashboardVisibility {
  showPublishSections: boolean;
  showDonationStats: boolean;
  showEventStats: boolean;
  showRegistrationStats: boolean;
  showGalleryStats: boolean;
  showDonationCharts: boolean;
  showRegistrationCharts: boolean;
  showEventCharts: boolean;
  showTvDisplayCard: boolean;
  showContactInboxCard: boolean;
  showPublishedContentCard: boolean;
  showRecentEvents: boolean;
  showRecentDonations: boolean;
  needsAnalytics: boolean;
  hasAnyContent: boolean;
}

export function getDashboardVisibility(session: SessionUser): DashboardVisibility {
  const showDonationStats = canManageDonations(session);
  const showEventStats = canManageEvents(session);
  const showRegistrationStats = canManageRegistrations(session);
  const showGalleryStats = canManageGallery(session);
  const showDonationCharts = showDonationStats;
  const showRegistrationCharts = showRegistrationStats;
  const showEventCharts = showEventStats;
  const showTvDisplayCard = canManageDisplay(session);
  const showContactInboxCard = canManageContactMessages(session);
  const showPublishedContentCard = showEventStats || showGalleryStats;
  const showRecentEvents = showEventStats;
  const showRecentDonations = showDonationStats;
  const showPublishSections = Object.values(PUBLISH_ROW_ACCESS).some((check) =>
    check(session),
  );

  const needsAnalytics =
    showDonationStats ||
    showEventStats ||
    showRegistrationStats ||
    showGalleryStats ||
    showContactInboxCard ||
    showPublishedContentCard ||
    showDonationCharts ||
    showRegistrationCharts ||
    showEventCharts ||
    showTvDisplayCard;

  const hasAnyContent =
    showPublishSections ||
    showDonationStats ||
    showEventStats ||
    showRegistrationStats ||
    showGalleryStats ||
    showDonationCharts ||
    showRegistrationCharts ||
    showEventCharts ||
    showTvDisplayCard ||
    showContactInboxCard ||
    showPublishedContentCard ||
    showRecentEvents ||
    showRecentDonations;

  return {
    showPublishSections,
    showDonationStats,
    showEventStats,
    showRegistrationStats,
    showGalleryStats,
    showDonationCharts,
    showRegistrationCharts,
    showEventCharts,
    showTvDisplayCard,
    showContactInboxCard,
    showPublishedContentCard,
    showRecentEvents,
    showRecentDonations,
    needsAnalytics,
    hasAnyContent,
  };
}

export function filterPublishOverviewForSession(
  overview: PublishStatusOverview,
  session: SessionUser,
): PublishStatusOverview {
  const rows = overview.rows.filter(
    (row) => PUBLISH_ROW_ACCESS[row.key]?.(session) ?? false,
  );
  const totalPublished = rows.reduce((sum, row) => sum + row.published, 0);
  const totalUnpublished = rows.reduce((sum, row) => sum + row.unpublished, 0);

  return {
    rows,
    totalPublished,
    totalUnpublished,
    hasUnpublishedContent: totalUnpublished > 0,
  };
}

export function getDashboardSubtitle(session: SessionUser): string {
  const topics: string[] = [];

  if (canManageDonations(session)) topics.push("donations");
  if (canManageEvents(session)) topics.push("events");
  if (canManageRegistrations(session)) topics.push("registrations");
  if (canManageGallery(session)) topics.push("gallery");
  if (canManageClasses(session)) topics.push("education");
  if (canManagePrayerTimes(session)) topics.push("prayer times");
  if (canManageDisplay(session)) topics.push("TV display");
  if (canManageContactMessages(session)) topics.push("contact messages");
  if (canManageAboutPage(session)) topics.push("about page");

  if (topics.length === 0) {
    return "Your admin overview.";
  }

  if (topics.length === 1) {
    return `Overview of ${topics[0]}.`;
  }

  const last = topics.pop();
  return `Overview of ${topics.join(", ")}, and ${last}.`;
}
