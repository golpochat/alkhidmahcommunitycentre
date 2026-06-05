import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export interface RoleOption {
  id: string;
  name: string;
  slug?: string;
}

interface RoleSelectProps {
  roles: RoleOption[];
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function RoleSelect({
  roles,
  value,
  onValueChange,
  id,
  placeholder = "Select role",
  className,
}: RoleSelectProps) {
  const selectedRole = roles.find((role) => role.id === value);

  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next ?? roles[0]?.id ?? "")}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <span className={cn("truncate", !selectedRole && "text-muted-foreground")}>
          {selectedRole?.name ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
