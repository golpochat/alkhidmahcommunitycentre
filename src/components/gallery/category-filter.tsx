"use client";

import { GALLERY_CATEGORIES } from "@/lib/gallery";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {GALLERY_CATEGORIES.map((category) => (
        <Button
          key={category.value}
          type="button"
          variant={value === category.value ? "default" : "outline"}
          size="sm"
          className={cn(
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
