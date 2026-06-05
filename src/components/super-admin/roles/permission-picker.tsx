"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PERMISSION_GROUP_LABELS } from "@/lib/permission-keys";
import type { PermissionRecord } from "@/components/super-admin/roles/permissions-tab";

interface PermissionPickerProps {
  permissionsByGroup: [string, PermissionRecord[]][];
  selectedIds: string[];
  onToggle: (permissionId: string) => void;
  onSetGroup: (permissionIds: string[], selected: boolean) => void;
}

export function PermissionPicker({
  permissionsByGroup,
  selectedIds,
  onToggle,
  onSetGroup,
}: PermissionPickerProps) {
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(permissionsByGroup.map(([group]) => [group, true]))
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return permissionsByGroup;

    return permissionsByGroup
      .map(([group, permissions]) => {
        const label = (PERMISSION_GROUP_LABELS[group] ?? group).toLowerCase();
        const matches = permissions.filter(
          (permission) =>
            label.includes(normalized) ||
            permission.name.toLowerCase().includes(normalized) ||
            permission.key.toLowerCase().includes(normalized) ||
            (permission.description?.toLowerCase().includes(normalized) ?? false)
        );
        return [group, matches] as [string, PermissionRecord[]];
      })
      .filter(([, permissions]) => permissions.length > 0);
  }, [permissionsByGroup, query]);

  const selectedCount = selectedIds.length;
  const totalCount = permissionsByGroup.reduce(
    (count, [, permissions]) => count + permissions.length,
    0
  );

  function toggleGroup(group: string) {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  return (
    <div className="role-permission-picker">
      <div className="role-permission-picker-toolbar">
        <div className="role-permission-picker-search">
          <Search className="role-permission-picker-search-icon" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search permissions..."
            aria-label="Search permissions"
          />
        </div>
        <p className="role-permission-picker-summary">
          {selectedCount} of {totalCount} selected
        </p>
      </div>

      <div className="role-permission-picker-groups">
        {filteredGroups.length === 0 ? (
          <p className="role-permission-picker-empty">No permissions match your search.</p>
        ) : (
          filteredGroups.map(([group, groupPermissions]) => {
            const groupIds = groupPermissions.map((permission) => permission.id);
            const selectedInGroup = groupIds.filter((id) => selectedIds.includes(id)).length;
            const allSelected =
              groupIds.length > 0 && selectedInGroup === groupIds.length;
            const isOpen = openGroups[group] ?? true;

            return (
              <section key={group} className="role-permission-picker-group">
                <div className="role-permission-picker-group-header">
                  <button
                    type="button"
                    className="role-permission-picker-group-toggle"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-gold" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gold" aria-hidden />
                    )}
                    <span className="role-permission-picker-group-title">
                      {PERMISSION_GROUP_LABELS[group] ?? group}
                    </span>
                    <span className="role-permission-picker-group-count">
                      {selectedInGroup}/{groupPermissions.length}
                    </span>
                  </button>
                  <div className="role-permission-picker-group-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-gold"
                      onClick={() => onSetGroup(groupIds, !allSelected)}
                    >
                      {allSelected ? "Clear group" : "Select group"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="role-permission-picker-group-body">
                    {groupPermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="role-permission-picker-item"
                      >
                        <Checkbox
                          checked={selectedIds.includes(permission.id)}
                          onCheckedChange={() => onToggle(permission.id)}
                        />
                        <span className="role-permission-picker-item-text">
                          <span className="role-permission-picker-item-name">
                            {permission.name}
                          </span>
                          <span className="role-permission-picker-item-key">
                            {permission.key}
                          </span>
                          {permission.description && (
                            <span className="role-permission-picker-item-description">
                              {permission.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
