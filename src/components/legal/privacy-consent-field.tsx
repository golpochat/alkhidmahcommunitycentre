"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PrivacyConsentFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  className?: string;
}

export function PrivacyConsentField({
  checked,
  onCheckedChange,
  error,
  className,
}: PrivacyConsentFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start gap-3">
        <Checkbox
          id="privacy-consent"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
          aria-invalid={Boolean(error)}
        />
        <Label htmlFor="privacy-consent" className="text-sm leading-6 text-muted-foreground">
          I agree to the{" "}
          <Link href="/legal/privacy-policy" className="text-gold underline-offset-4 hover:underline">
            Privacy Policy
          </Link>{" "}
          and understand how my personal data will be processed.
        </Label>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
