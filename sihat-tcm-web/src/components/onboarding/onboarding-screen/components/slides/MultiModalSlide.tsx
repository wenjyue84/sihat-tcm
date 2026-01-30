"use client";

import { motion } from "framer-motion";
import { Eye, Hand, Ear, Sparkles } from "lucide-react";
import type { OnboardingTranslations } from "../../types";

interface MultiModalSlideProps {
  t: OnboardingTranslations;
}

export function MultiModalSlide({ t }: MultiModalSlideProps) {
  const icons = [
    { Icon: Eye, label: t.tongueLabel },
    { Icon: Hand, label: t.pulseLabel },
    { Icon: Ear, label: t.voiceLabel },
  ];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Trust Badge */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-400">{t.chatGptCant}</span>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t.multiModal}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="max-w-md mb-10 text-base text-white/70 md:text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t.multiModalSub}
      </motion.p>

      {/* Triple Icon Row */}
      <motion.div
        className="flex items-center justify-center gap-8 md:gap-12"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {icons.map((item, index) => (
          <motion.div
            key={item.label}
            className="flex flex-col items-center gap-3"
            whileHover={{ scale: 1.1 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <item.Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <span className="text-sm font-medium text-white/70">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
