import { UserRegistrationsList } from "@/components/user/user-registrations-list";

export default function UserRegistrationsPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">My Registrations</h1>
      <p className="mb-6 text-muted-foreground">
        Class sign-ups registered with your account email.
      </p>
      <UserRegistrationsList />
    </div>
  );
}
