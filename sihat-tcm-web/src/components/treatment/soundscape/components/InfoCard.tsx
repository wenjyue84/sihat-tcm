"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getElementDescription, SoundscapeConfig } from "@/lib/soundscapeUtils";

interface InfoCardProps {
  show: boolean;
  config: SoundscapeConfig | null;
  language: string;
}

export function InfoCard({ show, config, language }: InfoCardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-900 leading-relaxed">
                Based on your TCM diagnosis, this soundscape combines Five Elements theory with
                therapeutic sounds. Each element corresponds to specific organs and can help restore
                balance through sound frequencies.
              </p>

              {/* TCM Sleep Connection */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  TCM & Sleep Connection
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed mb-2">
                  <strong>Water Element (肾, Kidney):</strong> In TCM, the Kidney (Water element)
                  governs sleep and rest. Water sounds help calm the Shen (spirit) and promote deep,
                  restorative sleep by nourishing Yin energy.
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Rain Sounds:</strong> Rain creates white noise that masks disturbances and
                  aligns with Water&apos;s cooling, calming nature. The steady rhythm helps regulate
                  the Heart-Kidney axis, essential for quality sleep.
                </p>
              </div>

              {config && (
                <div className="mt-4 space-y-2 text-sm text-emerald-800">
                  <p>
                    <strong>Primary:</strong>{" "}
                    {getElementDescription(config.primary, language as "en" | "zh" | "ms")}
                  </p>
                  {config.secondary && (
                    <p>
                      <strong>Secondary:</strong>{" "}
                      {getElementDescription(config.secondary, language as "en" | "zh" | "ms")}
                    </p>
                  )}
                  {config.ambient && config.ambient !== "none" && (
                    <p>
                      <strong>Ambient:</strong>{" "}
                      {config.ambient.charAt(0).toUpperCase() + config.ambient.slice(1)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
