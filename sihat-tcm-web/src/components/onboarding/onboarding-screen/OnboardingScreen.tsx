"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOnboardingScreen } from "./hooks";
import { COLORS } from "./constants";
import {
  PaginationDots,
  MultiModalSlide,
  TrustSlide,
  TriageSlide,
  LanguageSlide,
} from "./components";

export function OnboardingScreen() {
  const {
    currentIndex,
    t,
    language,
    isLastSlide,
    totalSlides,
    handleNext,
    handleSkip,
    handleStart,
    handleLanguageChange,
  } = useOnboardingScreen();

  const renderSlide = () => {
    switch (currentIndex) {
      case 0:
        return <MultiModalSlide t={t} />;
      case 1:
        return <TrustSlide t={t} />;
      case 2:
        return <TriageSlide t={t} />;
      case 3:
        return (
          <LanguageSlide
            t={t}
            language={language}
            setLanguage={handleLanguageChange}
            onStart={handleStart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.emeraldDeep}, ${COLORS.emeraldDark}, #000000)`,
      }}
    >
      {/* Skip Button */}
      <AnimatePresence>
        {!isLastSlide && (
          <motion.button
            onClick={handleSkip}
            className="absolute top-8 right-6 z-10 px-4 py-2 text-white/60 hover:text-white transition-colors"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {t.skip}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Slide Content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-6 px-8 py-8 md:py-12">
        <PaginationDots currentIndex={currentIndex} total={totalSlides} />

        {/* Next Button (hidden on last slide) */}
        <AnimatePresence>
          {!isLastSlide && (
            <motion.button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/15 hover:bg-white/20 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-white font-medium">{t.next}</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
