import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Prayer Times Display",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a2e1f",
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="display-root">
      {children}
    </div>
  );
}
