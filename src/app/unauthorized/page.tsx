import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-3xl font-semibold text-gold">Access denied</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        You do not have permission to view this page. Contact an administrator if you believe
        this is an error.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold/40 hover:text-gold"
        >
          Back to admin
        </Link>
        <Link href="/" className="btn-gold inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
