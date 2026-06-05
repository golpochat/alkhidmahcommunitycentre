"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setEmail(data.email || "");
        setStatus("success");
        setMessage("Your email address has been updated successfully.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Verification failed"
        );
      });
  }, [token]);

  return (
    <div className="auth-page-shell">
      <Card className="w-full max-w-md card-mosque">
        <CardHeader className="text-center">
          <div className="auth-page-icon">
            {status === "loading" ? (
              <Loader2 className="h-6 w-6 animate-spin text-mosque-black" />
            ) : (
              <MailCheck className="h-6 w-6 text-mosque-black" />
            )}
          </div>
          <CardTitle className="font-heading text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" ? "Confirming your new email address..." : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm">
          {status === "success" && email && (
            <p className="text-muted-foreground">
              Your account email is now <strong>{email}</strong>.
            </p>
          )}
          {status !== "loading" && (
            <Link href="/login" className="text-gold hover:underline">
              Back to sign in
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
