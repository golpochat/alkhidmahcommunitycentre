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
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PAYPAL_FEE_CONFIG,
  DEFAULT_STRIPE_FEE_CONFIG,
} from "@/lib/donation-processing-fee";
import { PASSWORD_MASK } from "@/lib/encryption";
import {
  PAYMENT_GATEWAY_PRESETS,
  type PaymentGatewayTypeId,
} from "@/lib/payment-gateway-presets";
import {
  paymentGatewaySchema,
  type PaymentGatewayFormValues,
} from "@/lib/validations";
import type { PaymentGatewayRecord } from "@/components/super-admin/settings/payment-settings-tab";

interface PaymentGatewayModalProps {
  open: boolean;
  mode: "create" | "edit";
  gateway: PaymentGatewayRecord | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PaymentGatewayFormValues) => Promise<void>;
}

const emptyValues: PaymentGatewayFormValues = {
  name: "",
  type: "STRIPE",
  isEnabled: true,
  currency: "EUR",
  publishableKey: "",
  secretKey: "",
  webhookSecret: "",
  clientId: "",
  clientSecret: "",
  paypalMode: "sandbox",
  accountName: "",
  bankName: "",
  iban: "",
  bic: "",
  referenceNote: "",
  feePercent: DEFAULT_STRIPE_FEE_CONFIG.feePercent,
  feeFixedCents: DEFAULT_STRIPE_FEE_CONFIG.feeFixedCents,
  allowCoverFee: DEFAULT_STRIPE_FEE_CONFIG.allowCoverFee,
};

