"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmailSettingModal,
  type EmailSettingRecord,
} from "@/components/super-admin/settings/email-setting-modal";
import { SMTP_ENCRYPTION_OPTIONS } from "@/lib/smtp-providers";
import type { SmtpEmailSettingFormValues } from "@/lib/validations";

function encryptionLabel(value: string) {
  return SMTP_ENCRYPTION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function EmailSettingsTab() {
  const [settings, setSettings] = useState<EmailSettingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeSetting, setActiveSetting] = useState<EmailSettingRecord | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewSetting, setViewSetting] = useState<EmailSettingRecord | null>(null);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/settings/email");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load email settings");
    }

    setSettings(Array.isArray(data.settings) ? data.settings : []);
  }, []);

  useEffect(() => {
    loadSettings()
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to load email settings"
        )
      )
      .finally(() => setLoading(false));
  }, [loadSettings]);

  function openCreate() {
    setModalMode("create");
    setActiveSetting(null);
    setModalOpen(true);
  }

  function openEdit(setting: EmailSettingRecord) {
    setModalMode("edit");
    setActiveSetting(setting);
    setModalOpen(true);
  }

  function openView(setting: EmailSettingRecord) {
    setViewSetting(setting);
    setViewOpen(true);
  }

  async function handleSave(values: SmtpEmailSettingFormValues) {
    setSaving(true);
    try {
      const url =
        modalMode === "create"
          ? "/api/settings/email"
          : `/api/settings/email/${activeSetting?.id}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      toast.success(
        modalMode === "create" ? "Email setting created" : "Email setting updated"
      );
      setModalOpen(false);
      await loadSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(setting: EmailSettingRecord) {
    if (
      !window.confirm(
        `Delete the ${setting.provider} email setting? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/email/${setting.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Email setting deleted");
      await loadSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  async function handleDefaultToggle(
    setting: EmailSettingRecord,
    makeDefault: boolean
  ) {
    if (!makeDefault) {
      if (setting.isDefault) {
        toast.error("At least one email setting must be set as default");
      }
      return;
    }

    if (setting.isDefault) {
      return;
    }

    await handleSetDefault(setting);
  }

  async function handleSetDefault(setting: EmailSettingRecord) {
    try {
      const response = await fetch(`/api/settings/email/${setting.id}/default`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set default");
      }

      toast.success(`${setting.provider} is now the default`);
      await loadSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set default");
    }
  }

  async function handleTest(setting: EmailSettingRecord) {
    setTestingId(setting.id);
    try {
      const response = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingId: setting.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Test email failed");
      }

      toast.success(data.message || "Test email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test email failed");
    } finally {
      setTestingId(null);
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
    <div className="admin-settings-tab-body">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading">Email Settings</CardTitle>
            <CardDescription className="max-w-2xl">
              Manage SMTP providers for outgoing mail. Only the profile marked
              Default is used for receipts, contact forms, and account emails.
              Set the notification inbox under Site settings.
            </CardDescription>
          </div>
          <Button type="button" className="btn-gold shrink-0" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent className="email-settings-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>SMTP Host</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>From Email</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No email settings yet. Add your first SMTP provider.
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.provider}</TableCell>
                    <TableCell>{setting.smtpHost}</TableCell>
                    <TableCell>{setting.smtpPort}</TableCell>
                    <TableCell>{setting.fromEmail}</TableCell>
                    <TableCell>
                      <Switch
                        checked={setting.isDefault}
                        className="role-status-switch"
                        onCheckedChange={(checked) =>
                          handleDefaultToggle(setting, Boolean(checked))
                        }
                        aria-label={`${setting.provider} default`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          label="Send test email"
                          onClick={() => handleTest(setting)}
                          disabled={testingId === setting.id}
                        >
                          {testingId === setting.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gold" />
                          ) : (
                            <Mail className="h-4 w-4 text-gold" />
                          )}
                        </IconActionButton>
                        <IconActionButton
                          label="View email setting"
                          onClick={() => openView(setting)}
                        >
                          <Eye className="h-4 w-4 text-gold" />
                        </IconActionButton>
                        <IconActionButton
                          label="Edit email setting"
                          onClick={() => openEdit(setting)}
                        >
                          <Pencil className="h-4 w-4 text-gold" />
                        </IconActionButton>
                        <IconActionButton
                          label="Delete email setting"
                          onClick={() => handleDelete(setting)}
                          disabled={setting.isDefault}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </IconActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmailSettingModal
        open={modalOpen}
        mode={modalMode}
        setting={activeSetting}
        saving={saving}
        onOpenChange={setModalOpen}
        onSubmit={handleSave}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="email-setting-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Email Setting Details</DialogTitle>
          </DialogHeader>
          {viewSetting && (
            <dl className="email-setting-view-list">
              <div>
                <dt>Provider</dt>
                <dd>{viewSetting.provider}</dd>
              </div>
              <div>
                <dt>SMTP host</dt>
                <dd>{viewSetting.smtpHost}</dd>
              </div>
              <div>
                <dt>Port</dt>
                <dd>{viewSetting.smtpPort}</dd>
              </div>
              <div>
                <dt>Encryption</dt>
                <dd>{encryptionLabel(viewSetting.encryption)}</dd>
              </div>
              <div>
                <dt>SMTP username</dt>
                <dd>{viewSetting.smtpUsername}</dd>
              </div>
              <div>
                <dt>From email</dt>
                <dd>{viewSetting.fromEmail}</dd>
              </div>
              <div>
                <dt>From name</dt>
                <dd>{viewSetting.fromName}</dd>
              </div>
              <div>
                <dt>Default</dt>
                <dd>{viewSetting.isDefault ? "Yes" : "No"}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
