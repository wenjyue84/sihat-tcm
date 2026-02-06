import type { Metadata } from "next";
import { DoctorNavigation } from "@/components/doctor/DoctorNavigation";

import { DoctorTopBar } from "@/components/doctor/DoctorTopBar";

export const metadata: Metadata = {
  title: "Doctor Dashboard",
  description: "Access patient records and manage TCM diagnoses.",
  robots: {
    index: false, // Prevent indexing of authenticated pages
    follow: false,
  },
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <DoctorNavigation />
      {/* Main content with mobile top padding for fixed header */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 pt-14 lg:pt-0">
        <div className="hidden lg:block shrink-0">
          <DoctorTopBar />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col">{children}</div>
      </main>
    </div>
  );
}
