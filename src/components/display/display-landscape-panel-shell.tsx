import type { ReactNode } from "react";

interface DisplayLandscapePanelShellProps {
  kicker?: string;
  children: ReactNode;
}

export function DisplayLandscapePanelShell({
  kicker,
  children,
}: DisplayLandscapePanelShellProps) {
  return (
    <div className="display-landscape-panel-shell">
      {kicker ? <p className="display-landscape-panel-kicker">{kicker}</p> : null}
      <div className="display-landscape-panel-body">{children}</div>
    </div>
  );
}
