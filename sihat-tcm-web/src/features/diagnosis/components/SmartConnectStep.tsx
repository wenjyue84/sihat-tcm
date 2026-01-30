"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Brain,
  Check,
  Smartphone,
  ArrowRight,
  Zap,
  Download,
  Wifi,
} from "lucide-react";
import { IoTConnectionWizard, IoTDeviceType } from "./IoTConnectionWizard";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { createClientServices } from "@/lib/services";
import { PractitionerList } from "./report/PractitionerList";
import Link from "next/link";

export interface SmartConnectData {
  pulseRate?: number | string;
  bloodPressure?: string;
  bloodOxygen?: number | string;
  bodyTemp?: number | string;
  hrv?: number | string;
  stressLevel?: number | string;
  // Removed imported health data as it is mobile only
}

interface SmartConnectStepProps {
  onComplete: (data: SmartConnectData) => void;
  onBack: () => void;
  initialData?: SmartConnectData;
}

// Simplified sections: Overview -> Manual Input
type SectionType = "overview" | "iot-metrics";

const healthMetrics = [
  {
    id: "pulse",
    key: "pulseRate",
    labelKey: "pulseRate",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-500",
    unit: "BPM",
  },
  {
    id: "bp",
    key: "bloodPressure",
    labelKey: "bloodPressure",
    icon: Activity,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-500",
    unit: "mmHg",
  },
  {
    id: "oxygen",
    key: "bloodOxygen",
    labelKey: "bloodOxygen",
    icon: Droplets,
    color: "from-cyan-500 to-teal-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    textColor: "text-cyan-500",
    unit: "%",
  },
  {
    id: "temp",
    key: "bodyTemp",
    labelKey: "temperature",
    icon: Thermometer,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-500",
    unit: "°C",
  },
  {
    id: "hrv",
    key: "hrv",
    labelKey: "hrv",
    icon: Activity,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-500",
    unit: "ms",
  },
  {
    id: "stress",
    key: "stressLevel",
    labelKey: "stressLevel",
    icon: Brain,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-500",
    unit: "Score",
  },
];

const sections: SectionType[] = ["overview", "iot-metrics"];

