"use client";

import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_SETTING_FIELDS,
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  type SettingsMap,
  type SettingsUpdater,
} from "@/lib/settings";

type BrandingUploadField = "logo" | "favicon";

interface SiteSettingsTabProps {
  settings: SettingsMap;
  setSettings: SettingsUpdater;
  uploadingField: BrandingUploadField | null;
  onBrandingUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: BrandingUploadField
  ) => void;
  logoInputRef: React.RefObject<HTMLInputElement>;
  faviconInputRef: React.RefObject<HTMLInputElement>;
}

export function SiteSettingsTab({
  settings,
  setSettings,
  uploadingField,
  onBrandingUpload,
  logoInputRef,
  faviconInputRef,
}: SiteSettingsTabProps) {
  const logoPath =
    settings[SETTING_KEYS.logoPath] || DEFAULT_SETTINGS[SETTING_KEYS.logoPath];
  const faviconPath =
    settings[SETTING_KEYS.faviconPath] ||
    DEFAULT_SETTINGS[SETTING_KEYS.faviconPath];

  return (
    <div className="admin-settings-tab-body">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Centre Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {ADMIN_SETTING_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor={field.key} className="text-gold">
                {field.label}
              </Label>
              <Input
                id={field.key}
                type={field.type}
                value={settings[field.key] || ""}
                onChange={(event) =>
                  setSettings({ ...settings, [field.key]: event.target.value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Branding</CardTitle>
        </CardHeader>
        <CardContent className="admin-branding-grid">
          <div className="admin-branding-item">
            <Label className="text-gold">Logo</Label>

            {logoPath && (
              <div className="admin-branding-preview admin-branding-preview-logo">
                <Image
                  src={logoPath}
                  alt="Centre logo preview"
                  fill
                  className="object-contain p-3"
                  sizes="192px"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="admin-branding-remove"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [SETTING_KEYS.logoPath]:
                        DEFAULT_SETTINGS[SETTING_KEYS.logoPath],
                    })
                  }
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10"
              disabled={uploadingField === "logo"}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingField === "logo" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Logo
            </Button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => onBrandingUpload(event, "logo")}
            />
          </div>

          <div className="admin-branding-item">
            <Label className="text-gold">Favicon</Label>

            {faviconPath && (
              <div className="admin-branding-preview admin-branding-preview-favicon">
                <Image
                  src={faviconPath}
                  alt="Favicon preview"
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="admin-branding-remove"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [SETTING_KEYS.faviconPath]:
                        DEFAULT_SETTINGS[SETTING_KEYS.faviconPath],
                    })
                  }
                  aria-label="Remove favicon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10"
              disabled={uploadingField === "favicon"}
              onClick={() => faviconInputRef.current?.click()}
            >
              {uploadingField === "favicon" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Favicon
            </Button>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,.ico"
              className="hidden"
              onChange={(event) => onBrandingUpload(event, "favicon")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
