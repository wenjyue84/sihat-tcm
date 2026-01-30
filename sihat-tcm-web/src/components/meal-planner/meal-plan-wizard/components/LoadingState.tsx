"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600" />
        <p className="text-base text-slate-600 font-light">{message}</p>
      </div>
    </div>
  );
}
