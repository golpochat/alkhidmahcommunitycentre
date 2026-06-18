"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  emptyPaymentQrSlots,
  RAMADAN_QR_MAX_SLOTS,
  type RamadanDonationCategoryOption,
  type RamadanPaymentQRItem,
} from "@/lib/ramadan-settings-types";

interface RamadanPaymentQRProps {
  categories: RamadanDonationCategoryOption[];
  items: RamadanPaymentQRItem[];
  onItemsChange: (items: RamadanPaymentQRItem[]) => void;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
}

const NONE_VALUE = "__none__";

function buildSlots(items: RamadanPaymentQRItem[]) {
  const base = emptyPaymentQrSlots(RAMADAN_QR_MAX_SLOTS);
  for (const item of items) {
    if (item.order >= 0 && item.order < RAMADAN_QR_MAX_SLOTS) {
      base[item.order] = { ...item, order: item.order };
    }
  }
  return base;
}

function resolveCategoryId(
  slot: RamadanPaymentQRItem,
  categories: RamadanDonationCategoryOption[],
) {
  if (!slot.url && !slot.category) return NONE_VALUE;

  const byUrl = categories.find((category) => category.donationUrl === slot.url);
  if (byUrl) return byUrl.id;

  const byName = categories.find((category) => category.name === slot.category);
  return byName?.id ?? NONE_VALUE;
}

function QrPreview({ url, cached }: { url: string; cached?: string | null }) {
  const [preview, setPreview] = useState(cached ?? "");

  useEffect(() => {
    if (cached) {
      setPreview(cached);
      return;
    }
    if (!url.trim()) {
      setPreview("");
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(url.trim(), { width: 160, margin: 1 })
      .then((dataUrl) => {
        if (!cancelled) setPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setPreview("");
      });

    return () => {
      cancelled = true;
    };
  }, [url, cached]);

  if (!preview) {
    return (
      <div className="ramadan-payment-qr-preview ramadan-payment-qr-preview--empty">
        Select a category to preview QR
      </div>
    );
  }

  return (
    <div className="ramadan-payment-qr-preview">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt="Payment QR code preview"
        className="ramadan-payment-qr-preview-image"
      />
    </div>
  );
}

export function RamadanPaymentQR({
  categories,
  items,
  onItemsChange,
  onSave,
  saving = false,
  disabled = false,
}: RamadanPaymentQRProps) {
  const slots = buildSlots(items);

  function updateSlot(index: number, patch: Partial<RamadanPaymentQRItem>) {
    const next = buildSlots(items);
    next[index] = { ...next[index], ...patch, order: index };
    onItemsChange(next);
  }

  function selectCategory(index: number, categoryId: string) {
    if (categoryId === NONE_VALUE) {
      updateSlot(index, {
        category: "",
        url: "",
        enabled: false,
        qrImage: null,
      });
      return;
    }

    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) return;

    updateSlot(index, {
      category: category.name,
      url: category.donationUrl,
      enabled: true,
      qrImage: null,
    });
  }

  return (
    <section className="ramadan-payment-qr-section mt-8 mb-8">
      <div className="ramadan-payment-qr-header">
        <h3 className="ramadan-payment-qr-title">Donation QR Codes</h3>
        <p className="ramadan-payment-qr-description">
          Choose up to {RAMADAN_QR_MAX_SLOTS} donation categories. The payment
          link and QR code are generated automatically.
        </p>
      </div>

      <div className="ramadan-payment-qr-grid">
        {slots.map((slot, index) => {
          const selectedId = resolveCategoryId(slot, categories);
          const selectedCategory = categories.find(
            (category) => category.id === selectedId,
          );

          return (
            <div key={`payment-qr-${index}`} className="ramadan-payment-qr-slot">
              <Label htmlFor={`payment-qr-category-${index}`}>
                QR {index + 1}
              </Label>
              <Select
                value={selectedId}
                disabled={disabled || categories.length === 0}
                onValueChange={(value) => {
                  if (value) selectCategory(index, value);
                }}
              >
                <SelectTrigger
                  id={`payment-qr-category-${index}`}
                  className="ramadan-payment-qr-select-trigger"
                >
                  <span>{selectedCategory?.name ?? "Select category"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QrPreview url={slot.url} cached={slot.qrImage} />
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        className="btn-gold"
        disabled={disabled || saving}
        onClick={onSave}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save
      </Button>
    </section>
  );
}

export { RAMADAN_QR_MAX_SLOTS };
