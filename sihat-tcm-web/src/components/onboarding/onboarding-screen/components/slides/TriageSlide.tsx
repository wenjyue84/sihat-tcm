"use client";

import { motion } from "framer-motion";
import { ClipboardList, HelpCircle, Share2, Wallet } from "lucide-react";
import type { OnboardingTranslations } from "../../types";

interface TriageSlideProps {
  t: OnboardingTranslations;
}

export function TriageSlide({ t }: TriageSlideProps) {
  const features = [
    { Icon: HelpCircle, text: t.triageFeature, highlight: false },
    { Icon: Share2, text: t.reportFeature, highlight: false },
    { Icon: Wallet, text: t.saveFeature, highlight: true },
  ];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Icon with Pulse Animation */}
      <motion.div
        className="flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-emerald-500/20"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      >
        <ClipboardList className="w-12 h-12 text-emerald-400" />
      </motion.div>

      {/* Title with Serious Styling */}
      <motion.h1
        className="mb-4 text-3xl font-bold text-amber-400 md:text-4xl"
        style={{ textShadow: "0 2px 8px rgba(245, 158, 11, 0.3)" }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t.triage}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="max-w-md mb-8 text-base text-white/70 md:text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t.triageSub}
      </motion.p>

      {/* Feature Cards */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              feature.highlight ? "bg-amber-500/20 border border-amber-500/30" : "bg-white/5"
            }`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.15 }}
          >
            <feature.Icon
              className={`w-6 h-6 ${feature.highlight ? "text-amber-400" : "text-emerald-400"}`}
            />
            <span
              className={`text-sm font-medium ${
                feature.highlight ? "text-amber-400" : "text-white/80"
              }`}
            >
              {feature.text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
