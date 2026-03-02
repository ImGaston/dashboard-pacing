import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RevFactor Admin",
  description: "Course content management",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
