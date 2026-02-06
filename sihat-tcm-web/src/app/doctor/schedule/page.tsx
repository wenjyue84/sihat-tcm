"use client";

import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2, Calendar } from "lucide-react";
import { CalendarView } from "@/components/doctor/schedule/CalendarView";

export default function DoctorSchedulePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!profile || profile.role !== "doctor") {
    router.push("/doctor");
    return null;
  }

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <header className="mb-6 flex-none">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Appointment Schedule
        </h1>
        <p className="text-slate-500">Manage appointments and availability</p>
      </header>

      <div className="flex-1 min-h-0">
        <CalendarView />
      </div>
    </div>
  );
}