export function SmartConnectStep({ onComplete, onBack, initialData }: SmartConnectStepProps) {
  const { t } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();
  const [data, setData] = useState<SmartConnectData>(initialData || {});
  const [activeWizard, setActiveWizard] = useState<IoTDeviceType | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionType>("overview");
  const [showPractitioners, setShowPractitioners] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  // Ref pattern to allow stable callbacks
  const onCompleteRef = useRef(onComplete);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onBackRef.current = onBack;
  }, [onComplete, onBack]);

  useEffect(() => {
    if (showPractitioners && doctors.length === 0) {
      setLoadingDoctors(true);
      const fetchDoctors = async () => {
        try {
          const { data } = await createClientServices().practitioners.list();
          if (data) {
            setDoctors(
              data.map((d: any) => ({
                id: d.id,
                name: d.name,
                photo: d.photo,
                clinicName: d.clinic_name,
                specialties: d.specialties || [],
                address: d.address,
                phone: d.phone,
                experience: d.experience,
                wazeLink: d.waze_link,
                workingHours: d.working_hours,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching doctors:", error);
        } finally {
          setLoadingDoctors(false);
        }
      };
      fetchDoctors();
    }
  }, [showPractitioners, doctors.length]);

  const currentSectionIndex = sections.indexOf(currentSection);

  const handleDeviceConnect = (metricId: string) => {
    setActiveWizard(metricId as IoTDeviceType);
  };

  const handleDataReceived = (metricKey: string, value: any) => {
    setData((prev) => ({ ...prev, [metricKey]: value }));
    setActiveWizard(null);
  };

  const handleSubmit = useCallback(() => {
    // Check if any data field has a value
    const hasData = Object.values(data).some(
      (v) => v !== undefined && v !== "" && v !== null
    );

    if (!hasData) {
      setShowSkipConfirmation(true);
    } else {
      onCompleteRef.current(data);
    }
  }, [data]);

  const goToNextSection = useCallback(() => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < sections.length) {
      setCurrentSection(sections[nextIndex]);
    } else {
      handleSubmit();
    }
  }, [currentSectionIndex, handleSubmit]);

  const goToPreviousSection = useCallback(() => {
    const prevIndex = currentSectionIndex - 1;
    if (prevIndex >= 0) {
      setCurrentSection(sections[prevIndex]);
    } else {
      onBackRef.current();
    }
  }, [currentSectionIndex]);

  const handleSkip = useCallback(() => {
    onCompleteRef.current(data);
  }, [data]);

  // Sync with global navigation state
  useEffect(() => {
    const isLast = currentSection === "iot-metrics";

    setNavigationState({
      showNext: true,
      showBack: true,
      showSkip: true,
      canNext: true,
      onNext: isLast ? handleSubmit : goToNextSection,
      onBack: goToPreviousSection,
      onSkip: handleSkip,
    });
  }, [
    currentSection,
    handleSubmit,
    goToNextSection,
    goToPreviousSection,
    handleSkip,
    setNavigationState,
  ]);

  const filledCount = Object.values(data).filter(
    (v) => v !== undefined && v !== "" && v !== null
  ).length;

  // Section titles for the stepper
  const sectionTitles: Record<SectionType, string> = {
    overview: t.smartConnect.overview || "Overview",
    "iot-metrics": t.smartConnect.iotDevices || "Manual Input",
  };

  // Render section stepper
  const renderStepper = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 px-2">
      {sections.map((section, index) => {
        const isActive = index === currentSectionIndex;
        const isCompleted = index < currentSectionIndex;
        return (
          <div key={section} className="flex items-center">
            <button
              onClick={() => setCurrentSection(section)}
              className={`
                                flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold transition-all
                                ${isActive
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : isCompleted
                    ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                    : "bg-slate-700/50 text-slate-500 border border-slate-600/50"
                }
                            `}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
            </button>
            {index < sections.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-0.5 mx-1 ${isCompleted ? "bg-emerald-500/50" : "bg-slate-700/50"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Overview Section
  const renderOverviewSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 sm:p-6"
    >
      <div className="text-center mb-8">
        {/* Hero Illustration */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div
            className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"
            style={{ animationDuration: "3s" }}
          />
          <div className="relative z-10 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <Activity className="w-10 h-10 text-emerald-400" />
          </div>
          {/* Phone Icon */}
          <div className="absolute -bottom-2 -right-2 p-2 bg-slate-800 rounded-full border border-slate-700 shadow-lg z-20">
            <Smartphone className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">Connect Health Data</h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto mb-6">
          For automatic device syncing, please download our mobile app. On the web portal, you can
          manually enter your health readings.
        </p>

        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-300 max-w-sm mx-auto">
          <p className="font-semibold mb-1">Mobile App Exclusive</p>
          <p className="opacity-80">Automatic device detection is available on iOS and Android.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 max-w-md mx-auto">
        <Button
          onClick={goToNextSection}
          className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg active:scale-[0.98] transition-all rounded-xl border border-white/10 touch-manipulation"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base leading-none mb-1">Enter Data Manually</div>
              <div className="text-xs text-white/80">Input your pulse, BP, etc.</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/70" />
          </div>
        </Button>

        <Link href="/mobile-app" className="w-full">
          <Button
            variant="outline"
            className="w-full h-16 bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800 active:scale-[0.98] transition-all rounded-xl group touch-manipulation"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Download className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-base text-slate-200 group-hover:text-white leading-none mb-1">
                  Download Mobile App
                </div>
                <div className="text-xs text-slate-500 group-hover:text-blue-400/70">
                  iOS & Android
                </div>
              </div>
            </div>
          </Button>
        </Link>
      </div>
    </motion.div>
  );

  // IoT Metrics Section (Renamed to Manual Input)
  const renderIoTMetricsSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 sm:p-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Manual Health Data Input</h3>
        <p className="text-slate-400 text-sm">Tap a card to enter your readings manually</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {healthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const value = data[metric.key as keyof SmartConnectData];
          // Basic check: is there a value?
          const isFilled = value !== undefined && value !== null && value !== "";

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleDeviceConnect(metric.id)}
                className={`
                                    relative w-full min-h-[100px] p-3 rounded-xl border transition-all duration-300
                                    active:scale-[0.98] touch-manipulation
                                    ${isFilled
                    ? `${metric.bgColor} ${metric.borderColor} shadow-lg`
                    : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                  }
                                `}
              >
                {isFilled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                <div
                  className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center mb-2 mx-auto
                                    ${isFilled
                      ? `bg-gradient-to-br ${metric.color}`
                      : "bg-slate-700/50"
                    }
                                `}
                >
                  <Icon className={`w-5 h-5 ${isFilled ? "text-white" : metric.textColor}`} />
                </div>

                <p
                  className={`text-sm font-medium mb-1 ${isFilled ? metric.textColor : "text-slate-300"}`}
                >
                  {t.smartConnect[metric.labelKey as keyof typeof t.smartConnect]}
                </p>

                {isFilled ? (
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-lg font-bold text-white">{String(value)}</span>
                    <span className="text-xs text-slate-400">{metric.unit}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    Tap to enter
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Panel Practitioner Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
        <div className="flex gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg h-fit">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-1">Want higher accuracy?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Visit our{" "}
              <button
                onClick={() => setShowPractitioners(true)}
                className="font-semibold text-white hover:underline focus:outline-none hover:text-blue-200 transition-colors"
              >
                Panel Practitioners
              </button>{" "}
              listed in your final report. Our doctors use certified medical devices to measure your
              vitals with clinical accuracy, ensuring the best possible diagnosis for you.
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Metrics Entered</span>
          <span className="text-sm font-semibold text-emerald-400">
            {filledCount}/{healthMetrics.length}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${(filledCount / healthMetrics.length) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-white/10">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="relative p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30 relative">
              <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {t.smartConnect.smartConnect}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {sectionTitles[currentSection]}
              </h2>
            </div>
          </div>

          {/* Stepper */}
          {renderStepper()}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">
          {currentSection === "overview" && renderOverviewSection()}
          {currentSection === "iot-metrics" && renderIoTMetricsSection()}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 sm:p-6 border-t border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={goToPreviousSection}
          className="text-slate-400 hover:text-white hover:bg-white/10"
        >
          {t?.common?.back || "Back"}
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            {t?.common?.skip || "Skip"}
          </Button>

          <Button
            onClick={currentSection === "overview" ? goToNextSection : handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[100px]"
          >
            {currentSection === "overview" ? (t?.common?.next || "Next") : ((t?.common as any)?.complete || "Finish")}
          </Button>
        </div>
      </div>

      {/* Manual Input Wizard (formerly IoT Connection Wizard) */}
      {activeWizard && (
        <IoTConnectionWizard
          isOpen={true}
          onClose={() => setActiveWizard(null)}
          deviceType={activeWizard}
          onDataReceived={(value) => {
            const metric = healthMetrics.find((m) => m.id === activeWizard);
            if (metric) {
              handleDataReceived(metric.key, value);
            }
          }}
        />
      )}

      <Dialog open={showPractitioners} onOpenChange={setShowPractitioners}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-50">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Our Panel Practitioners</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PractitionerList doctors={doctors} loading={loadingDoctors} variants={{}} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
        <AlertDialogContent className="bg-slate-900 border-emerald-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t?.smartConnect?.skipConfirmationTitle || "No Health Data Entered"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {t?.smartConnect?.skipConfirmationMessage ||
                "You haven't entered any health readings. Inputting this data helps provide a more accurate diagnosis. Would you like to enter data or skip this step?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowSkipConfirmation(false)}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              {t?.smartConnect?.enterData || "Enter Data"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSkipConfirmation(false);
                onCompleteRef.current(data);
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {t?.common?.skip || "Skip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
