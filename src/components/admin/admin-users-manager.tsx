"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  History,
  KeyRound,
  Loader2,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { UserContextBox } from "@/components/admin/user-context-box";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { RoleSelect } from "@/components/admin/role-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ACTION_REASONS } from "@/lib/admin-action-reasons";
import Link from "next/link";
import { AccountTier } from "@/lib/account-tier";
import { cn } from "@/lib/utils";

function isStaffUser(user: AdminUser) {
  return user.role.tier === AccountTier.STAFF;
}

interface AssignableRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  roleId: string;
  isActive: boolean;
  role: AssignableRole;
  createdAt: string;
  updatedAt: string;
}

interface AdminLogEntry {
  id: string;
  action: string;
  reason: string;
  details: string | null;
  actorEmail: string | null;
  createdAt: string;
}

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState("");

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [customStatusReason, setCustomStatusReason] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [customResetReason, setCustomResetReason] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<AdminLogEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/super-admin/roles?assignable=true"),
      ]);

      if (!usersResponse.ok) throw new Error("Failed to load users");

      const usersData = await usersResponse.json();
      setUsers(Array.isArray(usersData) ? usersData : []);

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function resolveReason(selected: string, custom: string) {
    return selected === "Other (Custom)" ? custom.trim() : selected;
  }

  function openAssignRole(user: AdminUser) {
    setSelectedUser(user);
    setAssignRoleId(user.roleId);
    setAssignRoleOpen(true);
  }

  async function saveAssignRole() {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: assignRoleId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");

      toast.success("Role assigned");
      setAssignRoleOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  function openStatusChange(user: AdminUser) {
    setSelectedUser(user);
    setStatusReason("");
    setCustomStatusReason("");
    setStatusOpen(true);
  }

  async function saveStatusChange() {
    if (!selectedUser) return;

    const reason = resolveReason(statusReason, customStatusReason);
    if (!reason) {
      toast.error("Reason is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !selectedUser.isActive,
          reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");

      toast.success(selectedUser.isActive ? "User deactivated" : "User activated");
      setStatusOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  function openResetPassword(user: AdminUser) {
    setSelectedUser(user);
    setResetReason("");
    setCustomResetReason("");
    setResetOpen(true);
  }

  async function saveResetPassword() {
    if (!selectedUser) return;

    const reason = resolveReason(resetReason, customResetReason);
    if (!reason) {
      toast.error("Reason is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reset password");

      toast.success("Password reset", {
        description: data.temporaryPassword
          ? `Temporary password: ${data.temporaryPassword}`
          : "Reset email sent",
      });
      setResetOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(user: AdminUser) {
    setSelectedUser(user);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/history`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load history");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
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
        Staff and members who can sign in. Level 2 (staff) roles can be changed here;
        level 3 (member) accounts are created via public signup only and cannot be
        assigned a role from this page. The platform owner is not listed here. To invite
        new staff, use{" "}
        <Link href="/super-admin/invitations" className="text-gold hover:underline">
          Staff invitations
        </Link>
        .
      </p>

      <div className="users-table-wrap rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <span className="font-medium">{user.name || "—"}</span>
                  {!user.isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconActionButton
                      label="Change status"
                      onClick={() => openStatusChange(user)}
                    >
                      <ShieldAlert className="h-4 w-4 text-gold" />
                    </IconActionButton>
                    <IconActionButton
                      label="Status history"
                      onClick={() => openHistory(user)}
                    >
                      <History className="h-4 w-4 text-gold" />
                    </IconActionButton>
                    <IconActionButton
                      label="Reset password"
                      onClick={() => openResetPassword(user)}
                    >
                      <KeyRound className="h-4 w-4 text-gold" />
                    </IconActionButton>
                    {isStaffUser(user) && (
                      <IconActionButton
                        label="Assign role"
                        onClick={() => openAssignRole(user)}
                      >
                        <UserCog className="h-4 w-4 text-gold" />
                      </IconActionButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              Assign Role — {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserContextBox
              name={selectedUser.name}
              email={selectedUser.email}
              roleName={selectedUser.role.name}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="assign-role-select">Select staff role</Label>
            <RoleSelect
              id="assign-role-select"
              roles={roles}
              value={assignRoleId}
              onValueChange={setAssignRoleId}
              placeholder="Select a staff role..."
            />
            <p className="text-xs text-muted-foreground">
              Member is not listed — level 3 accounts are signup-only.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="btn-gold" disabled={saving} onClick={saveAssignRole}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Change Admin Status</DialogTitle>
            <DialogDescription>
              You are about to {selectedUser?.isActive ? "deactivate" : "activate"} the
              following user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserContextBox
              name={selectedUser.name}
              email={selectedUser.email}
              statusLabel={selectedUser.isActive ? "Active" : "Inactive"}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="status-reason">Reason for change</Label>
            <Select value={statusReason} onValueChange={(value) => setStatusReason(value ?? "")}>
              <SelectTrigger id="status-reason">
                <span className={cn("truncate", !statusReason && "text-muted-foreground")}>
                  {statusReason || "Select a reason..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ACTION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusReason === "Other (Custom)" && (
              <Input
                value={customStatusReason}
                onChange={(event) => setCustomStatusReason(event.target.value)}
                placeholder="Enter custom reason"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="btn-gold" disabled={saving} onClick={saveStatusChange}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Reset Password</DialogTitle>
            <DialogDescription>Send a password reset email to:</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserContextBox name={selectedUser.name} email={selectedUser.email} />
          )}
          <div className="space-y-2">
            <Label htmlFor="reset-reason">Reason type</Label>
            <Select value={resetReason} onValueChange={(value) => setResetReason(value ?? "")}>
              <SelectTrigger id="reset-reason">
                <span className={cn("truncate", !resetReason && "text-muted-foreground")}>
                  {resetReason || "Select a reason..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ACTION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resetReason === "Other (Custom)" && (
              <Input
                value={customResetReason}
                onChange={(event) => setCustomResetReason(event.target.value)}
                placeholder="Enter custom reason"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="btn-gold" disabled={saving} onClick={saveResetPassword}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              Status History — {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No status change history found for this user.
            </p>
          ) : (
            <ul className="admin-user-history-list">
              {history.map((entry) => (
                <li key={entry.id} className="admin-user-history-item">
                  <p className="font-medium">{entry.action.replace("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">{entry.reason}</p>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground">{entry.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(entry.createdAt), "d MMM yyyy, HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
