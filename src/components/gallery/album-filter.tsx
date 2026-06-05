"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SerializedGalleryAlbum } from "@/lib/gallery";

interface AlbumFilterProps {
  albums: SerializedGalleryAlbum[];
  value: string;
  onChange: (value: string) => void;
}

export function AlbumFilter({ albums, value, onChange }: AlbumFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={value === "all" ? "default" : "outline"}
        size="sm"
        className={cn(
          value === "all"
            ? "btn-gold"
            : "border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
        )}
        onClick={() => onChange("all")}
      >
        All
      </Button>
      {albums.map((album) => (
        <Button
          key={album.id}
          type="button"
          variant={value === album.id ? "default" : "outline"}
          size="sm"
          className={cn(
            value === album.id
              ? "btn-gold"
              : "border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
          )}
          onClick={() => onChange(album.id)}
        >
          {album.name}
        </Button>
      ))}
    </div>
  );
}
