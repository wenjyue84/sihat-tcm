"use client";

import { motion } from "framer-motion";
import { COLORS } from "../constants";

interface PaginationDotsProps {
  currentIndex: number;
  total: number;
}

export function PaginationDots({ currentIndex, total }: PaginationDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className="h-2 rounded-full bg-white"
          animate={{
            width: currentIndex === index ? 24 : 8,
            opacity: currentIndex === index ? 1 : 0.4,
            backgroundColor: currentIndex === index ? COLORS.emeraldMedium : COLORS.white,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}
