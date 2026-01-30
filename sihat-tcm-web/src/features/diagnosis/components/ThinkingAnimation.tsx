"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Brain,
  User,
  Scale,
  Ruler,
  Activity,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { BasicInfoData } from "./BasicInfoForm";
import { useLanguage } from "@/stores/useAppStore";

interface ThinkingAnimationProps {
  basicInfo?: BasicInfoData;
  variant?: "compact" | "full";
}

export function ThinkingAnimation({ basicInfo, variant = "compact" }: ThinkingAnimationProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Calculate BMI if we have the data
  const calculateBMI = () => {
    if (!basicInfo?.weight || !basicInfo?.height) return null;
    const weightKg = parseFloat(basicInfo.weight);
    const heightM = parseFloat(basicInfo.height) / 100;
    if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) return null;
    return (weightKg / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return language === "zh" ? "偏瘦" : language === "ms" ? "Kurang berat" : "Underweight";
    if (bmi < 25) return language === "zh" ? "正常" : language === "ms" ? "Normal" : "Normal";
    if (bmi < 30)
      return language === "zh" ? "超重" : language === "ms" ? "Berlebihan berat" : "Overweight";
    return language === "zh" ? "肥胖" : language === "ms" ? "Obes" : "Obese";
  };

  const bmi = calculateBMI();

  // Build patient info cards based on available data
  const getPatientInfoCards = () => {
    if (!basicInfo) return [];

    const cards: { icon: any; label: string; value: string; color: string; bgColor: string }[] = [];

    // Name
    if (basicInfo.name) {
      cards.push({
        icon: User,
        label: language === "zh" ? "患者姓名" : language === "ms" ? "Nama Pesakit" : "Patient Name",
        value: basicInfo.name,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      });
    }

    // Age & Gender
    if (basicInfo.age) {
      const genderText =
        basicInfo.gender === "male"
          ? language === "zh"
            ? "男"
            : language === "ms"
              ? "Lelaki"
              : "Male"
          : basicInfo.gender === "female"
            ? language === "zh"
              ? "女"
              : language === "ms"
                ? "Perempuan"
                : "Female"
            : basicInfo.gender;
      cards.push({
        icon: Clock,
        label:
          language === "zh" ? "年龄与性别" : language === "ms" ? "Umur & Jantina" : "Age & Gender",
        value: `${basicInfo.age} ${language === "zh" ? "岁" : language === "ms" ? "tahun" : "years"}, ${genderText}`,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      });
    }

    // Weight
    if (basicInfo.weight) {
      cards.push({
        icon: Scale,
        label: language === "zh" ? "体重" : language === "ms" ? "Berat Badan" : "Weight",
        value: `${basicInfo.weight} kg`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      });
    }

    // Height
    if (basicInfo.height) {
      cards.push({
        icon: Ruler,
        label: language === "zh" ? "身高" : language === "ms" ? "Ketinggian" : "Height",
        value: `${basicInfo.height} cm`,
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      });
    }

    // BMI (calculated)
    if (bmi) {
      const bmiNum = parseFloat(bmi);
      cards.push({
        icon: Activity,
        label:
          language === "zh"
            ? "BMI 体质指数"
            : language === "ms"
              ? "Indeks Jisim Badan"
              : "BMI (Body Mass Index)",
        value: `${bmi} - ${getBMICategory(bmiNum)}`,
        color:
          bmiNum < 18.5
            ? "text-blue-600"
            : bmiNum < 25
              ? "text-green-600"
              : bmiNum < 30
                ? "text-yellow-600"
                : "text-red-600",
        bgColor:
          bmiNum < 18.5
            ? "bg-blue-50"
            : bmiNum < 25
              ? "bg-green-50"
              : bmiNum < 30
                ? "bg-yellow-50"
                : "bg-red-50",
      });
    }

    // Symptoms
    if (basicInfo.symptoms) {
      cards.push({
        icon: AlertCircle,
        label:
          language === "zh" ? "主要症状" : language === "ms" ? "Simptom Utama" : "Main Symptoms",
        value:
          basicInfo.symptoms.length > 50
            ? basicInfo.symptoms.substring(0, 47) + "..."
            : basicInfo.symptoms,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      });
    }

    // Duration
    if (basicInfo.symptomDuration) {
      cards.push({
        icon: Clock,
        label:
          language === "zh"
            ? "症状持续时间"
            : language === "ms"
              ? "Tempoh Simptom"
              : "Symptom Duration",
        value: basicInfo.symptomDuration,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      });
    }

    return cards;
  };

  const patientInfoCards = getPatientInfoCards();

  // Define thinking action messages
  const getThinkingActions = () => {
    const actions = {
      en: [
        "🔍 Reviewing patient profile...",
        "🧠 Applying TCM diagnostic principles...",
        "⚖️ Analyzing Yin-Yang balance...",
        "💫 Assessing Qi flow patterns...",
        "📋 Correlating symptoms...",
      ],
      zh: [
        "🔍 正在查阅患者资料...",
        "🧠 运用中医诊断原理...",
        "⚖️ 分析阴阳平衡...",
        "💫 评估气血运行...",
        "📋 综合分析症状...",
      ],
      ms: [
        "🔍 Menyemak profil pesakit...",
        "🧠 Menggunakan prinsip diagnosis TCM...",
        "⚖️ Menganalisis keseimbangan Yin-Yang...",
        "💫 Menilai aliran Qi...",
        "📋 Mengkorelasi simptom...",
      ],
    };
    return actions[language as keyof typeof actions] || actions.en;
  };

  const thinkingActions = getThinkingActions();

  // Combine patient info with thinking actions for rotation
  const allItems = [
    ...patientInfoCards.map((card, idx) => ({
      type: "info" as const,
      data: card,
      id: `info-${idx}`,
    })),
    ...thinkingActions.map((action, idx) => ({
      type: "action" as const,
      data: action,
      id: `action-${idx}`,
    })),
  ];

  // Rotate through items (patient info + thinking actions)
  useEffect(() => {
    if (allItems.length === 0) return;

    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % allItems.length);
        setFadeIn(true);
      }, 300);
    }, 2000); // Rotate every 2 seconds

    return () => clearInterval(interval);
  }, [allItems.length]);

  const currentItem = allItems[currentIndex] || allItems[0];

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg rounded-bl-none p-4 border border-emerald-200/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-emerald-700">
            {language === "zh"
              ? "医师正在分析..."
              : language === "ms"
                ? "Doktor sedang menganalisis..."
                : "Doctor is analyzing..."}
          </span>
        </div>

        {/* Current rotating item */}
        <div
          className={`min-h-[60px] transition-all duration-300 ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {currentItem?.type === "info" && currentItem.data && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${currentItem.data.bgColor} border border-white/50`}
            >
              <div className="p-2 bg-white rounded-full shadow-sm">
                {(() => {
                  const IconComponent = currentItem.data.icon;
                  return <IconComponent className={`w-5 h-5 ${currentItem.data.color}`} />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500">{currentItem.data.label}</p>
                <p className={`text-sm font-semibold ${currentItem.data.color} truncate`}>
                  {currentItem.data.value}
                </p>
              </div>
            </div>
          )}
          {currentItem?.type === "action" && (
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border border-emerald-100">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-sm text-stone-600 italic">{currentItem.data as string}</span>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {allItems.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex % 8 ? "w-4 bg-emerald-500" : "w-1.5 bg-emerald-200"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
      <div className="flex items-start gap-4 mb-4">
        {/* Animated brain icon */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-7 h-7 text-emerald-600" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full transform -translate-x-1/2" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-semibold text-emerald-800">
              {language === "zh"
                ? "医师正在分析您的健康状况..."
                : language === "ms"
                  ? "Doktor sedang menganalisis kesihatan anda..."
                  : "Doctor is analyzing your health profile..."}
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {language === "zh"
              ? "正在查阅并综合分析您提供的信息"
              : language === "ms"
                ? "Menyemak dan menganalisis maklumat anda"
                : "Reviewing and synthesizing your provided information"}
          </p>
        </div>
      </div>

      {/* Current rotating item - larger display */}
      <div
        className={`min-h-[80px] transition-all duration-300 ${
          fadeIn ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
      >
        {currentItem?.type === "info" && currentItem.data && (
          <div
            className={`flex items-center gap-4 p-4 rounded-xl ${currentItem.data.bgColor} border border-white shadow-sm`}
          >
            <div className="p-3 bg-white rounded-full shadow-sm">
              {(() => {
                const IconComponent = currentItem.data.icon;
                return <IconComponent className={`w-6 h-6 ${currentItem.data.color}`} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-500 font-medium">{currentItem.data.label}</p>
              <p className={`text-lg font-bold ${currentItem.data.color}`}>
                {currentItem.data.value}
              </p>
            </div>
          </div>
        )}
        {currentItem?.type === "action" && (
          <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl border border-emerald-100 shadow-sm">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            <span className="text-base text-stone-600">{currentItem.data as string}</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {allItems.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex % 10 ? "w-6 bg-emerald-500" : "w-2 bg-emerald-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
