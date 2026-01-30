"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Stethoscope } from "lucide-react";
import type { OnboardingTranslations } from "../../types";

interface TrustSlideProps {
  t: OnboardingTranslations;
}

export function TrustSlide({ t }: TrustSlideProps) {
  const bulletPoints = [t.doctorReview, t.guidedQuestions, t.notScraped];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Icon */}
      <motion.div
        className="flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-emerald-500/20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <ShieldCheck className="w-12 h-12 text-emerald-400" />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mb-4 text-3xl font-bold text-white md:text-4xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t.realDoctors}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="max-w-md mb-8 text-base text-white/70 md:text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t.realDoctorsSub}
      </motion.p>

      {/* Bullet Points */}
      <motion.div
        className="flex flex-col gap-3 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {bulletPoints.map((point, index) => (
          <motion.p
            key={index}
            className="text-sm text-white/80 md:text-base text-left"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            {point}
          </motion.p>
        ))}
      </motion.div>

      {/* Practitioner Badge */}
      <motion.div
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Stethoscope className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">{t.practitionerBacked}</span>
      </motion.div>
    </motion.div>
  );
}
