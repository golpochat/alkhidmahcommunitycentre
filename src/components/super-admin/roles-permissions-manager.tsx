"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PermissionPicker } from "@/components/super-admin/roles/permission-picker";
import { PermissionsTab, type PermissionRecord } from "@/components/super-admin/roles/permissions-tab";
import { RolesTab, type RoleRecord } from "@/components/super-admin/roles/roles-tab";
import { CREATE_MODULE_VALUE } from "@/lib/admin-action-reasons";
import { PERMISSION_GROUP_LABELS } from "@/lib/permission-keys";
import { cn } from "@/lib/utils";

const EMPTY_CREATE_ROLE = { name: "" };
const EMPTY_EDIT_ROLE = { name: "" };

const EMPTY_PERMISSION_FORM = {
  name: "",
  description: "",
  newModule: "",
};

export function RolesPermissionsManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("roles");

  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState(EMPTY_CREATE_ROLE);

  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [editRoleForm, setEditRoleForm] = useState(EMPTY_EDIT_ROLE);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRole, setAssignRole] = useState<RoleRecord | null>(null);
  const [assignPermissionIds, setAssignPermissionIds] = useState<string[]>([]);

  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [viewPermissionOpen, setViewPermissionOpen] = useState(false);
  const [viewingPermission, setViewingPermission] = useState<PermissionRecord | null>(null);
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [permissionForm, setPermissionForm] = useState(EMPTY_PERMISSION_FORM);
  const [moduleSelection, setModuleSelection] = useState("");

  const permissionsByGroup = useMemo(() => {
    const groups = new Map<string, PermissionRecord[]>();
    for (const permission of permissions.filter((entry) => entry.isActive)) {
      const list = groups.get(permission.group) ?? [];
      list.push(permission);
      groups.set(permission.group, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const moduleOptions = useMemo(() => {
    const groups = new Set(permissions.map((permission) => permission.group));
    return Array.from(groups).sort((a, b) => a.localeCompare(b));
  }, [permissions]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch("/api/super-admin/roles"),
        fetch("/api/super-admin/permissions"),
      ]);

      if (!rolesResponse.ok || !permissionsResponse.ok) {
        throw new Error("Failed to load roles or permissions");
      }

      const rolesData = await rolesResponse.json();
      const permissionsData = await permissionsResponse.json();
      setRoles(
        Array.isArray(rolesData)
          ? rolesData.map((role) => ({
              ...role,
              isActive: role.isActive ?? true,
            }))
          : []
      );
      setPermissions(
        Array.isArray(permissionsData)
          ? permissionsData.map((permission) => ({
              ...permission,
              isActive: permission.isActive ?? true,
            }))
          : []
      );
    } catch {
      toast.error("Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateRole() {
    setCreateRoleForm(EMPTY_CREATE_ROLE);
    setCreateRoleOpen(true);
  }

  function openEditRole(role: RoleRecord) {
    setEditingRole(role);
    setEditRoleForm({ name: role.name });
    setEditRoleOpen(true);
  }

  function openAssignPermissions(role: RoleRecord) {
    setAssignRole(role);
    setAssignPermissionIds([...role.permissionIds]);
    setAssignOpen(true);
  }

  async function saveCreateRole() {
    setSaving(true);
    try {
      const response = await fetch("/api/super-admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createRoleForm.name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create role");

      toast.success("Role created");
      setCreateRoleOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create role");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditRole() {
    if (!editingRole) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/super-admin/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editRoleForm.name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");

      toast.success("Role updated");
      setEditRoleOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRoleActive(role: RoleRecord, isActive: boolean) {
    setRoles((current) =>
      current.map((entry) =>
        entry.id === role.id ? { ...entry, isActive } : entry
      )
    );

    const response = await fetch(`/api/super-admin/roles/${role.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    const data = await response.json();
    if (!response.ok) {
      setRoles((current) =>
        current.map((entry) =>
          entry.id === role.id ? { ...entry, isActive: !isActive } : entry
        )
      );
      toast.error(data.error || "Failed to update role status");
      return;
    }

    toast.success(isActive ? "Role activated" : "Role deactivated");
  }

  function toggleAssignPermission(permissionId: string) {
    setAssignPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  }

  function setAssignGroup(permissionIds: string[], selected: boolean) {
    setAssignPermissionIds((current) => {
      if (selected) {
        return Array.from(new Set([...current, ...permissionIds]));
      }
      const remove = new Set(permissionIds);
      return current.filter((id) => !remove.has(id));
    });
  }

  async function saveAssignPermissions() {
    if (!assignRole) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/super-admin/roles/${assignRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionIds: assignPermissionIds }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save permissions");

      toast.success("Permissions saved");
      setAssignOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  function openViewPermission(permission: PermissionRecord) {
    setViewingPermission(permission);
    setViewPermissionOpen(true);
  }

  async function togglePermissionActive(
    permission: PermissionRecord,
    isActive: boolean
  ) {
    setPermissions((current) =>
      current.map((entry) =>
        entry.id === permission.id ? { ...entry, isActive } : entry
      )
    );

    const response = await fetch(`/api/super-admin/permissions/${permission.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPermissions((current) =>
        current.map((entry) =>
          entry.id === permission.id ? { ...entry, isActive: !isActive } : entry
        )
      );
      toast.error(data.error || "Failed to update permission status");
      return;
    }

    toast.success(isActive ? "Permission activated" : "Permission deactivated");
  }

  function openCreatePermission() {
    setEditingPermission(null);
    setPermissionForm(EMPTY_PERMISSION_FORM);
    setModuleSelection(moduleOptions[0] ?? "");
    setPermissionDialogOpen(true);
  }

  function openEditPermission(permission: PermissionRecord) {
    setEditingPermission(permission);
    setPermissionForm({
      name: permission.name,
      description: permission.description ?? "",
      newModule: "",
    });
    setModuleSelection(permission.group);
    setPermissionDialogOpen(true);
  }

  async function savePermission() {
    const group =
      moduleSelection === CREATE_MODULE_VALUE
        ? permissionForm.newModule.trim()
        : moduleSelection;

    if (!group) {
      toast.error("Module is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingPermission
        ? `/api/super-admin/permissions/${editingPermission.id}`
        : "/api/super-admin/permissions";
      const method = editingPermission ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: permissionForm.name.trim(),
          description: permissionForm.description,
          group,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save permission");

      toast.success(editingPermission ? "Permission updated" : "Permission created");
      setPermissionDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save permission"
      );
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
      <p className="text-muted-foreground">
        Manage roles and permissions by module. Assign roles to users on Staff &amp; Users.
      </p>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="admin-settings-tabs"
      >
        <TabsList className="admin-settings-tabs-list">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="admin-settings-tab-content">
          <RolesTab
            roles={roles}
            onCreate={openCreateRole}
            onEdit={openEditRole}
            onAssignPermissions={openAssignPermissions}
            onToggleActive={toggleRoleActive}
          />
        </TabsContent>

        <TabsContent value="permissions" className="admin-settings-tab-content">
          <PermissionsTab
            permissions={permissions}
            onCreate={openCreatePermission}
            onView={openViewPermission}
            onEdit={openEditPermission}
            onToggleActive={togglePermissionActive}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Add Role</DialogTitle>
            <DialogDescription>
              Create a role, then use the key icon to assign permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-role-name" className="text-gold">
                Name
              </Label>
              <Input
                id="create-role-name"
                value={createRoleForm.name}
                onChange={(event) =>
                  setCreateRoleForm({ name: event.target.value })
                }
                placeholder="e.g. Volunteer Coordinator"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-gold"
              disabled={saving}
              onClick={saveCreateRole}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name" className="text-gold">
                Name
              </Label>
              <Input
                id="edit-role-name"
                value={editRoleForm.name}
                onChange={(event) =>
                  setEditRoleForm({ name: event.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-gold"
              disabled={saving}
              onClick={saveEditRole}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Assign Permissions — {assignRole?.slug}
            </DialogTitle>
            <DialogDescription>
              Select permissions to assign to this role.
            </DialogDescription>
          </DialogHeader>
          <PermissionPicker
            permissionsByGroup={permissionsByGroup}
            selectedIds={assignPermissionIds}
            onToggle={toggleAssignPermission}
            onSetGroup={setAssignGroup}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-gold"
              disabled={saving}
              onClick={saveAssignPermissions}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewPermissionOpen} onOpenChange={setViewPermissionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Permission details</DialogTitle>
          </DialogHeader>
          {viewingPermission && (
            <dl className="permission-detail-list">
              <div className="permission-detail-item">
                <dt>Name</dt>
                <dd>{viewingPermission.name}</dd>
              </div>
              <div className="permission-detail-item">
                <dt>Key</dt>
                <dd className="font-mono text-sm">{viewingPermission.key}</dd>
              </div>
              <div className="permission-detail-item">
                <dt>Module</dt>
                <dd>
                  {PERMISSION_GROUP_LABELS[viewingPermission.group] ??
                    viewingPermission.group}
                </dd>
              </div>
              <div className="permission-detail-item">
                <dt>Status</dt>
                <dd>{viewingPermission.isActive ? "Active" : "Inactive"}</dd>
              </div>
              {viewingPermission.description && (
                <div className="permission-detail-item">
                  <dt>Description</dt>
                  <dd>{viewingPermission.description}</dd>
                </div>
              )}
              {viewingPermission.isSystem && (
                <div className="permission-detail-item">
                  <dt>Type</dt>
                  <dd>Built-in</dd>
                </div>
              )}
            </dl>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewPermissionOpen(false)}
            >
              Close
            </Button>
            {viewingPermission && (
              <Button
                type="button"
                className="btn-gold"
                onClick={() => {
                  setViewPermissionOpen(false);
                  openEditPermission(viewingPermission);
                }}
              >
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingPermission ? "Edit Permission" : "Add Permission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="permission-name" className="text-gold">
                Permission name
              </Label>
              <Input
                id="permission-name"
                value={permissionForm.name}
                onChange={(event) =>
                  setPermissionForm({ ...permissionForm, name: event.target.value })
                }
                placeholder="e.g. Delete users"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-module" className="text-gold">
                Module
              </Label>
              <Select
                value={moduleSelection}
                onValueChange={(value) => setModuleSelection(value ?? "")}
              >
                <SelectTrigger id="permission-module" className="w-full">
                  <span className={cn("truncate", !moduleSelection && "text-muted-foreground")}>
                    {moduleSelection === CREATE_MODULE_VALUE
                      ? "+ Create new module"
                      : moduleSelection
                        ? PERMISSION_GROUP_LABELS[moduleSelection] ?? moduleSelection
                        : "Select a module..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((group) => (
                    <SelectItem key={group} value={group}>
                      {PERMISSION_GROUP_LABELS[group] ?? group}
                    </SelectItem>
                  ))}
                  <SelectItem value={CREATE_MODULE_VALUE}>+ Create new module</SelectItem>
                </SelectContent>
              </Select>
              {moduleSelection === CREATE_MODULE_VALUE && (
                <Input
                  value={permissionForm.newModule}
                  onChange={(event) =>
                    setPermissionForm({
                      ...permissionForm,
                      newModule: event.target.value,
                    })
                  }
                  placeholder="e.g. reports"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-description" className="text-gold">
                Description
              </Label>
              <Textarea
                id="permission-description"
                value={permissionForm.description}
                onChange={(event) =>
                  setPermissionForm({
                    ...permissionForm,
                    description: event.target.value,
                  })
                }
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPermissionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-gold"
              disabled={saving}
              onClick={savePermission}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPermission ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
