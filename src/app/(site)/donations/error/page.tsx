"use client";

import { useSearchParams } from "next/navigation";
import { DonationError } from "@/components/donations/donation-error";

export default function DonationErrorPage() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || undefined;
  const message = searchParams.get("message") || undefined;

  return (
    <section className="section-padding">
      <div className="section-container">
        <DonationError provider={provider} message={message} />
      </div>
    </section>
  );
}
