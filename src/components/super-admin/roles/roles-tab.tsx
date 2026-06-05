"use client";

import { KeyRound, Pencil, Plus } from "lucide-react";
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

export interface RoleRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: "SUPER_ADMIN" | "STAFF" | "MEMBER";
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
}

interface RolesTabProps {
  roles: RoleRecord[];
  onCreate: () => void;
  onEdit: (role: RoleRecord) => void;
  onAssignPermissions: (role: RoleRecord) => void;
  onToggleActive: (role: RoleRecord, isActive: boolean) => void;
}

export function RolesTab({
  roles,
  onCreate,
  onEdit,
  onAssignPermissions,
  onToggleActive,
}: RolesTabProps) {
  const manageableRoles = roles.filter((role) => role.tier !== "SUPER_ADMIN");

  return (
    <div className="admin-settings-tab-body">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading">Roles</CardTitle>
            <CardDescription className="max-w-2xl">
              Manage roles and permissions by module. Assign roles to people on Staff
              &amp; Users.
            </CardDescription>
          </div>
          <Button type="button" className="btn-gold shrink-0" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent className="roles-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manageableRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    No roles yet. Add a role to get started.
                  </TableCell>
                </TableRow>
              ) : (
                manageableRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <p className="font-medium">{role.name}</p>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={role.isActive}
                        className="role-status-switch"
                        onCheckedChange={(checked) =>
                          onToggleActive(role, Boolean(checked))
                        }
                        aria-label={`${role.name} ${role.isActive ? "active" : "inactive"}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          label="Assign permissions"
                          onClick={() => onAssignPermissions(role)}
                        >
                          <KeyRound className="h-4 w-4 text-gold" />
                        </IconActionButton>
                        <IconActionButton
                          label="Edit role"
                          onClick={() => onEdit(role)}
                        >
                          <Pencil className="h-4 w-4 text-gold" />
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
    </div>
  );
}
