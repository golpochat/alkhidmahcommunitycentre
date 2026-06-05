"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettingsTab } from "@/components/super-admin/settings/email-settings-tab";
import { PaymentSettingsTab } from "@/components/super-admin/settings/payment-settings-tab";
import { SiteSettingsTab } from "@/components/super-admin/settings/site-settings-tab";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

type BrandingUploadField = "logo" | "favicon";

export function SuperAdminSettingsTabs() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("site");
  const [uploadingField, setUploadingField] = useState<BrandingUploadField | null>(
    null
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleBrandingUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    field: BrandingUploadField
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const settingKey =
      field === "logo" ? SETTING_KEYS.logoPath : SETTING_KEYS.faviconPath;
    const inputRef = field === "logo" ? logoInputRef : faviconInputRef;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", field);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setSettings((current) => ({ ...current, [settingKey]: data.url }));
      toast.success(field === "logo" ? "Logo uploaded" : "Favicon uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingField(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Save failed");
      }

      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="admin-settings-tabs"
      >
        <TabsList className="admin-settings-tabs-list">
          <TabsTrigger value="site">Site Settings</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="admin-settings-tab-content">
          <SiteSettingsTab
            settings={settings}
            setSettings={setSettings}
            uploadingField={uploadingField}
            onBrandingUpload={handleBrandingUpload}
            logoInputRef={logoInputRef}
            faviconInputRef={faviconInputRef}
          />
        </TabsContent>

        <TabsContent value="payment" className="admin-settings-tab-content">
          <PaymentSettingsTab />
        </TabsContent>

        <TabsContent value="email" className="admin-settings-tab-content">
          <EmailSettingsTab />
        </TabsContent>
      </Tabs>

      {activeTab === "site" && (
        <Button type="button" className="btn-gold" disabled={saving} onClick={handleSave}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      )}
    </div>
  );
}
