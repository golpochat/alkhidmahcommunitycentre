import { ButtonLink } from "@/components/ui/button-link";
import { EDUCATION_PATH } from "@/lib/constants";

export default function UserRegistrationsPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">My Registrations</h1>
      <p className="mb-6 text-muted-foreground">
        Class registrations tied to your email will appear here in a future update.
      </p>
      <ButtonLink href={EDUCATION_PATH} variant="outline">
        Browse programmes
      </ButtonLink>
    </div>
  );
}
