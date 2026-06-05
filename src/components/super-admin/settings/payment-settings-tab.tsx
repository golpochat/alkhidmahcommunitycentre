"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PaymentGatewayModal,
} from "@/components/super-admin/settings/payment-gateway-modal";
import {
  paymentGatewayTypeLabel,
  type PaymentGatewayTypeId,
} from "@/lib/payment-gateway-presets";
import type { PaymentGatewayFormValues } from "@/lib/validations";

export interface PaymentGatewayRecord {
  id: string;
  name: string;
  type: PaymentGatewayTypeId;
  isEnabled: boolean;
  currency: string;
  hasSecrets: boolean;
  publishableKey?: string;
  paypalMode?: string;
  paypalClientId?: string;
  accountName?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  referenceNote?: string;
}

function gatewaySummary(gateway: PaymentGatewayRecord) {
  if (gateway.type === "STRIPE") {
    return gateway.publishableKey || "—";
  }
  if (gateway.type === "PAYPAL") {
    return gateway.paypalMode === "live" ? "Live" : "Sandbox";
  }
  return gateway.iban || "—";
}

export function PaymentSettingsTab() {
  const [gateways, setGateways] = useState<PaymentGatewayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeGateway, setActiveGateway] = useState<PaymentGatewayRecord | null>(
    null
  );

  const [viewOpen, setViewOpen] = useState(false);
  const [viewGateway, setViewGateway] = useState<PaymentGatewayRecord | null>(null);

  const loadGateways = useCallback(async () => {
    const response = await fetch("/api/settings/payment");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load payment gateways");
    }

    setGateways(Array.isArray(data.gateways) ? data.gateways : []);
  }, []);

  useEffect(() => {
    loadGateways()
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to load payment gateways"
        )
      )
      .finally(() => setLoading(false));
  }, [loadGateways]);

  function openCreate() {
    setModalMode("create");
    setActiveGateway(null);
    setModalOpen(true);
  }

  function openEdit(gateway: PaymentGatewayRecord) {
    setModalMode("edit");
    setActiveGateway(gateway);
    setModalOpen(true);
  }

  function openView(gateway: PaymentGatewayRecord) {
    setViewGateway(gateway);
    setViewOpen(true);
  }

  async function handleSave(values: PaymentGatewayFormValues) {
    setSaving(true);
    try {
      const url =
        modalMode === "create"
          ? "/api/settings/payment"
          : `/api/settings/payment/${activeGateway?.id}`;
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
        modalMode === "create" ? "Payment gateway created" : "Payment gateway updated"
      );
      setModalOpen(false);
      await loadGateways();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(gateway: PaymentGatewayRecord) {
    if (
      !window.confirm(`Delete "${gateway.name}"? This cannot be undone.`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/payment/${gateway.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Payment gateway deleted");
      await loadGateways();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  async function handleToggleEnabled(
    gateway: PaymentGatewayRecord,
    isEnabled: boolean
  ) {
    try {
      const response = await fetch(`/api/settings/payment/${gateway.id}/enabled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      await loadGateways();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
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
            <CardTitle className="font-heading">Payment Settings</CardTitle>
            <CardDescription className="max-w-2xl">
              Add and manage payment gateways for donations. All enabled gateways
              appear on the public donate page (Stripe, PayPal, bank transfer, etc.).
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
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No payment gateways yet. Add Stripe, PayPal, or bank transfer.
                  </TableCell>
                </TableRow>
              ) : (
                gateways.map((gateway) => (
                  <TableRow key={gateway.id}>
                    <TableCell className="font-medium">{gateway.name}</TableCell>
                    <TableCell>{paymentGatewayTypeLabel(gateway.type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {gatewaySummary(gateway)}
                    </TableCell>
                    <TableCell>{gateway.currency}</TableCell>
                    <TableCell>
                      <Switch
                        checked={gateway.isEnabled}
                        className="role-status-switch"
                        onCheckedChange={(checked) =>
                          handleToggleEnabled(gateway, Boolean(checked))
                        }
                        aria-label={`${gateway.name} enabled`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          label="View gateway"
                          onClick={() => openView(gateway)}
                        >
                          <Eye className="h-4 w-4 text-gold" />
                        </IconActionButton>
                        <IconActionButton
                          label="Edit gateway"
                          onClick={() => openEdit(gateway)}
                        >
                          <Pencil className="h-4 w-4 text-gold" />
                        </IconActionButton>
                        <IconActionButton
                          label="Delete gateway"
                          onClick={() => handleDelete(gateway)}
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

      <PaymentGatewayModal
        open={modalOpen}
        mode={modalMode}
        gateway={activeGateway}
        saving={saving}
        onOpenChange={setModalOpen}
        onSubmit={handleSave}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="email-setting-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Payment Gateway Details</DialogTitle>
          </DialogHeader>
          {viewGateway && (
            <dl className="email-setting-view-list">
              <div>
                <dt>Name</dt>
                <dd>{viewGateway.name}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{paymentGatewayTypeLabel(viewGateway.type)}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{viewGateway.currency}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{viewGateway.isEnabled ? "Enabled" : "Disabled"}</dd>
              </div>
              {viewGateway.type === "STRIPE" && (
                <div>
                  <dt>Publishable key</dt>
                  <dd>{viewGateway.publishableKey}</dd>
                </div>
              )}
              {viewGateway.type === "PAYPAL" && (
                <>
                  <div>
                    <dt>Client ID</dt>
                    <dd>{viewGateway.paypalClientId}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>{viewGateway.paypalMode}</dd>
                  </div>
                </>
              )}
              {viewGateway.type === "BANK_TRANSFER" && (
                <>
                  <div>
                    <dt>Account name</dt>
                    <dd>{viewGateway.accountName}</dd>
                  </div>
                  <div>
                    <dt>Bank</dt>
                    <dd>{viewGateway.bankName}</dd>
                  </div>
                  <div>
                    <dt>IBAN</dt>
                    <dd>{viewGateway.iban}</dd>
                  </div>
                  <div>
                    <dt>BIC</dt>
                    <dd>{viewGateway.bic}</dd>
                  </div>
                  <div>
                    <dt>Reference note</dt>
                    <dd>{viewGateway.referenceNote}</dd>
                  </div>
                </>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
