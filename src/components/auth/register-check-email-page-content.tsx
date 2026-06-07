"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function RegisterCheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setSending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend email");
      }
      toast.success("Verification email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-page-shell">
      <Card className="w-full max-w-md card-mosque">
        <CardHeader className="text-center">
          <div className="auth-page-icon">
            <MailCheck className="h-6 w-6 text-mosque-black" />
          </div>
          <CardTitle className="font-heading text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We sent a verification link{email ? ` to ${email}` : ""}. Open it to activate your
            member account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm">
          {email && (
            <Button
              type="button"
              variant="outline"
              className="border-gold text-gold"
              disabled={sending}
              onClick={handleResend}
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend verification email
            </Button>
          )}
          <p>
            <Link href="/login" className="text-gold hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function RegisterCheckEmailPageContent() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-shell">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      }
    >
      <RegisterCheckEmailContent />
    </Suspense>
  );
}
