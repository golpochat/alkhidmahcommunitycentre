import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-shell">
          <p className="text-muted-foreground">Loading invitation…</p>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
