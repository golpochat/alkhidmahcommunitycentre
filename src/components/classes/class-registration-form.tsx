"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registrationSchema, type RegistrationFormValues } from "@/lib/validations";

interface ClassRegistrationFormProps {
  classId: string;
  classTitle: string;
  onSuccess?: () => void;
}

export function ClassRegistrationForm({
  classId,
  classTitle,
  onSuccess,
}: ClassRegistrationFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      classId,
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  async function onSubmit(values: RegistrationFormValues) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      toast.success(`Registration submitted for ${classTitle}`);
      reset({ classId, name: "", email: "", phone: "", notes: "" });
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("classId")} />

      <div className="space-y-2">
        <Label htmlFor={`name-${classId}`}>Full Name</Label>
        <Input id={`name-${classId}`} {...register("name")} placeholder="Your full name" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`email-${classId}`}>Email</Label>
        <Input
          id={`email-${classId}`}
          type="email"
          {...register("email")}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`phone-${classId}`}>Phone (optional)</Label>
        <Input id={`phone-${classId}`} {...register("phone")} placeholder="+353 ..." />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`notes-${classId}`}>Notes (optional)</Label>
        <Textarea
          id={`notes-${classId}`}
          rows={4}
          {...register("notes")}
          placeholder="Any additional information..."
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <Button type="submit" className="btn-gold w-full" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Registration
      </Button>
    </form>
  );
}
