"use client";

import { motion } from "framer-motion";
import { Rocket, ArrowRight, Check } from "lucide-react";
import { LANGUAGE_OPTIONS } from "../../constants";
import type { OnboardingTranslations, SupportedLanguage } from "../../types";

interface LanguageSlideProps {
  t: OnboardingTranslations;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onStart: () => void;
}

export function LanguageSlide({ t, language, setLanguage, onStart }: LanguageSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Rocket Icon */}
      <motion.div
        className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-amber-500/20"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <Rocket className="w-10 h-10 text-amber-400" />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mb-2 text-3xl font-bold text-white md:text-4xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t.getStarted}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="max-w-md mb-8 text-base text-white/70 md:text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t.getStartedSub}
      </motion.p>

      {/* Language Options */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-sm mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {LANGUAGE_OPTIONS.map((lang, index) => (
          <motion.button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
              language === lang.code
                ? "bg-emerald-500/20 border-emerald-500"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span
              className={`flex-1 text-left text-base font-medium ${
                language === lang.code ? "text-emerald-400" : "text-white"
              }`}
            >
              {lang.name}
            </span>
            {language === lang.code && <Check className="w-5 h-5 text-emerald-400" />}
          </motion.button>
        ))}
      </motion.div>

      {/* Start Button */}
      <motion.button
        onClick={onStart}
        className="relative w-full max-w-sm overflow-hidden rounded-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, scale: [1, 1.02, 1] }}
        transition={{
          y: { delay: 0.9 },
          opacity: { delay: 0.9 },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Button Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600" />

        {/* Inner Highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 rounded-t-full" />

        {/* Button Content */}
        <div className="relative flex items-center justify-center gap-3 px-8 py-4">
          <span className="text-lg font-bold tracking-wide text-emerald-900 uppercase">
            {t.start}
          </span>
          <ArrowRight className="w-6 h-6 text-emerald-900" />
        </div>
      </motion.button>
    </motion.div>
  );
}
