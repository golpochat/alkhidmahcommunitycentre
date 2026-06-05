"use client";

import { useEffect, useState } from "react";
import { Download, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { FLYER_THEME_LABELS, type FlyerTheme } from "@/lib/flyers/constants";

interface DonationCategoryOption {
  id: string;
  name: string;
  slug: string;
  donationUrl: string;
  description: string | null;
}

interface GeneratedFlyer {
  success?: boolean;
  url: string;
  imageUrl: string;
  filename: string;
  width: number;
  height: number;
  generatedAt: string;
  theme: FlyerTheme;
}

const THEMES: FlyerTheme[] = ["gold", "ramadan", "multi-category"];

export function FlyerGeneratorManager() {
  const [categories, setCategories] = useState<DonationCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [theme, setTheme] = useState<FlyerTheme>("gold");
  const [result, setResult] = useState<GeneratedFlyer | null>(null);

  const categoryRequired = theme !== "multi-category";

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/donation-categories");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load categories");
      }

      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      setCategoryId((current) =>
        current && list.some((item: DonationCategoryOption) => item.id === current)
          ? current
          : list[0]?.id ?? ""
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (categoryRequired && !categoryId) {
      toast.error("Please select a donation category");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/super-admin/flyers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          categoryId: categoryRequired ? categoryId : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flyer");
      }

      setResult(data);
      toast.success("Flyer generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate flyer");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const selectedCategory = categories.find((item) => item.id === categoryId);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Generate branded donation flyers with dynamic QR codes for print or digital
        sharing. Files are saved to{" "}
        <code className="text-sm text-gold">public/flyers/</code>.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Flyer Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as FlyerTheme)}
              >
                <SelectTrigger className="w-full">
                  <span>{FLYER_THEME_LABELS[theme]}</span>
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {FLYER_THEME_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categoryRequired && (
              <div className="space-y-2">
                <Label>Donation category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => setCategoryId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <span>{selectedCategory?.name ?? "Select category"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            {categoryRequired && selectedCategory && (
              <div className="space-y-1 rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
                <p className="break-all">
                  <span className="font-medium text-foreground">QR URL:</span>{" "}
                  {selectedCategory.donationUrl}
                </p>
                {selectedCategory.description && (
                  <p>
                    <span className="font-medium text-foreground">Description:</span>{" "}
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            )}
              </div>
            )}

            {theme === "multi-category" && (
              <p className="text-sm text-muted-foreground">
                All six active categories will be included in a 2×3 grid with individual
                QR codes.
              </p>
            )}

            <Button
              type="button"
              className="btn-gold w-full md:w-auto"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Generate flyer
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-3 text-sm font-medium text-gold">Preview</p>
            {!result ? (
              <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                Generate a flyer to see the preview here.
              </div>
            ) : (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${result.url || result.imageUrl}?t=${encodeURIComponent(result.generatedAt)}`}
                  alt={`Generated ${FLYER_THEME_LABELS[result.theme]} flyer`}
                  className="mx-auto max-h-[520px] w-full rounded-md border border-border object-contain"
                />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={result.url || result.imageUrl}
                    download={result.filename}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={generating}
                    onClick={handleGenerate}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  {result.filename} · {result.width}×{result.height}px
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
