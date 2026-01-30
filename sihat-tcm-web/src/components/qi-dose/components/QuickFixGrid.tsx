"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { QuickFix } from "../types";

interface QuickFixGridProps {
  quickFixes: QuickFix[];
  title: string;
  subtitle: string;
  onSelect: (id: string) => void;
}

export function QuickFixGrid({ quickFixes, title, subtitle, onSelect }: QuickFixGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickFixes.map((fix) => (
          <motion.button
            key={fix.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden text-left"
            onClick={() => onSelect(fix.id)}
          >
            <div className="relative h-full p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-slate-300 overflow-hidden">
              <div className="relative z-10 flex flex-col h-full min-h-[180px]">
                <p className="text-sm font-medium text-slate-500 mb-2">{fix.title}</p>
                <h3 className="text-lg font-semibold text-slate-900 leading-tight mb-4">
                  {fix.movement}
                </h3>
                <div className="flex items-center gap-2 mt-auto">
                  <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                    <Play className="w-4 h-4 text-slate-700 fill-slate-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Start</span>
                </div>
              </div>

              {/* Exercise Illustration - Subtle */}
              <img
                src={fix.image}
                alt={fix.movement}
                className="absolute -bottom-6 -right-6 w-28 h-28 object-contain opacity-10 group-hover:opacity-15 transition-opacity duration-300"
              />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
