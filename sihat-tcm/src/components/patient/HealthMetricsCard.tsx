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
        <div className="p-6">
          {/* Header */}
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Health Metrics</h2>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Height */}
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
              <Ruler className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="text-sm font-medium text-slate-600 mb-1">Height</div>
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
                    className="w-20 h-8 text-center text-lg font-bold"
                    placeholder="—"
                  />
                  <span className="text-xs text-slate-500">cm</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {height ? `${height} cm` : "—"}
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
              <Weight className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="text-sm font-medium text-slate-600 mb-1">Weight</div>
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
                    className="w-20 h-8 text-center text-lg font-bold"
                    placeholder="—"
                  />
                  <span className="text-xs text-slate-500">kg</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {weight ? `${weight} kg` : "—"}
                </div>
              )}
            </div>

            {/* BMI */}
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
              <Activity className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="text-sm font-medium text-slate-600 mb-1">BMI</div>
              {bmiResult ? (
                <BMIIndicator bmi={bmiResult} size={64} showLabel={true} />
              ) : (
                <div className="text-2xl font-bold text-slate-400">—</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

