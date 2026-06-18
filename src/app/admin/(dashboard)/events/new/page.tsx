import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/admin/event-form";
import { getFreshSession, canManageEvents } from "@/lib/auth";

export default async function AdminNewEventPage() {
  const session = await getFreshSession();

  if (!session || !canManageEvents(session)) {
    redirect("/admin");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-8 font-heading text-3xl font-semibold">Create Event</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}

