"use client";

import { motion } from "framer-motion";
import { BMIResult, getBMIPercentage } from "@/lib/healthMetrics";

interface BMIIndicatorProps {
  bmi: BMIResult;
  size?: number;
  showLabel?: boolean;
}

export function BMIIndicator({ bmi, size = 80, showLabel = true }: BMIIndicatorProps) {
  const percentage = getBMIPercentage(bmi.value);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={6}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bmi.color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* BMI value in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-lg font-bold"
              style={{ color: bmi.color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {bmi.value}
            </motion.div>
          </div>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: bmi.color }}>
            {bmi.label}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">BMI</div>
        </div>
      )}
    </div>
  );
}
