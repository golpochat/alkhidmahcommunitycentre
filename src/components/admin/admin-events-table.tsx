"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerializedEvent } from "@/lib/events";

interface AdminEventsTableProps {
  events: SerializedEvent[];
  canDelete: boolean;
}

export function AdminEventsTable({ events, canDelete }: AdminEventsTableProps) {
  const [publishedById, setPublishedById] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setPublishedById(
      Object.fromEntries(events.map((event) => [event.id, event.published])),
    );
  }, [events]);

  async function handleDelete(id: string, title: string) {
    if (!canDelete) {
      toast.error("You do not have permission to delete events");
      return;
    }

    if (!confirm(`Delete "${title}"?`)) return;

    const response = await fetch(`/api/events/${id}`, { method: "DELETE" });

    if (response.ok) {
      toast.success("Event deleted");
      window.location.reload();
    } else {
      const data = await response.json();
      toast.error(data.error || "Failed to delete event");
    }
  }

  async function handlePublishedChange(id: string, published: boolean) {
    const previous = publishedById[id] ?? false;
    setPublishedById((current) => ({ ...current, [id]: published }));
    setUpdatingId(id);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update event status");
      }

      toast.success(published ? "Event published" : "Event unpublished");
    } catch (error) {
      setPublishedById((current) => ({ ...current, [id]: previous }));
      toast.error(
        error instanceof Error ? error.message : "Failed to update event status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Manage Events</h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, and publish community events.
          </p>
        </div>
        <ButtonLink href="/admin/events/new" className="btn-gold">
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </ButtonLink>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No events yet. Create your first event.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const published = publishedById[event.id] ?? event.published;

                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {event.category ? (
                        <Badge variant="outline" className="capitalize border-gold/30 text-gold">
                          {event.category}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(event.startAt), "d MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={published}
                          disabled={updatingId === event.id}
                          className="role-status-switch"
                          onCheckedChange={(checked) =>
                            handlePublishedChange(event.id, Boolean(checked))
                          }
                          aria-label={`${event.title} ${published ? "published" : "unpublished"}`}
                        />
                        <span
                          className={
                            published
                              ? "text-sm text-emerald"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {published ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gold transition-colors hover:bg-muted"
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(event.id, event.title)}
                            aria-label={`Delete ${event.title}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
