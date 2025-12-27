"use client";

import { useEffect } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { UnifiedDashboard } from "@/components/patient/UnifiedDashboard";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function PatientDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/patient");
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-5 md:p-10">
        <Card className="p-8 md:p-10 text-center bg-white/80 backdrop-blur-md shadow-depth-2">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect
  }

  // Render the unified dashboard with error boundary
  return (
    <ErrorBoundary
      category="PatientDashboard"
      userId={user.id}
      fallbackTitle="Dashboard Error"
      fallbackMessage="An error occurred while loading your dashboard. Please try refreshing the page."
      onRetry={() => window.location.reload()}
    >
      <UnifiedDashboard />
    </ErrorBoundary>
  );
}
