"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AnalyzingStage() {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-10 space-y-8"
    >
      <div className="relative h-24 w-24 mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-500 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-800">Decrypting Vital Patterns</h3>
        <p className="text-slate-500 animate-pulse">
          Our AI is correlating sound frequencies with TCM disharmonies...
        </p>
      </div>
    </motion.div>
  );
}
