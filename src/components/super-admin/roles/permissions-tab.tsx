"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Eye, Pencil, Plus } from "lucide-react";
import { IconActionButton } from "@/components/admin/icon-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERMISSION_GROUP_LABELS } from "@/lib/permission-keys";

export interface PermissionRecord {
  id: string;
  key: string;
  name: string;
  description: string | null;
  group: string;
  isSystem: boolean;
  isActive: boolean;
}

interface PermissionsTabProps {
  permissions: PermissionRecord[];
  onCreate: () => void;
  onView: (permission: PermissionRecord) => void;
  onEdit: (permission: PermissionRecord) => void;
  onToggleActive: (permission: PermissionRecord, isActive: boolean) => void;
}

export function PermissionsTab({
  permissions,
  onCreate,
  onView,
  onEdit,
  onToggleActive,
}: PermissionsTabProps) {
  const modules = useMemo(() => {
    const grouped = new Map<string, PermissionRecord[]>();
    for (const permission of permissions) {
      const list = grouped.get(permission.group) ?? [];
      list.push(permission);
      grouped.set(permission.group, list);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        label: PERMISSION_GROUP_LABELS[group] ?? group,
        permissions: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [permissions]);

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  function toggleModule(group: string) {
    setOpenModules((current) => ({ ...current, [group]: !current[group] }));
  }

  return (
    <div className="admin-settings-tab-body">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading">Permissions by module</CardTitle>
            <CardDescription className="max-w-2xl">
              Expand a module to manage individual permissions. Assign active
              permissions to roles using the key icon on the Roles tab.
            </CardDescription>
          </div>
          <Button type="button" className="btn-gold shrink-0" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        </CardHeader>
        <CardContent className="permissions-module-list">
          {modules.length === 0 ? (
            <p className="permissions-module-empty">No permissions found.</p>
          ) : (
            modules.map(({ group, label, permissions: modulePermissions }) => {
              const isOpen = openModules[group] ?? false;

              return (
                <section key={group} className="permissions-module-item">
                  <button
                    type="button"
                    className="permissions-module-trigger"
                    onClick={() => toggleModule(group)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-gold" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gold" aria-hidden />
                    )}
                    <span className="permissions-module-title">
                      {label} ({modulePermissions.length})
                    </span>
                  </button>

                  {isOpen && (
                    <div className="permissions-module-detail">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Permission name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-28 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {modulePermissions.map((permission) => (
                            <TableRow key={permission.id}>
                              <TableCell>
                                <p className="font-medium">{permission.name}</p>
                                <p className="font-mono text-xs text-muted-foreground">
                                  {permission.key}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={permission.isActive}
                                  className="role-status-switch"
                                  onCheckedChange={(checked) =>
                                    onToggleActive(permission, Boolean(checked))
                                  }
                                  aria-label={`${permission.name} ${permission.isActive ? "active" : "inactive"}`}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <IconActionButton
                                    label="View permission"
                                    onClick={() => onView(permission)}
                                  >
                                    <Eye className="h-4 w-4 text-gold" />
                                  </IconActionButton>
                                  <IconActionButton
                                    label="Edit permission"
                                    onClick={() => onEdit(permission)}
                                  >
                                    <Pencil className="h-4 w-4 text-gold" />
                                  </IconActionButton>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
