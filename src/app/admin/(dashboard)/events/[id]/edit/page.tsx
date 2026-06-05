import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/admin/event-form";
import { getSession, canManageEvents } from "@/lib/auth";
import { getEventRecordById } from "@/lib/queries";

interface AdminEditEventPageProps {
  params: { id: string };
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
  const session = await getSession();

  if (!session || !canManageEvents(session)) {
    redirect("/admin");
  }

  const event = await getEventRecordById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-8 font-heading text-3xl font-semibold">Edit Event</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm mode="edit" event={event} />
        </CardContent>
      </Card>
    </div>
  );
}
