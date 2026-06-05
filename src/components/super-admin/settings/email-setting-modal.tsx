"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSWORD_MASK } from "@/lib/encryption";
import {
  SMTP_ENCRYPTION_OPTIONS,
  SMTP_PORT_OPTIONS,
  SMTP_PROVIDER_PRESETS,
  findProviderPreset,
  type SmtpEncryptionType,
} from "@/lib/smtp-providers";
import {
  smtpEmailSettingSchema,
  type SmtpEmailSettingFormValues,
} from "@/lib/validations";

export interface EmailSettingRecord {
  id: string;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  encryption: SmtpEncryptionType;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
  hasPassword: boolean;
}

interface EmailSettingModalProps {
  open: boolean;
  mode: "create" | "edit";
  setting: EmailSettingRecord | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SmtpEmailSettingFormValues) => Promise<void>;
}

const emptyValues: SmtpEmailSettingFormValues = {
  provider: "Gmail",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  encryption: "TLS",
  smtpUsername: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  isDefault: false,
};

function isPresetPort(port: number) {
  return SMTP_PORT_OPTIONS.includes(String(port) as (typeof SMTP_PORT_OPTIONS)[number]);
}

export function EmailSettingModal({
  open,
  mode,
  setting,
  saving,
  onOpenChange,
  onSubmit,
}: EmailSettingModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SmtpEmailSettingFormValues>({
    resolver: zodResolver(smtpEmailSettingSchema),
    defaultValues: emptyValues,
  });

  const provider = watch("provider");
  const smtpPort = watch("smtpPort");
  const encryption = watch("encryption");
  const isDefault = watch("isDefault");
  const portIsCustom = !isPresetPort(smtpPort);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && setting) {
      reset({
        provider: setting.provider,
        smtpHost: setting.smtpHost,
        smtpPort: setting.smtpPort,
        encryption: setting.encryption,
        smtpUsername: setting.smtpUsername,
        smtpPassword: setting.hasPassword ? PASSWORD_MASK : "",
        fromEmail: setting.fromEmail,
        fromName: setting.fromName,
        isDefault: setting.isDefault,
      });
      return;
    }

    reset(emptyValues);
  }, [open, mode, setting, reset]);

  function applyProviderPreset(providerName: string) {
    const preset = findProviderPreset(providerName);
    if (!preset) {
      return;
    }

    setValue("provider", preset.label);
    if (preset.id !== "custom") {
      setValue("smtpHost", preset.smtpHost);
      setValue("smtpPort", preset.smtpPort);
      setValue("encryption", preset.encryption);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="email-setting-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "create" ? "Add Email Setting" : "Edit Email Setting"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="email-setting-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <input type="hidden" {...register("provider")} />
          <input type="hidden" {...register("encryption")} />

          <div className="space-y-2">
            <Label htmlFor="provider" className="text-gold">
              Provider name <span className="text-destructive">*</span>
            </Label>
            <Select
              value={provider}
              onValueChange={(value) => value && applyProviderPreset(value)}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {SMTP_PROVIDER_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.label}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider && (
              <p className="text-sm text-destructive">{errors.provider.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpHost" className="text-gold">
              SMTP host <span className="text-destructive">*</span>
            </Label>
            <Input
              id="smtpHost"
              {...register("smtpHost")}
              placeholder="smtp.sendgrid.net"
            />
            {errors.smtpHost && (
              <p className="text-sm text-destructive">{errors.smtpHost.message}</p>
            )}
          </div>

          <div className="email-setting-form-row">
            <div className="space-y-2">
              <Label htmlFor="smtpPort" className="text-gold">
                SMTP port <span className="text-destructive">*</span>
              </Label>
              <Select
                value={portIsCustom ? "custom" : String(smtpPort)}
                onValueChange={(value) => {
                  if (!value) return;
                  if (value === "custom") {
                    setValue("smtpPort", smtpPort || 587);
                    return;
                  }
                  setValue("smtpPort", Number(value));
                }}
              >
                <SelectTrigger id="smtpPort">
                  <SelectValue placeholder="Port" />
                </SelectTrigger>
                <SelectContent>
                  {SMTP_PORT_OPTIONS.map((port) => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {portIsCustom && (
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  value={smtpPort}
                  onChange={(event) =>
                    setValue("smtpPort", Number(event.target.value) || 587)
                  }
                />
              )}
              {errors.smtpPort && (
                <p className="text-sm text-destructive">{errors.smtpPort.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryption" className="text-gold">
                Encryption type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={encryption}
                onValueChange={(value) => {
                  if (!value) return;
                  setValue("encryption", value as SmtpEncryptionType);
                }}
              >
                <SelectTrigger id="encryption">
                  <SelectValue placeholder="Encryption" />
                </SelectTrigger>
                <SelectContent>
                  {SMTP_ENCRYPTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.encryption && (
                <p className="text-sm text-destructive">
                  {errors.encryption.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpUsername" className="text-gold">
              SMTP username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="smtpUsername"
              {...register("smtpUsername")}
              placeholder="username@example.com"
            />
            {errors.smtpUsername && (
              <p className="text-sm text-destructive">
                {errors.smtpUsername.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpPassword" className="text-gold">
              SMTP password{" "}
              {mode === "create" && <span className="text-destructive">*</span>}
            </Label>
            <PasswordInput
              id="smtpPassword"
              {...register("smtpPassword")}
              placeholder={
                mode === "edit" && setting?.hasPassword
                  ? PASSWORD_MASK
                  : "Enter password"
              }
            />
            {mode === "edit" && setting?.hasPassword && (
              <p className="text-xs text-muted-foreground">
                Leave unchanged to keep the current password.
              </p>
            )}
            {errors.smtpPassword && (
              <p className="text-sm text-destructive">
                {errors.smtpPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail" className="text-gold">
              From email <span className="text-destructive">*</span>
            </Label>
            <Input id="fromEmail" type="email" {...register("fromEmail")} />
            {errors.fromEmail && (
              <p className="text-sm text-destructive">{errors.fromEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName" className="text-gold">
              From name <span className="text-destructive">*</span>
            </Label>
            <Input id="fromName" {...register("fromName")} />
            {errors.fromName && (
              <p className="text-sm text-destructive">{errors.fromName.message}</p>
            )}
          </div>

          <label className="email-setting-default-row">
            <Checkbox
              checked={Boolean(isDefault)}
              onCheckedChange={(checked) => setValue("isDefault", Boolean(checked))}
            />
            <span>Set as default</span>
          </label>

          <DialogFooter className="email-setting-dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-gold" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Setting" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
