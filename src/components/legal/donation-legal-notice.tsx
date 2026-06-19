import Link from "next/link";

export function DonationLegalNotice() {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      By continuing, you agree to our{" "}
      <Link href="/legal/terms-of-use" className="text-gold underline-offset-4 hover:underline">
        Terms of Use
      </Link>{" "}
      and acknowledge our{" "}
      <Link href="/legal/privacy-policy" className="text-gold underline-offset-4 hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
