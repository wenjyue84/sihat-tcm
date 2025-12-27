import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Dashboard",
  description: "Access patient records and manage TCM diagnoses.",
  robots: {
    index: false, // Prevent indexing of authenticated pages
    follow: false,
  },
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
