import { redirect } from "next/navigation";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Calendar, ClipboardList, Heart, Image, Monitor, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import {
  AdminPublishChecklist,
  AdminPublishStatusOverview,
} from "@/components/admin/admin-publish-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  filterPublishOverviewForSession,
  getDashboardSubtitle,
  getDashboardVisibility,
} from "@/lib/admin-dashboard-access";
import { getPublishStatusOverview } from "@/lib/admin-publish-status";
import { getDashboardAnalytics } from "@/lib/admin-analytics";
import { getFreshSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDisplaySettings } from "@/lib/display-settings";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const emptyAnalytics = {
  stats: {
    totalDonations: 0,
    monthDonations: 0,
    monthDonationTotal: 0,
    allTimeDonationTotal: 0,
    upcomingEvents: 0,
    publishedUpcomingEvents: 0,
    newRegistrations: 0,
    galleryImages: 0,
    publishedGalleryImages: 0,
    pendingContactMessages: 0,
    displayLastSeenAt: null as string | null,
    displayLastOrientation: null as string | null,
  },
  donationTrend: [] as Awaited<ReturnType<typeof getDashboardAnalytics>>["donationTrend"],
  registrationsByClass: [] as Awaited<
    ReturnType<typeof getDashboardAnalytics>
  >["registrationsByClass"],
  eventsByCategory: [] as Awaited<
    ReturnType<typeof getDashboardAnalytics>
  >["eventsByCategory"],
  donationsByCategory: [] as Awaited<
    ReturnType<typeof getDashboardAnalytics>
  >["donationsByCategory"],
  donationsByProvider: [] as Awaited<
    ReturnType<typeof getDashboardAnalytics>
  >["donationsByProvider"],
};

