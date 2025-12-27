import { motion } from "framer-motion";
import { Stethoscope, HeartPulse } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface DiagnosisCardProps {
  data: any;
  diagnosisText: string;
  constitutionText: string;
}

export function DiagnosisCard({ data, diagnosisText, constitutionText }: DiagnosisCardProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={item}>
      <GlassCard
        variant="elevated"
        intensity="medium"
        className="border-emerald-100/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50"
      >
        <div className="flex items-center gap-2 text-emerald-900 text-base md:text-lg font-semibold mb-4 border-b border-emerald-200/30 pb-2">
          <Stethoscope className="h-5 w-5" />
          TCM Diagnosis (辨证)
        </div>
        <div>
          <div className="text-xl md:text-2xl font-semibold text-emerald-900 mb-2">
            {diagnosisText}
          </div>
          {typeof data.diagnosis === "object" &&
            data.diagnosis !== null &&
            "secondary_patterns" in data.diagnosis &&
            Array.isArray((data.diagnosis as any).secondary_patterns) &&
            (data.diagnosis as any).secondary_patterns.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-emerald-700 font-medium">Secondary Patterns:</p>
                <p className="text-emerald-800">
                  {(data.diagnosis as any).secondary_patterns.join(", ")}
                </p>
              </div>
            )}
          {typeof data.diagnosis === "object" &&
            data.diagnosis !== null &&
            "affected_organs" in data.diagnosis &&
            Array.isArray((data.diagnosis as any).affected_organs) &&
            (data.diagnosis as any).affected_organs.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-emerald-700 font-medium">Affected Organs:</p>
                <p className="text-emerald-800">
                  {(data.diagnosis as any).affected_organs.join(", ")}
                </p>
              </div>
            )}
          <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm md:text-base mt-3 pt-3 border-t border-emerald-100/50">
            <HeartPulse className="h-4 w-4" />
            Constitution: {constitutionText}
          </div>
          {typeof data.constitution === "object" && data.constitution.description && (
            <p className="text-sm text-emerald-600 mt-1">{data.constitution.description}</p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
