import { format, parseISO } from "date-fns";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { formatPrayerTime12h, getEidPrayerLabel, getEidPrayerTime, getEidTitle, getPrayerTimesForDate } from "@/lib/prayer-times";

export async function EidHomeBanner() {
  const schedule = await getPrayerTimesForDate();

  if (!schedule.eid.type) {
    return null;
  }

  return (
    <section className="eid-home-banner" aria-labelledby="eid-home-banner-title">
      <div className="eid-home-banner-inner">
        <div className="eid-home-banner-content">
          <Badge className="border-mosque-black/20 bg-mosque-black/10 text-mosque-black">
            Eid Mubarak
          </Badge>
          <h2 id="eid-home-banner-title" className="font-heading text-2xl font-semibold md:text-3xl">
            {getEidTitle(schedule.eid.type)}
          </h2>
          <p className="text-sm opacity-90">
            {format(parseISO(schedule.date), "EEEE, d MMMM yyyy")}
          </p>

          {schedule.eid.prayers.length > 0 ? (
            <div className="space-y-2">
              {schedule.eid.prayers.map((prayer) => (
                <div key={prayer.index} className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="font-medium">{getEidPrayerLabel(prayer.index)}</span>
                  <strong className="font-heading">
                    {formatPrayerTime12h(getEidPrayerTime(prayer))}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <ButtonLink href="/eid" variant="outline" className="border-mosque-black/30 bg-mosque-black/5 text-mosque-black hover:bg-mosque-black/10">
          View Eid Details
        </ButtonLink>
      </div>
    </section>
  );
}
