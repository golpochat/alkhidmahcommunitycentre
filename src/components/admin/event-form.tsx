"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT } from "@/lib/constants";
import {
  ADMIN_EVENT_CATEGORY_OPTIONS,
  fromDatetimeLocalValue,
  nowIso,
  toDatetimeLocalValue,
  type SerializedEvent,
} from "@/lib/events";
import { eventFormSchema, type EventFormValues } from "@/lib/validations";

interface EventFormProps {
  event?: SerializedEvent;
  mode: "create" | "edit";
}

function createDefaultValues(event?: SerializedEvent): EventFormValues {
  const now = nowIso();

  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    category: (event?.category as EventFormValues["category"]) ?? "community",
    startAt: event?.startAt ?? now,
    endAt: event?.endAt ?? (event ? null : now),
    location: event?.location ?? CONTACT.address,
    imageUrl: event?.imageUrl ?? "",
  };
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: createDefaultValues(event),
  });

  const imageUrl = watch("imageUrl");
  const category = watch("category");
  const startAt = watch("startAt");
  const endAt = watch("endAt");

  async function onSubmit(values: EventFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        category: values.category || null,
        endAt: values.endAt || null,
        location: values.location || null,
        imageUrl: values.imageUrl || null,
      };

      const response = await fetch(
        mode === "create" ? "/api/events" : `/api/events/${event?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      toast.success(mode === "create" ? "Event created" : "Event updated");
      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category ?? "community"}
            onValueChange={(value) =>
              setValue("category", value as EventFormValues["category"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_EVENT_CATEGORY_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startAt">Start Date & Time</Label>
          <Input
            id="startAt"
            type="datetime-local"
            value={toDatetimeLocalValue(startAt)}
            onChange={(e) => setValue("startAt", fromDatetimeLocalValue(e.target.value))}
          />
          {errors.startAt && (
            <p className="text-sm text-destructive">{errors.startAt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endAt">End Date & Time (optional)</Label>
          <Input
            id="endAt"
            type="datetime-local"
            value={toDatetimeLocalValue(endAt)}
            onChange={(e) =>
              setValue(
                "endAt",
                e.target.value ? fromDatetimeLocalValue(e.target.value) : null
              )
            }
          />
          {errors.endAt && (
            <p className="text-sm text-destructive">{errors.endAt.message}</p>
          )}
        </div>
      </div>

      <ImageUpload
        value={imageUrl ?? ""}
        onChange={(url) => setValue("imageUrl", url)}
      />

      <div className="flex gap-3">
        <Button type="submit" className="btn-gold" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Event" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/events")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
