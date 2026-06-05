"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  changePasswordSchema,
  requestEmailChangeSchema,
  updateProfileNameSchema,
  type ChangePasswordFormValues,
  type RequestEmailChangeFormValues,
  type UpdateProfileNameFormValues,
} from "@/lib/validations";

interface ProfileData {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  roleLabel: string;
}

export function ProfileSettingsForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const nameForm = useForm<UpdateProfileNameFormValues>({
    resolver: zodResolver(updateProfileNameSchema),
    defaultValues: { name: "" },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<RequestEmailChangeFormValues>({
    resolver: zodResolver(requestEmailChangeSchema),
    defaultValues: { newEmail: "" },
  });

  useEffect(() => {
    fetch("/api/auth/profile")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        return response.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        nameForm.reset({ name: data.name || "" });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveName(values: UpdateProfileNameFormValues) {
    setSavingName(true);
    try {
      const response = await fetch("/api/auth/profile/name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      setProfile((current) =>
        current ? { ...current, name: data.user.name } : current
      );
      toast.success("Name updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  }

  async function onChangePassword(values: ChangePasswordFormValues) {
    setSavingPassword(true);
    try {
      const response = await fetch("/api/auth/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      passwordForm.reset();
      toast.success("Password changed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function onRequestEmailChange(values: RequestEmailChangeFormValues) {
    setSavingEmail(true);
    try {
      const response = await fetch("/api/auth/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request email change");
      }

      emailForm.reset();
      toast.success(data.message || "Verification link sent");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request email change"
      );
    } finally {
      setSavingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="profile-settings-grid">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Account Details</CardTitle>
          <CardDescription>Your current account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">{profile.roleLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Display Name</CardTitle>
          <CardDescription>Update the name shown in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={nameForm.handleSubmit(onSaveName)}
            className="profile-settings-form"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...nameForm.register("name")} />
              {nameForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {nameForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <Button type="submit" className="btn-gold" disabled={savingName}>
              {savingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Name
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Change Password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="profile-settings-form"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="btn-gold" disabled={savingPassword}>
              {savingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Change Email</CardTitle>
          <CardDescription>
            A verification link will be sent to your new email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={emailForm.handleSubmit(onRequestEmailChange)}
            className="profile-settings-form"
          >
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                {...emailForm.register("newEmail")}
                placeholder="you@example.com"
              />
              {emailForm.formState.errors.newEmail && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.newEmail.message}
                </p>
              )}
            </div>
            <Button type="submit" className="btn-gold" disabled={savingEmail}>
              {savingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
