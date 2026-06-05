import { AlertCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";

interface DonationErrorProps {
  provider?: string;
  message?: string;
}

export function DonationError({
  provider,
  message = "Your payment could not be completed. Please try again or choose a different provider.",
}: DonationErrorProps) {
  return (
    <Card className="mx-auto max-w-lg border-destructive/30 text-center">
      <CardContent className="space-y-4 p-10">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="font-heading text-3xl font-semibold">Payment Failed</h1>
        <p className="text-muted-foreground">
          {provider ? `${provider} payment was not completed. ` : ""}
          {message}
        </p>
        <ButtonLink href="/donations" className="btn-gold">
          Try Again
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
