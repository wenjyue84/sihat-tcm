"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, Target, Shield, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import Image from "next/image";

const STORAGE_KEY = "sihat-tcm-welcome-seen";

interface MobileWelcomeSheetProps {
  onDismiss?: () => void;
}

export function MobileWelcomeSheet({ onDismiss }: MobileWelcomeSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const { t, language } = useLanguage();

  // Check localStorage on mount
  useEffect(() => {
    try {
      const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
      if (!hasSeenWelcome) {
        // Small delay to let the page render first
        const timer = setTimeout(() => setIsVisible(true), 300);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable (SSR/Incognito) - show the sheet
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore localStorage errors
    }
    // Wait for animation to complete
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 400);
  };

  // Get translations with fallbacks
  const welcomeTexts = {
    statusBadge:
      language === "zh"
        ? "AI诊断引擎已激活"
        : language === "ms"
          ? "Enjin Diagnostik AI Aktif"
          : "AI Diagnostic Engine Active",
    title: language === "zh" ? "您的私人" : language === "ms" ? "Doktor TCM" : "Your Personal",
    titleHighlight:
      language === "zh" ? "中医师" : language === "ms" ? "Peribadi Anda" : "TCM Doctor",
    subtitle:
      language === "zh"
        ? "完成问诊步骤，获取基于传统智慧与现代AI的综合健康分析。"
        : language === "ms"
          ? "Lengkapkan langkah konsultasi untuk menerima analisis kesihatan komprehensif berdasarkan kebijaksanaan tradisional dan AI moden."
          : "Complete the consultation steps to receive a comprehensive health analysis based on traditional wisdom and modern AI.",
    stat1Value: language === "zh" ? "3分钟" : language === "ms" ? "3-min" : "3-min",
    stat1Label:
      language === "zh" ? "平均时长" : language === "ms" ? "Purata Tempoh" : "Avg. Duration",
    stat2Value: "95%",
    stat2Label: language === "zh" ? "准确率" : language === "ms" ? "Ketepatan" : "Accuracy",
    privacyNote:
      language === "zh"
        ? "*数据安全处理。AI分析包括面部、舌头和声音。"
        : language === "ms"
          ? "*Data diproses dengan selamat. Penggunaan AI melibatkan analisis Wajah, Lidah, dan Suara."
          : "*Data is processed securely. AI usage involves Face, Tongue, and Voice analysis.",
    ctaButton:
      language === "zh"
        ? "开始问诊"
        : language === "ms"
          ? "Mulakan Konsultasi"
          : "Start Consultation",
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isAnimatingOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] lg:hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isAnimatingOut ? 0 : 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isAnimatingOut ? "100%" : 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4,
            }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 rounded-t-3xl overflow-hidden shadow-2xl"
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="px-6 pb-24 pt-2 space-y-6">
              {/* Logo & Status Badge */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/30 backdrop-blur-sm"
                >
                  <Image
                    src="/logo.png"
                    alt="Sihat TCM"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 backdrop-blur-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {welcomeTexts.statusBadge}
                  </span>
                </motion.div>
              </div>

              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-1">
                  {welcomeTexts.title}{" "}
                  <span className="text-emerald-400">{welcomeTexts.titleHighlight}</span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">{welcomeTexts.subtitle}</p>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-400">
                      {welcomeTexts.stat1Value}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {welcomeTexts.stat1Label}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-400">
                      {welcomeTexts.stat2Value}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {welcomeTexts.stat2Label}
                  </div>
                </div>
              </motion.div>

              {/* Privacy Note */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className="flex items-start gap-2 text-xs text-slate-500 px-2"
              >
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" />
                <span>{welcomeTexts.privacyNote}</span>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDismiss}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-lg shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                {welcomeTexts.ctaButton}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Decorative Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
