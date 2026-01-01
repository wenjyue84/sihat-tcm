"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Activity, Droplets, Thermometer, Brain, Watch, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type IoTDeviceType = "pulse" | "bp" | "oxygen" | "temp" | "hrv" | "stress";

interface IoTDeviceData {
  value: number;
  unit?: string;
  timestamp?: string;
  quality?: "good" | "fair" | "poor";
  metadata?: Record<string, unknown>;
}

interface IoTConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: IoTDeviceType;
  onDataReceived: (value: IoTDeviceData) => void;
}

const deviceConfig = {
  pulse: {
    name: "Pulse Rate",
    icon: Heart,
    color: "text-rose-500",
    unit: "BPM",
    label: "Pulse Rate",
    placeholder: "e.g. 75",
    description:
      "Heart rate is the speed of the heartbeat measured by the number of contractions (beats) of the heart per minute (bpm).",
    normalRangeText: "60 - 100 BPM",
  },
  bp: {
    name: "Blood Pressure",
    icon: Activity,
    color: "text-blue-500",
    unit: "mmHg",
    label: "Blood Pressure",
    placeholder: "120/80",
    description:
      "Blood pressure is the pressure of circulating blood against the walls of blood vessels.",
    normalRangeText: "90/60 - 120/80 mmHg",
  },
  oxygen: {
    name: "Blood Oxygen",
    icon: Droplets,
    color: "text-cyan-500",
    unit: "%",
    label: "SpO2",
    placeholder: "e.g. 98",
    description:
      "Blood oxygen level is a measure of how much oxygen your red blood cells are carrying.",
    normalRangeText: "95% - 100%",
  },
  temp: {
    name: "Body Temperature",
    icon: Thermometer,
    color: "text-amber-500",
    unit: "°C",
    label: "Temperature",
    placeholder: "e.g. 36.5",
    description:
      "Body temperature is a measure of your body's ability to generate and get rid of heat.",
    normalRangeText: "36.1°C - 37.2°C",
  },
  hrv: {
    name: "Heart Rate Variability",
    icon: Activity,
    color: "text-purple-500",
    unit: "ms",
    label: "HRV",
    placeholder: "e.g. 50",
    description:
      "Heart rate variability is the physiological phenomenon of variation in the time interval between heartbeats.",
    normalRangeText: "20 - 70 ms",
  },
  stress: {
    name: "Stress Level",
    icon: Brain,
    color: "text-orange-500",
    unit: "Score",
    label: "Stress Score",
    placeholder: "e.g. 25",
    description:
      "Stress level is estimated based on your heart rate variability and other physiological data.",
    normalRangeText: "10 - 40",
  },
};

export function IoTConnectionWizard({
  isOpen,
  onClose,
  deviceType,
  onDataReceived,
}: IoTConnectionWizardProps) {
  const config = deviceConfig[deviceType];
  const Icon = config.icon;

  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceType === "bp") {
      if (systolic && diastolic) {
        onDataReceived({
          value: parseFloat(`${systolic}.${diastolic}`),
          unit: "mmHg",
          metadata: { systolic: parseFloat(systolic), diastolic: parseFloat(diastolic) },
        });
        onClose();
      }
    } else {
      if (value) {
        onDataReceived({
          value: parseFloat(value),
          unit: deviceConfig[deviceType].unit,
        });
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-w-md mx-auto bg-slate-950 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-400 text-base sm:text-lg">
            <Watch className="w-5 h-5" />
            Manual Input: {config.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Please enter your reading from your device.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 sm:py-6 relative">
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col p-4 sm:p-6 rounded-lg border border-slate-700 overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About {config.label}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExplanation(false)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{config.description}</p>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">
                      Normal Range
                    </span>
                    <span className="text-lg font-mono text-emerald-400">
                      {config.normalRangeText}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
              <div
                className={`p-3 sm:p-4 rounded-full bg-slate-900 border-2 ${config.color.replace("text-", "border-")}/50`}
              >
                <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${config.color}`} />
              </div>

              {deviceType === "bp" ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Systolic</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-20 sm:w-24 bg-slate-900 border-slate-700 text-center text-base sm:text-lg font-mono placeholder:text-slate-600 h-12"
                      autoFocus
                    />
                  </div>
                  <span className="text-xl sm:text-2xl text-slate-500 pt-5">/</span>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Diastolic</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-20 sm:w-24 bg-slate-900 border-slate-700 text-center text-base sm:text-lg font-mono placeholder:text-slate-600 h-12"
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 pt-5">{config.unit}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 justify-center w-full">
                  <Input
                    type="number"
                    step={deviceType === "temp" ? "0.1" : "1"}
                    placeholder={config.placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-28 sm:w-32 bg-slate-900 border-slate-700 text-center text-base sm:text-lg font-mono placeholder:text-slate-600 h-12"
                    autoFocus
                  />
                  <span className="text-xs sm:text-sm text-slate-500">{config.unit}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowExplanation(true)}
                className="flex-1 border border-slate-600 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-11 sm:h-10"
              >
                <Info className="w-4 h-4 mr-2" />
                Guide
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 sm:h-10"
                disabled={deviceType === "bp" ? !systolic || !diastolic : !value}
              >
                Save Reading
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
