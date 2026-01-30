"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorToastProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorToast({ error, onDismiss }: ErrorToastProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 max-w-md w-full"
        >
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="font-bold flex-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
          >
            &times;
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
