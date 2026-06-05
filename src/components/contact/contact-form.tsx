"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setSubmitting(true);
    setSubmitted(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSubmitted(true);
      toast.success("Message sent successfully!", {
        description: "We will get back to you as soon as possible.",
      });
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="card-mosque contact-form-card">
      <CardHeader>
        <CardTitle className="font-heading">Send a Message</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted && (
          <div className="contact-success-banner mb-6 flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium text-gold">Message sent</p>
              <p className="text-sm text-muted-foreground">
                Thank you for contacting us. We will reply as soon as possible.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="contact-form-label">
                Name
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Your name"
                aria-invalid={Boolean(errors.name)}
                className={cn("contact-form-input", errors.name && "contact-form-input-error")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="contact-form-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                className={cn("contact-form-input", errors.email && "contact-form-input-error")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="contact-form-label">
              Subject
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="How can we help?"
              aria-invalid={Boolean(errors.subject)}
              className={cn("contact-form-input", errors.subject && "contact-form-input-error")}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="contact-form-label">
              Message
            </Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder="Your message..."
              rows={6}
              aria-invalid={Boolean(errors.message)}
              className={cn("contact-form-input", errors.message && "contact-form-input-error")}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" className="btn-gold w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
