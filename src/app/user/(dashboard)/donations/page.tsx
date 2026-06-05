import { ButtonLink } from "@/components/ui/button-link";

export default function UserDonationsPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">My Donations</h1>
      <p className="mb-6 text-muted-foreground">
        Your donation history will appear here once linked to your account.
      </p>
      <ButtonLink href="/donate" className="btn-gold">
        Make a donation
      </ButtonLink>
    </div>
  );
}
