import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VerifyEmailPageContent } from "@/components/auth/verify-email-page-content";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-shell">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
