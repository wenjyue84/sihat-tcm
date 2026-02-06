"use client";

import { FileText } from "lucide-react";

interface DashboardDemoNoticeProps {
  useMockData: boolean;
}

export function DashboardDemoNotice({ useMockData }: DashboardDemoNoticeProps) {
  if (!useMockData) return null;

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
        <FileText className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-amber-800 font-medium">Demo Mode</p>
        <p className="text-amber-600 text-sm">
          Showing sample patient records. Real data will appear once patients submit inquiries.
        </p>
      </div>
    </div>
  );
}
