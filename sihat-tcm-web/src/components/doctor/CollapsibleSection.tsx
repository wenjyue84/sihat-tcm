"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Check, Circle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  completionStatus: "complete" | "incomplete" | "partial";
  children: React.ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  completionStatus,
  children,
}: CollapsibleSectionProps) {
  const statusColors = {
    complete: "bg-green-500",
    incomplete: "bg-slate-300",
    partial: "bg-yellow-500",
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isExpanded ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className={`font-medium ${isExpanded ? "text-blue-700" : "text-slate-700"}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Completion indicator */}
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[completionStatus]}`} />

          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4 px-4 border-t">
              <div className="pt-4">{children}</div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
