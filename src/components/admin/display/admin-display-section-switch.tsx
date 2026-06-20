"use client";

import { Switch } from "@/components/ui/switch";

interface AdminDisplaySectionSwitchProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function AdminDisplaySectionSwitch({
  label,
  checked,
  disabled = false,
  onCheckedChange,
}: AdminDisplaySectionSwitchProps) {
  return (
    <div className="admin-display-section-switch">
      <p className="admin-display-section-switch-label">{label}</p>
      <div className="admin-messages-rotation-control">
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
          className="admin-messages-rotation-switch"
          aria-label={`${checked ? "Turn off" : "Turn on"} ${label}`}
        />
        <span
          className={
            checked
              ? "admin-messages-rotation-label admin-messages-rotation-label-on"
              : "admin-messages-rotation-label"
          }
          aria-hidden="true"
        >
          {checked ? "On" : "Off"}
        </span>
      </div>
    </div>
  );
}
