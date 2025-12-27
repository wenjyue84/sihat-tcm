import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Dashboard",
  description:
    "Access your personalized health dashboard, view diagnosis history, and track your wellness journey.",
  robots: {
    index: false, // Prevent indexing of authenticated pages
    follow: false,
  },
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
