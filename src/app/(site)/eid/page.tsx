import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";
import { PrayerTimesDisplay } from "@/components/prayer-times/prayer-times-display";
import {
  DEFAULT_EID_ADHA_TIMES,
  DEFAULT_EID_FITR_TIMES,
  eidSlotFromPrayerTime,
  getEidTitle,
  getLastEidPrayerTimes,
  getPrayerTimesForDate,
} from "@/lib/prayer-times";

export const dynamic = "force-dynamic";

const EID_NOTES = [
  {
    title: "Sunnah Reminders",
    body: "Perform ghusl, wear your best clothes, eat an odd number of dates before leaving for Eid-ul-Fitr, and walk to the masjid if possible.",
  },
  {
    title: "Parking",
    body: "Please use nearby street parking respectfully and allow extra time to arrive. Carpool where possible to reduce congestion.",
  },
  {
    title: "Women's Area",
    body: "A dedicated sisters' prayer area is available. Sisters are encouraged to arrive early for seating and facilities access.",
  },
  {
    title: "Takbeer",
    body: "Recite the takbeer after Fajr on the day of Eid until the imam begins the Eid prayer.",
  },
];

export default async function EidPage() {
  const today = await getPrayerTimesForDate();
  const isEidToday = Boolean(today.eid.type);
  const displaySchedule = isEidToday ? today : await getLastEidPrayerTimes();

  return (
    <div className="section-padding">
      <div className="section-container mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="heading-section mb-3">Eid Prayer Times</h1>
          <p className="text-muted-foreground">
            Salah times and guidance for Eid-ul-Fitr and Eid-ul-Adha at Al Khidmah
          </p>
        </div>

        {isEidToday ? (
          <>
            <EidPrayerBanner eid={today.eid} />

            <Card className="mt-8 border-gold/20">
              <CardHeader>
                <CardTitle className="font-heading">
                  {getEidTitle(today.eid.type)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(today.date), "EEEE, d MMMM yyyy")}
                </p>
              </CardHeader>
              <CardContent>
                <PrayerTimesDisplay
                  schedule={today}
                  showEidBanner={false}
                  showBadges={false}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="font-heading">No Eid Prayer Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                There is no Eid prayer scheduled for today. Please check back on Eid day
                or contact the masjid for the latest announcements.
              </p>

              {displaySchedule?.eid.type && (
                <div>
                  <h2 className="mb-4 font-heading text-lg font-semibold text-gold">
                    Last Recorded Eid Times
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {format(parseISO(displaySchedule.date), "EEEE, d MMMM yyyy")} —{" "}
                    {getEidTitle(displaySchedule.eid.type)}
                  </p>
                  <EidPrayerBanner eid={displaySchedule.eid} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Default Eid-ul-Fitr Times</CardTitle>
            </CardHeader>
            <CardContent>
              <EidPrayerBanner
                eid={{
                  type: "FITR",
                  prayers: DEFAULT_EID_FITR_TIMES.map((item) =>
                    eidSlotFromPrayerTime(item.index, item.iqama)
                  ),
                }}
                compact
              />
            </CardContent>
          </Card>
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Default Eid-ul-Adha Times</CardTitle>
            </CardHeader>
            <CardContent>
              <EidPrayerBanner
                eid={{
                  type: "ADHA",
                  prayers: DEFAULT_EID_ADHA_TIMES.map((item) =>
                    eidSlotFromPrayerTime(item.index, item.iqama)
                  ),
                }}
                compact
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {EID_NOTES.map((note) => (
            <Card key={note.title} className="border-border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{note.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
