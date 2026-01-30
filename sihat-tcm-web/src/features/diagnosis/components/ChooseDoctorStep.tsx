"use client";

import { motion } from "framer-motion";
import { Stethoscope, Check, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDoctorLevel } from "@/stores/useAppStore";
import { DOCTOR_LEVELS, DoctorLevel } from "@/lib/doctorLevels";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { useEffect, useRef, useCallback } from "react";

interface ChooseDoctorStepProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function ChooseDoctorStep({ onComplete, onBack }: ChooseDoctorStepProps) {
  const { doctorLevel, setDoctorLevel, isLoadingDefault } = useDoctorLevel();
  const { t, language } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();

  // Sync with global navigation
  // Use refs to keep callbacks fresh without triggering effect updates
  const onCompleteRef = useRef(onComplete);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onBackRef.current = onBack;
  }, [onComplete, onBack]);

  const handleNext = useCallback(() => {
    onCompleteRef.current();
  }, []);

  const handleBack = useCallback(() => {
    onBackRef.current?.();
  }, []);

  // Sync with global navigation
  useEffect(() => {
    setNavigationState({
      onNext: handleNext,
      onBack: onBack ? handleBack : undefined,
      showNext: true,
      showBack: !!onBack,
      showSkip: false,
    });
  }, [setNavigationState, handleNext, handleBack, !!onBack]);

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

  // Translations for this step
  const stepTranslations = {
    en: {
      title: "Choose Your Doctor",
      subtitle:
        "Select the level of TCM practitioner for your consultation. You can change this from the default setting.",
      defaultFromAdmin: "Default from settings",
      proceed: "Continue",
    },
    zh: {
      title: "选择医师",
      subtitle: "选择问诊的中医医师级别。您可以根据需要更改默认设置。",
      defaultFromAdmin: "默认设置",
      proceed: "继续",
    },
    ms: {
      title: "Pilih Doktor Anda",
      subtitle:
        "Pilih tahap pengamal TCM untuk perundingan anda. Anda boleh menukar dari tetapan lalai.",
      defaultFromAdmin: "Lalai dari tetapan",
      proceed: "Teruskan",
    },
  };

  const currentTranslations =
    stepTranslations[language as keyof typeof stepTranslations] || stepTranslations.en;

  if (isLoadingDefault) {
    return (
      <Card className="p-8 bg-white/90 backdrop-blur-sm border-none shadow-lg">
        <div className="flex items-center justify-center gap-3 text-stone-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 bg-white/90 backdrop-blur-sm border-none shadow-lg md:mb-0">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white mb-4 shadow-lg">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">{currentTranslations.title}</h2>
        <p className="text-stone-500 max-w-md mx-auto">{currentTranslations.subtitle}</p>
      </div>

      {/* Doctor Level Selection */}
      <div className="space-y-3 mb-8">
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
                                    : "border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50"
                                }
                            `}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{info.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${isSelected ? info.textColor : "text-stone-700"}`}>
                      {translatedInfo.name}
                    </h3>
                    {language !== "zh" && (
                      <span className="text-xs text-stone-400">({info.nameZh})</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{translatedInfo.description}</p>
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

      {/* Info Note */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-6 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-stone-500">
          {currentTranslations.defaultFromAdmin}:{" "}
          <span className="font-medium">{getDoctorLevelInfo(doctorLevel).name}</span>
        </p>
      </div>

      {/* Navigation Buttons - Hidden on mobile as handled by BottomNavigation */}
      <div className="hidden md:block md:mt-8">
        <div className="flex gap-3">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="border-stone-200 text-stone-600 hover:bg-stone-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t.common.back}
            </Button>
          )}
          <Button
            onClick={onComplete}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
          >
            {currentTranslations.proceed}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
