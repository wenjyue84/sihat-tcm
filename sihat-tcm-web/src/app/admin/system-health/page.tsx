/**
 * @fileoverview Admin System Health Page
 *
 * Admin-only page for monitoring system health, errors, and performance metrics.
 * Provides comprehensive dashboard for system administrators.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";

export const metadata: Metadata = {
  title: "System Health Dashboard | Sihat TCM Admin",
  description: "Monitor system health, errors, and performance metrics",
  robots: "noindex, nofollow", // Prevent search engine indexing
};

/**
 * Admin System Health Page
 */
export default async function SystemHealthPage() {
  // Verify admin access
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/admin/system-health");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard?error=access_denied");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <div>
                    <a href="/dashboard" className="text-gray-400 hover:text-gray-500">
                      Dashboard
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-gray-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <a href="/admin" className="ml-4 text-gray-400 hover:text-gray-500">
                      Admin
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-gray-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">
                      System Health
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Admin badge */}
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Admin Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <SystemHealthDashboard />
      </main>
    </div>
  );
}