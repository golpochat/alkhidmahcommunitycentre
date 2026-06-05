import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DonationCategoryCardProps {
  id: string;
  title: string;
  description: string;
  selected?: boolean;
  href?: string;
  onSelect?: (id: string) => void;
}

export function DonationCategoryCard({
  id,
  title,
  description,
  selected = false,
  href,
  onSelect,
}: DonationCategoryCardProps) {
  const card = (
    <Card
      className={cn(
        "h-full transition-all duration-200 hover:border-gold/50 hover:shadow-card-hover",
        selected ? "border-gold ring-2 ring-gold/30" : "border-border"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <Heart className="h-5 w-5 text-gold" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className="w-full text-left"
      aria-pressed={selected}
    >
      {card}
    </button>
  );
}
