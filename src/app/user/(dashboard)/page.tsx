import { ButtonLink } from "@/components/ui/button-link";

export default function UserDashboardPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">Welcome</h1>
      <p className="mb-8 text-muted-foreground">
        Your member account for donations, class registrations, and community
        updates.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">My Donations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View your donation history and support the mosque.
          </p>
          <ButtonLink href="/user/donations" variant="outline" className="mt-4">
            View donations
          </ButtonLink>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">My Registrations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See classes you have registered for at the centre.
          </p>
          <ButtonLink href="/user/registrations" variant="outline" className="mt-4">
            View registrations
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
