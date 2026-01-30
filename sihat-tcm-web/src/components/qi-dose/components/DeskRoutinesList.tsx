"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { DeskRoutine } from "../types";

interface DeskRoutinesListProps {
  routines: DeskRoutine[];
  title: string;
  onSelect: (id: string) => void;
}

export function DeskRoutinesList({ routines, title, onSelect }: DeskRoutinesListProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">{title}</h2>
      <div className="space-y-2">
        {routines.map((routine) => (
          <motion.button
            key={routine.id}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(routine.id)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                <routine.icon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-0.5">{routine.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-1">{routine.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                {Math.floor(routine.duration / 60)}m
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
