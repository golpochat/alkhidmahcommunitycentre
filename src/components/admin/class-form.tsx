"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify, type SerializedClass } from "@/lib/classes";
import { ADMIN_EDUCATION_PATH, EDUCATION_API_PATH } from "@/lib/constants";
import { classSchema, type ClassFormValues } from "@/lib/validations";

interface ClassFormProps {
  classItem?: SerializedClass;
  mode: "create" | "edit";
}

export function ClassForm({ classItem, mode }: ClassFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(classItem?.slug));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      title: classItem?.title ?? "",
      slug: classItem?.slug ?? "",
      description: classItem?.description ?? "",
      ageGroup: classItem?.ageGroup ?? "",
      schedule: classItem?.schedule ?? "",
      fee: classItem?.fee ?? null,
      teacher: classItem?.teacher ?? "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (!slugEdited && title) {
      setValue("slug", slugify(title));
    }
  }, [title, slugEdited, setValue]);

  async function onSubmit(values: ClassFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        ageGroup: values.ageGroup || null,
        schedule: values.schedule || null,
        fee: values.fee ?? null,
        teacher: values.teacher || null,
      };

      const url =
        mode === "create"
          ? EDUCATION_API_PATH
          : `${EDUCATION_API_PATH}/${classItem?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save class");
      }

      toast.success(mode === "create" ? "Class created" : "Class updated");
      router.push(ADMIN_EDUCATION_PATH);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save class");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...register("slug")}
            onChange={(event) => {
              setSlugEdited(true);
              register("slug").onChange(event);
            }}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ageGroup">Age Group (optional)</Label>
          <Input id="ageGroup" {...register("ageGroup")} placeholder="Ages 5–16" />
          {errors.ageGroup && (
            <p className="text-sm text-destructive">{errors.ageGroup.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacher">Teacher (optional)</Label>
          <Input id="teacher" {...register("teacher")} placeholder="Ustadh Ahmed" />
          {errors.teacher && (
            <p className="text-sm text-destructive">{errors.teacher.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule (optional)</Label>
          <Input id="schedule" {...register("schedule")} placeholder="Saturday 10:00–12:00" />
          {errors.schedule && (
            <p className="text-sm text-destructive">{errors.schedule.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee">Fee in EUR (optional, 0 for free)</Label>
          <Input
            id="fee"
            type="number"
            min={0}
            {...register("fee", {
              setValueAs: (value) =>
                value === "" || value == null ? null : Number(value),
            })}
          />
          {errors.fee && (
            <p className="text-sm text-destructive">{errors.fee.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="btn-gold" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Class" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(ADMIN_EDUCATION_PATH)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
