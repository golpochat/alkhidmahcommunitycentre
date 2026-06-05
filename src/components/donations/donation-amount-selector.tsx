"use client";

import { DONATION_PRESET_AMOUNTS } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DonationAmountSelectorProps {
  value: number;
  onChange: (amount: number) => void;
}

export function DonationAmountSelector({
  value,
  onChange,
}: DonationAmountSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Donation Amount (€)</Label>
      <div className="flex flex-wrap gap-2">
        {DONATION_PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(amount)}
            className={cn(
              "border-gold/30 transition-colors",
              value === amount
                ? "bg-gold text-mosque-black hover:bg-gold-light"
                : "hover:bg-gold/10 hover:text-gold"
            )}
          >
            €{amount}
          </Button>
        ))}
      </div>
      <Input
        type="number"
        min={1}
        step={1}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder="Custom amount"
      />
    </div>
  );
}
