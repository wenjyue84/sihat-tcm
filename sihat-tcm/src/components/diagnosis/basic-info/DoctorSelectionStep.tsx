import { motion } from "framer-motion";
import { Stethoscope, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DOCTOR_LEVELS, DoctorLevel } from "@/lib/doctorLevels";
import { useLanguage } from "@/stores/useAppStore";

interface DoctorSelectionStepProps {
  doctorLevel: DoctorLevel;
  setDoctorLevel: (level: DoctorLevel) => void;
}

export function DoctorSelectionStep({ doctorLevel, setDoctorLevel }: DoctorSelectionStepProps) {
  const { t } = useLanguage();

  // Get translated doctor level info
  const getDoctorLevelInfo = (level: DoctorLevel) => {
    const levelMap: Record<DoctorLevel, { name: string; description: string }> = {
      physician: {
        name: t.doctorLevels.physician.name,
        description: t.doctorLevels.physician.description,
      },
      expert: {
        name: t.doctorLevels.seniorPhysician.name,
        description: t.doctorLevels.seniorPhysician.description,
      },
      master: {
        name: t.doctorLevels.masterPhysician.name,
        description: t.doctorLevels.masterPhysician.description,
      },
    };
    return levelMap[level];
  };

  return (
    <div className="space-y-4">
      <Label className="text-muted-foreground font-medium flex items-center gap-2 text-lg">
        <Stethoscope className="w-5 h-5 text-primary" />
        {t.basicInfo.chooseTcmDoctor}
      </Label>
      <div className="space-y-3">
        {(Object.keys(DOCTOR_LEVELS) as DoctorLevel[]).map((level) => {
          const info = DOCTOR_LEVELS[level];
          const translatedInfo = getDoctorLevelInfo(level);
          const isSelected = doctorLevel === level;

          return (
            <motion.div
              key={level}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setDoctorLevel(level)}
              className={`
                                relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                                ${
                                  isSelected
                                    ? `${info.borderColor} ${info.bgColor} shadow-md`
                                    : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                                }
                            `}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{info.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-bold ${isSelected ? info.textColor : "text-foreground"}`}>
                    {translatedInfo.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {translatedInfo.description}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`h-6 w-6 rounded-full bg-gradient-to-r ${info.color} flex items-center justify-center`}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