export default async function AdminDashboardPage() {
  const session = await getFreshSession();

  if (!session) {
    redirect("/login");
  }

  const visibility = getDashboardVisibility(session);

  let analytics = emptyAnalytics;
  let recentEvents: { title: string; startAt: Date }[] = [];
  let recentDonations: {
    donorName: string | null;
    amount: number;
    category: string;
  }[] = [];
  let publishOverview = {
    rows: [],
    totalPublished: 0,
    totalUnpublished: 0,
    hasUnpublishedContent: false,
  } as Awaited<ReturnType<typeof getPublishStatusOverview>>;

  const needsFullAnalytics =
    visibility.showDonationStats ||
    visibility.showEventStats ||
    visibility.showRegistrationStats ||
    visibility.showGalleryStats ||
    visibility.showContactInboxCard ||
    visibility.showPublishedContentCard ||
    visibility.showDonationCharts ||
    visibility.showRegistrationCharts ||
    visibility.showEventCharts;

  try {
    if (process.env.DATABASE_URL) {
      if (visibility.showPublishSections) {
        publishOverview = filterPublishOverviewForSession(
          await getPublishStatusOverview(),
          session,
        );
      }

      if (needsFullAnalytics) {
        analytics = await getDashboardAnalytics();
      } else if (visibility.showTvDisplayCard) {
        const displaySettings = await ensureDisplaySettings();
        analytics = {
          ...emptyAnalytics,
          stats: {
            ...emptyAnalytics.stats,
            displayLastSeenAt: displaySettings.lastSeenAt?.toISOString() ?? null,
            displayLastOrientation: displaySettings.lastOrientation ?? null,
          },
        };
      }

      if (visibility.showRecentEvents) {
        recentEvents = await db.event.findMany({
          where: { startAt: { gte: new Date() } },
          take: 5,
          orderBy: { startAt: "asc" },
          select: { title: true, startAt: true },
        });
      }

      if (visibility.showRecentDonations) {
        recentDonations = await db.donation.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { donorName: true, amount: true, category: true },
        });
      }
    }
  } catch {
    // Database unavailable
  }

  const stats: Array<{
    title: string;
    value: number;
    sub: string;
    icon: LucideIcon;
    color: string;
  }> = [];

  if (visibility.showDonationStats) {
    stats.push(
      {
        title: "Donations (All Time)",
        value: analytics.stats.totalDonations,
        sub: `€${analytics.stats.allTimeDonationTotal.toLocaleString()} raised`,
        icon: Heart,
        color: "text-gold",
      },
      {
        title: "Donations (This Month)",
        value: analytics.stats.monthDonations,
        sub: `€${analytics.stats.monthDonationTotal.toLocaleString()} this month`,
        icon: Heart,
        color: "text-emerald",
      },
    );
  }

  if (visibility.showEventStats) {
    stats.push({
      title: "Upcoming Events",
      value: analytics.stats.upcomingEvents,
      sub: "Scheduled ahead",
      icon: Calendar,
      color: "text-gold",
    });
  }

  if (visibility.showRegistrationStats) {
    stats.push({
      title: "New Registrations",
      value: analytics.stats.newRegistrations,
      sub: "Last 30 days",
      icon: ClipboardList,
      color: "text-emerald",
    });
  }

  if (visibility.showGalleryStats) {
    stats.push({
      title: "Gallery Images",
      value: analytics.stats.galleryImages,
      sub: "Published photos",
      icon: Image,
      color: "text-gold",
    });
  }

  const showRecentSection = visibility.showRecentEvents || visibility.showRecentDonations;
  const insightCardCount =
    Number(visibility.showTvDisplayCard) +
    Number(visibility.showContactInboxCard) +
    Number(visibility.showPublishedContentCard);

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">
        {getDashboardSubtitle(session)}
      </p>

      {!visibility.hasAnyContent ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground">
              Use the sidebar to open the areas you manage.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {visibility.showPublishSections ? (
        <>
          <AdminPublishChecklist overview={publishOverview} />
          <AdminPublishStatusOverview overview={publishOverview} />
        </>
      ) : null}

      {stats.length > 0 ? (
        <div
          className={cn(
            "mb-8 grid gap-6 sm:grid-cols-2",
            stats.length >= 3 && "xl:grid-cols-3",
            stats.length >= 5 && "2xl:grid-cols-5",
          )}
        >
          {stats.map((stat) => (
            <Card key={stat.title} className="admin-stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <AdminDashboardCharts
        visibility={visibility}
        donationTrend={analytics.donationTrend}
        registrationsByClass={analytics.registrationsByClass}
        eventsByCategory={analytics.eventsByCategory}
        donationsByCategory={analytics.donationsByCategory}
        donationsByProvider={analytics.donationsByProvider}
      />

      {insightCardCount > 0 ? (
        <div
          className={cn(
            "mt-8 grid gap-6",
            insightCardCount === 1 && "lg:grid-cols-1",
            insightCardCount === 2 && "lg:grid-cols-2",
            insightCardCount >= 3 && "lg:grid-cols-3",
          )}
        >
          {visibility.showTvDisplayCard ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-gold" />
                  TV Display
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {analytics.stats.displayLastSeenAt
                    ? `Last active ${formatDistanceToNow(parseISO(analytics.stats.displayLastSeenAt), { addSuffix: true })}`
                    : "No heartbeat recorded yet"}
                </p>
                {analytics.stats.displayLastOrientation ? (
                  <p className="mt-2 text-sm capitalize">
                    Orientation: {analytics.stats.displayLastOrientation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {visibility.showContactInboxCard ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-emerald" />
                  Contact Inbox
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-bold">
                  {analytics.stats.pendingContactMessages}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Pending messages</p>
              </CardContent>
            </Card>
          ) : null}

          {visibility.showPublishedContentCard ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Published Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {visibility.showEventStats ? (
                  <p>
                    {analytics.stats.publishedUpcomingEvents} of{" "}
                    {analytics.stats.upcomingEvents} upcoming events published
                  </p>
                ) : null}
                {visibility.showGalleryStats ? (
                  <p>
                    {analytics.stats.publishedGalleryImages} of{" "}
                    {analytics.stats.galleryImages} gallery images published
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {showRecentSection ? (
        <div
          className={cn(
            "mt-8 grid gap-6",
            visibility.showRecentEvents && visibility.showRecentDonations
              ? "lg:grid-cols-2"
              : "lg:grid-cols-1",
          )}
        >
          {visibility.showRecentEvents ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <p className="text-muted-foreground">No upcoming events.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentEvents.map((event) => (
                      <li
                        key={`${event.title}-${event.startAt.toISOString()}`}
                        className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                      >
                        <span className="font-medium">{event.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(event.startAt, "d MMM yyyy")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          {visibility.showRecentDonations ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                {recentDonations.length === 0 ? (
                  <p className="text-muted-foreground">No donations recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentDonations.map((donation, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                      >
                        <div>
                          <span className="font-medium">
                            {donation.donorName || "Anonymous"}
                          </span>
                          <span className="ml-2 text-xs capitalize text-muted-foreground">
                            {donation.category.replace("-", " ")}
                          </span>
                        </div>
                        <span className="text-gold">€{donation.amount}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
