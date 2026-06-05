import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-shell">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
