"use client";

import { EVENT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventFilters({ value, onChange }: EventFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EVENT_CATEGORIES.map((category) => (
        <Button
          key={category.value}
          type="button"
          variant={value === category.value ? "default" : "outline"}
          className={cn(
            "capitalize",
            value === category.value
              ? "btn-gold"
              : "border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
          )}
          onClick={() => onChange(category.value)}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}
