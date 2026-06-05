"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, GraduationCap, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { EDUCATION_PATH } from "@/lib/constants";
import { getClassImage } from "@/lib/images";
import { formatClassFee, type SerializedClass } from "@/lib/classes";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classItem: SerializedClass;
  onRegister?: (classItem: SerializedClass) => void;
  className?: string;
}

export function ClassCard({ classItem, onRegister, className }: ClassCardProps) {
  const imageSrc = getClassImage(classItem.slug);

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-border transition-all duration-200 hover:border-gold/40 hover:shadow-card-hover",
        className
      )}
    >
      <div className="image-frame-card relative aspect-[16/10] w-full overflow-hidden rounded-lg">
        <Image
          src={imageSrc}
          alt={classItem.title}
          fill
          className="object-cover brightness-105 transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Badge variant="outline" className="border-gold/30 text-gold">
            {formatClassFee(classItem.fee)}
          </Badge>
          {classItem.ageGroup && (
            <Badge variant="secondary" className="capitalize">
              {classItem.ageGroup}
            </Badge>
          )}
        </div>

        <Link href={`${EDUCATION_PATH}/${classItem.slug}`} className="group block">
          <h3 className="mb-3 font-heading text-xl font-semibold transition-colors group-hover:text-gold">
            {classItem.title}
          </h3>
        </Link>

        <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {classItem.description}
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          {classItem.schedule && (
            <p className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {classItem.schedule}
            </p>
          )}
          {classItem.teacher && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-gold" />
              {classItem.teacher}
            </p>
          )}
          <p className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-gold" />
            Qur&apos;an &amp; Islamic Studies
          </p>
        </div>
      </CardContent>

      <CardFooter className="gap-3 border-t border-border p-6 pt-0">
        <Button
          type="button"
          className="btn-gold flex-1"
          onClick={() => onRegister?.(classItem)}
        >
          Register
        </Button>
        <Link
          href={`${EDUCATION_PATH}/${classItem.slug}`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gold px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
        >
          Details
        </Link>
      </CardFooter>
    </Card>
  );
}
