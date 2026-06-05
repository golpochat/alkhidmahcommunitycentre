"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Mail, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { RoleSelect } from "@/components/admin/role-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InviteUserFormValues } from "@/lib/validations";

interface AssignableRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: string;
}

interface StaffInvitationRow {
  id: string;
  email: string;
  name: string | null;
  roleId: string;
  role: AssignableRole;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  invitedByEmail: string | null;
  createdAt: string;
}

export function StaffInvitationsManager() {
  const [invitations, setInvitations] = useState<StaffInvitationRow[]>([]);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteUserFormValues>({
    email: "",
    name: "",
    roleId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [invitationsResponse, rolesResponse] = await Promise.all([
        fetch("/api/super-admin/invitations"),
        fetch("/api/super-admin/roles?invitableStaff=true"),
      ]);

      if (!invitationsResponse.ok) {
        throw new Error("Failed to load invitations");
      }

      const invitationsData = await invitationsResponse.json();
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        const assignable = Array.isArray(rolesData) ? rolesData : [];
        setRoles(assignable);
        setInviteForm((current) => ({
          ...current,
          roleId:
            current.roleId && assignable.some((role) => role.id === current.roleId)
              ? current.roleId
              : assignable[0]?.id ?? "",
        }));
      }
    } catch {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/super-admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send invitation");

      toast.success("Invitation sent", {
        description: "The link is valid for 7 days.",
      });

      setInviteForm({
        email: "",
        name: "",
        roleId: roles[0]?.id ?? "",
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }

  async function handleResend(id: string) {
    setActionId(id);
    try {
      const response = await fetch(`/api/super-admin/invitations/${id}/resend`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Resend failed");

      toast.success("Invitation resent", {
        description: "A new 7-day link was emailed.",
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resend failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(id: string) {
    setActionId(id);
    try {
      const response = await fetch(`/api/super-admin/invitations/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cancel failed");

      toast.success("Invitation cancelled");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancel failed");
    } finally {
      setActionId(null);
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
    <div>
      <p className="mb-8 text-muted-foreground">
        Invite level 2 staff by email. They complete setup via the link (valid for{" "}
        <strong>7 days</strong>) and only appear under{" "}
        <Link href="/super-admin/users" className="text-gold hover:underline">
          Staff &amp; Users
        </Link>{" "}
        after activation.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold" />
            Send invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={inviteForm.name || ""}
                onChange={(event) =>
                  setInviteForm({ ...inviteForm, name: event.target.value })
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm({ ...inviteForm, email: event.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <RoleSelect
                roles={roles}
                value={inviteForm.roleId}
                onValueChange={(roleId) => setInviteForm({ ...inviteForm, roleId })}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="btn-gold w-full" disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send invitation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Mail className="h-5 w-5 text-gold" />
            Pending invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No pending invitations.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const busy = actionId === invitation.id;

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.name || "—"}</TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.role.name}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            invitation.isExpired && "text-destructive"
                          )}
                        >
                          {format(parseISO(invitation.expiresAt), "d MMM yyyy HH:mm")}
                          {invitation.isExpired ? " (expired)" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleResend(invitation.id)}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-4 w-4" />
                            )}
                            Resend
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleCancel(invitation.id)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
