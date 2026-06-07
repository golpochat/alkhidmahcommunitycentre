import { UserDonationsList } from "@/components/user/user-donations-list";
import { ButtonLink } from "@/components/ui/button-link";

export default function UserDonationsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-semibold">My Donations</h1>
          <p className="text-muted-foreground">
            Donations linked to your account email, including past gifts made before
            you registered.
          </p>
        </div>
        <ButtonLink href="/donations" className="btn-gold">
          Make a donation
        </ButtonLink>
      </div>
      <UserDonationsList />
    </div>
  );
}
