interface UserContextBoxProps {
  name: string | null;
  email: string;
  roleName?: string;
  statusLabel?: string;
}

export function UserContextBox({
  name,
  email,
  roleName,
  statusLabel,
}: UserContextBoxProps) {
  return (
    <div className="admin-user-context-box">
      <p className="admin-user-context-box-name">{name || "—"}</p>
      <p className="admin-user-context-box-email">{email}</p>
      {roleName && (
        <p className="admin-user-context-box-meta">
          Current role: <span>{roleName}</span>
        </p>
      )}
      {statusLabel && (
        <p className="admin-user-context-box-meta">
          Status: <span>{statusLabel}</span>
        </p>
      )}
    </div>
  );
}
