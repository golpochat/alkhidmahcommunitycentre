"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  acceptStaffInvitationSchema,
  type AcceptStaffInvitationFormValues,
} from "@/lib/validations";

interface InvitationPreview {
  email: string;
  name: string | null;
  roleName: string;
}

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AcceptStaffInvitationFormValues>({
    resolver: zodResolver(acceptStaffInvitationSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setValue("token", token);
  }, [token, setValue]);

  useEffect(() => {
    if (!token) {
      setLoadingPreview(false);
      setPreviewError("This invitation link is missing or invalid.");
      return;
    }

    async function loadPreview() {
      setLoadingPreview(true);
      try {
        const response = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
          if (data.expired) {
            setExpired(true);
          }
          throw new Error(data.error || "Invalid invitation");
        }

        setPreview({
          email: data.email,
          name: data.name,
          roleName: data.roleName,
        });
        setPreviewError(null);
        setExpired(false);
      } catch (error) {
        setPreview(null);
        setPreviewError(
          error instanceof Error ? error.message : "Invalid invitation"
        );
      } finally {
        setLoadingPreview(false);
      }
    }

    loadPreview();
  }, [token]);

  async function onSubmit(values: AcceptStaffInvitationFormValues) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Setup failed");
      }

      toast.success("Account activated. You can sign in now.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Setup failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || previewError) {
    return (
      <div className="auth-page-shell">
        <Card className="card-mosque w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">
              {expired ? "Invitation expired" : "Invalid link"}
            </CardTitle>
            <CardDescription>
              {previewError ||
                "This invitation link is missing or invalid."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login" className="text-gold hover:underline">
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingPreview || !preview) {
    return (
      <div className="auth-page-shell">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const displayName = preview.name?.trim() || preview.email.split("@")[0];

  return (
    <div className="auth-page-shell">
      <Card className="card-mosque w-full max-w-md">
        <CardHeader className="text-center">
          <div className="auth-page-icon">
            <UserPlus className="h-6 w-6 text-mosque-black" />
          </div>
          <CardTitle className="font-heading text-2xl">Complete setup</CardTitle>
          <CardDescription>
            Activate your {preview.roleName} account for {preview.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Verify your email</span>
              <p>Signing in as {preview.email}</p>
            </li>
            <li>
              <span className="font-medium text-foreground">2. Activate your account</span>
              <p>Welcome, {displayName}</p>
            </li>
            <li>
              <span className="font-medium text-foreground">3. Set your password</span>
              <p>Create a secure password below</p>
            </li>
          </ol>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("token")} value={token} />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="btn-gold w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
