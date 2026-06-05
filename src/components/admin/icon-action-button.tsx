import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function IconActionButton({
  label,
  onClick,
  children,
  disabled,
}: IconActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="icon-action-tooltip"
      data-tooltip={label}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
