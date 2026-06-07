import "server-only";

import { db } from "@/lib/db";
import { logContentPublishAction } from "@/lib/content-audit-log";

export async function runScheduledPublish() {
  const now = new Date();

  const [publishedEvents, unpublishedEvents, publishedClasses, unpublishedClasses] =
    await Promise.all([
      db.event.findMany({
        where: { published: false, publishAt: { lte: now } },
        select: { id: true, title: true },
      }),
      db.event.findMany({
        where: { published: true, unpublishAt: { lte: now } },
        select: { id: true, title: true },
      }),
      db.class.findMany({
        where: { published: false, publishAt: { lte: now } },
        select: { id: true, title: true },
      }),
      db.class.findMany({
        where: { published: true, unpublishAt: { lte: now } },
        select: { id: true, title: true },
      }),
    ]);

  if (publishedEvents.length > 0) {
    await db.event.updateMany({
      where: { id: { in: publishedEvents.map((item) => item.id) } },
      data: { published: true },
    });

    await Promise.all(
      publishedEvents.map((item) =>
        logContentPublishAction({
          entityType: "event",
          entityId: item.id,
          entityTitle: item.title,
          published: true,
          actorEmail: "system@cron",
        }),
      ),
    );
  }

  if (unpublishedEvents.length > 0) {
    await db.event.updateMany({
      where: { id: { in: unpublishedEvents.map((item) => item.id) } },
      data: { published: false },
    });

    await Promise.all(
      unpublishedEvents.map((item) =>
        logContentPublishAction({
          entityType: "event",
          entityId: item.id,
          entityTitle: item.title,
          published: false,
          actorEmail: "system@cron",
        }),
      ),
    );
  }

  if (publishedClasses.length > 0) {
    await db.class.updateMany({
      where: { id: { in: publishedClasses.map((item) => item.id) } },
      data: { published: true },
    });

    await Promise.all(
      publishedClasses.map((item) =>
        logContentPublishAction({
          entityType: "class",
          entityId: item.id,
          entityTitle: item.title,
          published: true,
          actorEmail: "system@cron",
        }),
      ),
    );
  }

  if (unpublishedClasses.length > 0) {
    await db.class.updateMany({
      where: { id: { in: unpublishedClasses.map((item) => item.id) } },
      data: { published: false },
    });

    await Promise.all(
      unpublishedClasses.map((item) =>
        logContentPublishAction({
          entityType: "class",
          entityId: item.id,
          entityTitle: item.title,
          published: false,
          actorEmail: "system@cron",
        }),
      ),
    );
  }

  return {
    eventsPublished: publishedEvents.length,
    eventsUnpublished: unpublishedEvents.length,
    classesPublished: publishedClasses.length,
    classesUnpublished: unpublishedClasses.length,
  };
}
