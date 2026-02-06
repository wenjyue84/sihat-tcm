"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Ruler, Weight, Activity } from "lucide-react";
import { calculateBMI, BMIResult } from "@/lib/healthMetrics";
import { BMIIndicator } from "./BMIIndicator";
import { Input } from "@/components/ui/input";

interface HealthMetricsCardProps {
  height?: string;
  weight?: string;
  onUpdate: (field: string, value: string) => Promise<void>;
  editing?: boolean;
}

export function HealthMetricsCard({
  height,
  weight,
  onUpdate,
  editing = false,
}: HealthMetricsCardProps) {
  const [localHeight, setLocalHeight] = useState(height || "");
  const [localWeight, setLocalWeight] = useState(weight || "");

  // Update local state when props change (only when not editing)
  useEffect(() => {
    if (!editing) {
      setLocalHeight(height || "");
      setLocalWeight(weight || "");
    }
  }, [height, weight, editing]);

  const heightNum = localHeight ? parseFloat(localHeight) : null;
  const weightNum = localWeight ? parseFloat(localWeight) : null;
  const bmiResult: BMIResult | null =
    heightNum && weightNum ? calculateBMI(heightNum, weightNum) : null;

  const handleSave = async (field: string, value: string) => {
    if (value !== (field === "height" ? height : weight)) {
      await onUpdate(field, value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <h2 className="text-lg sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6">
            Health Metrics
          </h2>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            {/* Height */}
            <div className="flex flex-col items-center p-2 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <Ruler className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 mb-1 sm:mb-2" />
              <div className="text-[10px] sm:text-sm font-medium text-slate-600 mb-0.5 sm:mb-1">
                Height
              </div>
              {editing ? (
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    value={localHeight}
                    onChange={(e) => setLocalHeight(e.target.value)}
                    onBlur={(e) => handleSave("height", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-14 sm:w-20 h-7 sm:h-8 text-center text-sm sm:text-lg font-bold"
                    placeholder="—"
                  />
                  <span className="text-[10px] sm:text-xs text-slate-500">cm</span>
                </div>
              ) : (
                <div className="text-base sm:text-2xl font-bold text-slate-900">
                  {height ? (
                    <>
                      <span>{height}</span>{" "}
                      <span className="text-[10px] sm:text-sm font-medium text-slate-500">cm</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col items-center p-2 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <Weight className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 mb-1 sm:mb-2" />
              <div className="text-[10px] sm:text-sm font-medium text-slate-600 mb-0.5 sm:mb-1">
                Weight
              </div>
              {editing ? (
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    value={localWeight}
                    onChange={(e) => setLocalWeight(e.target.value)}
                    onBlur={(e) => handleSave("weight", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-14 sm:w-20 h-7 sm:h-8 text-center text-sm sm:text-lg font-bold"
                    placeholder="—"
                  />
                  <span className="text-[10px] sm:text-xs text-slate-500">kg</span>
                </div>
              ) : (
                <div className="text-base sm:text-2xl font-bold text-slate-900">
                  {weight ? (
                    <>
                      <span>{weight}</span>{" "}
                      <span className="text-[10px] sm:text-sm font-medium text-slate-500">kg</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              )}
            </div>

            {/* BMI */}
            <div className="flex flex-col items-center p-2 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 mb-1 sm:mb-2" />
              <div className="text-[10px] sm:text-sm font-medium text-slate-600 mb-0.5 sm:mb-1">
                BMI
              </div>
              {bmiResult ? (
                <div className="scale-75 sm:scale-100 origin-center">
                  <BMIIndicator bmi={bmiResult} size={64} showLabel={true} />
                </div>
              ) : (
                <div className="text-base sm:text-2xl font-bold text-slate-400">—</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