export function PaymentGatewayModal({
  open,
  mode,
  gateway,
  saving,
  onOpenChange,
  onSubmit,
}: PaymentGatewayModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentGatewayFormValues>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: emptyValues,
  });

  const type = watch("type");
  const isEnabled = watch("isEnabled");
  const paypalMode = watch("paypalMode");
  const allowCoverFee = watch("allowCoverFee");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && gateway) {
      reset({
        name: gateway.name,
        type: gateway.type,
        isEnabled: gateway.isEnabled,
        currency: gateway.currency,
        publishableKey: gateway.publishableKey ?? "",
        secretKey: gateway.hasSecrets ? PASSWORD_MASK : "",
        webhookSecret: gateway.hasSecrets ? PASSWORD_MASK : "",
        clientId: gateway.paypalClientId ?? "",
        clientSecret: gateway.hasSecrets ? PASSWORD_MASK : "",
        paypalMode: gateway.paypalMode === "live" ? "live" : "sandbox",
        accountName: gateway.accountName ?? "",
        bankName: gateway.bankName ?? "",
        iban: gateway.iban ?? "",
        bic: gateway.bic ?? "",
        referenceNote: gateway.referenceNote ?? "",
        feePercent:
          gateway.feePercent ??
          (gateway.type === "PAYPAL"
            ? DEFAULT_PAYPAL_FEE_CONFIG.feePercent
            : DEFAULT_STRIPE_FEE_CONFIG.feePercent),
        feeFixedCents:
          gateway.feeFixedCents ??
          (gateway.type === "PAYPAL"
            ? DEFAULT_PAYPAL_FEE_CONFIG.feeFixedCents
            : DEFAULT_STRIPE_FEE_CONFIG.feeFixedCents),
        allowCoverFee:
          gateway.allowCoverFee ??
          (gateway.type === "PAYPAL"
            ? DEFAULT_PAYPAL_FEE_CONFIG.allowCoverFee
            : DEFAULT_STRIPE_FEE_CONFIG.allowCoverFee),
      });
      return;
    }

    reset({
      ...emptyValues,
      name: PAYMENT_GATEWAY_PRESETS[0]?.label ?? "Stripe",
      type: "STRIPE",
    });
  }, [open, mode, gateway, reset]);

  function handleTypeChange(nextType: PaymentGatewayTypeId) {
    const preset = PAYMENT_GATEWAY_PRESETS.find((item) => item.type === nextType);
    setValue("type", nextType);
    if (mode === "create" && preset) {
      setValue("name", preset.label);
    }
    const defaults =
      nextType === "PAYPAL" ? DEFAULT_PAYPAL_FEE_CONFIG : DEFAULT_STRIPE_FEE_CONFIG;
    if (nextType === "STRIPE" || nextType === "PAYPAL") {
      setValue("feePercent", defaults.feePercent);
      setValue("feeFixedCents", defaults.feeFixedCents);
      setValue("allowCoverFee", defaults.allowCoverFee);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="email-setting-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "create" ? "Add Payment Gateway" : "Edit Payment Gateway"}
          </DialogTitle>
        </DialogHeader>

        <form className="email-setting-form" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("type")} />

          <div className="space-y-2">
            <Label className="text-gold">
              Gateway type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={type}
              disabled={mode === "edit"}
              onValueChange={(value) => {
                if (value) handleTypeChange(value as PaymentGatewayTypeId);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_GATEWAY_PRESETS.map((preset) => (
                  <SelectItem key={preset.type} value={preset.type}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gateway-name" className="text-gold">
              Display name <span className="text-destructive">*</span>
            </Label>
            <Input id="gateway-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-gold">
              Currency <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currency"
              maxLength={3}
              {...register("currency")}
              placeholder="EUR"
            />
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency.message}</p>
            )}
          </div>

          {type === "STRIPE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="publishableKey" className="text-gold">
                  Publishable key <span className="text-destructive">*</span>
                </Label>
                <Input id="publishableKey" {...register("publishableKey")} />
                {errors.publishableKey && (
                  <p className="text-sm text-destructive">
                    {errors.publishableKey.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-gold">
                  Secret key{" "}
                  {mode === "create" && <span className="text-destructive">*</span>}
                </Label>
                <PasswordInput id="secretKey" {...register("secretKey")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret" className="text-gold">
                  Webhook secret{" "}
                  {mode === "create" && <span className="text-destructive">*</span>}
                </Label>
                <PasswordInput id="webhookSecret" {...register("webhookSecret")} />
              </div>
              <div className="email-setting-form-row">
                <div className="space-y-2">
                  <Label htmlFor="feePercent" className="text-gold">
                    Processing fee (%)
                  </Label>
                  <Input
                    id="feePercent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    {...register("feePercent", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeFixedCents" className="text-gold">
                    Fixed fee (cents)
                  </Label>
                  <Input
                    id="feeFixedCents"
                    type="number"
                    min={0}
                    step="1"
                    {...register("feeFixedCents", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <label className="email-setting-default-row">
                <Checkbox
                  checked={Boolean(allowCoverFee)}
                  onCheckedChange={(checked) =>
                    setValue("allowCoverFee", Boolean(checked))
                  }
                />
                <span>Let donors optionally cover processing fees on the donation page</span>
              </label>
            </>
          )}

          {type === "PAYPAL" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-gold">
                  Client ID <span className="text-destructive">*</span>
                </Label>
                <Input id="clientId" {...register("clientId")} />
                {errors.clientId && (
                  <p className="text-sm text-destructive">{errors.clientId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret" className="text-gold">
                  Client secret{" "}
                  {mode === "create" && <span className="text-destructive">*</span>}
                </Label>
                <PasswordInput id="clientSecret" {...register("clientSecret")} />
              </div>
              <div className="space-y-2">
                <Label className="text-gold">Mode</Label>
                <Select
                  value={paypalMode}
                  onValueChange={(value) => {
                    if (value) setValue("paypalMode", value as "sandbox" | "live");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="email-setting-form-row">
                <div className="space-y-2">
                  <Label htmlFor="paypal-feePercent" className="text-gold">
                    Processing fee (%)
                  </Label>
                  <Input
                    id="paypal-feePercent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    {...register("feePercent", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-feeFixedCents" className="text-gold">
                    Fixed fee (cents)
                  </Label>
                  <Input
                    id="paypal-feeFixedCents"
                    type="number"
                    min={0}
                    step="1"
                    {...register("feeFixedCents", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <label className="email-setting-default-row">
                <Checkbox
                  checked={Boolean(allowCoverFee)}
                  onCheckedChange={(checked) =>
                    setValue("allowCoverFee", Boolean(checked))
                  }
                />
                <span>Let donors optionally cover processing fees on the donation page</span>
              </label>
            </>
          )}

          {type === "BANK_TRANSFER" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-gold">
                  Account name <span className="text-destructive">*</span>
                </Label>
                <Input id="accountName" {...register("accountName")} />
                {errors.accountName && (
                  <p className="text-sm text-destructive">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-gold">
                  Bank name
                </Label>
                <Input id="bankName" {...register("bankName")} />
              </div>
              <div className="email-setting-form-row">
                <div className="space-y-2">
                  <Label htmlFor="iban" className="text-gold">
                    IBAN <span className="text-destructive">*</span>
                  </Label>
                  <Input id="iban" {...register("iban")} />
                  {errors.iban && (
                    <p className="text-sm text-destructive">{errors.iban.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bic" className="text-gold">
                    BIC / SWIFT
                  </Label>
                  <Input id="bic" {...register("bic")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNote" className="text-gold">
                  Payment reference note
                </Label>
                <Textarea
                  id="referenceNote"
                  rows={3}
                  {...register("referenceNote")}
                  placeholder="e.g. Include your name and donation category in the transfer reference"
                />
              </div>
            </>
          )}

          <label className="email-setting-default-row">
            <Checkbox
              checked={Boolean(isEnabled)}
              onCheckedChange={(checked) => setValue("isEnabled", Boolean(checked))}
            />
            <span>Enabled (shown on donation page)</span>
          </label>

          <DialogFooter className="email-setting-dialog-footer">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-gold" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Gateway" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
