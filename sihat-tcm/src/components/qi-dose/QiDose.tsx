"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Trophy,
  BookOpen,
  Clock,
  Wind,
  Eye,
  Zap,
  Play,
  Shield,
  ChevronRight,
  Search,
  Dumbbell,
  Coffee,
  Leaf,
  Pause,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/stores/useAppStore";
import { QiGarden } from "./QiGarden";

interface QuickFix {
  id: string;
  title: string;
  ailment: string;
  movement: string;
  duration: number;
  color: string;
  image: string;
}

interface DeskRoutine {
  id: string;
  title: string;
  desc: string;
  duration: number; // in seconds
  icon: React.ElementType;
  steps: string[];
  color?: string;
}

export function QiDose() {
  const { t } = useLanguage();
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [isExercising, setIsExercising] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showGarden, setShowGarden] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDeskRoutine, setSelectedDeskRoutine] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const quickFixes: QuickFix[] = [
    {
      id: "tired",
      title: t.qiDose.feelingTired,
      ailment: "Regulates Triple Burner",
      movement: "Two Hands Hold Up the Heavens",
      duration: 60,
      color: "from-amber-400 to-orange-500",
      image: "/images/qi-dose/hold-heavens.png",
    },
    {
      id: "back",
      title: t.qiDose.backPain,
      ailment: "Strengthens Kidneys",
      movement: "Two Hands Touch the Feet",
      duration: 60,
      color: "from-blue-400 to-indigo-500",
      image: "/images/qi-dose/touch-feet.png",
    },
    {
      id: "stress",
      title: t.qiDose.stressed,
      ailment: "Opens Lungs/Chest",
      movement: "Drawing the Bow to Shoot the Hawk",
      duration: 60,
      color: "from-emerald-400 to-teal-500",
      image: "/images/qi-dose/draw-bow.png",
    },
  ];

  const deskRoutines: DeskRoutine[] = [
    {
      id: "meridianSlap",
      title: t.qiDose.meridianSlap,
      desc: t.qiDose.meridianSlapDesc,
      duration: 180, // 3 minutes
      icon: Zap,
      steps: [
        "Sit or stand comfortably with your back straight",
        "Start with your right arm: Use your left palm to gently slap from your right shoulder down to your wrist",
        "Slap along the outer side of your arm (Large Intestine meridian) - 10 times",
        "Slap along the inner side of your arm (Lung meridian) - 10 times",
        "Switch to your left arm: Use your right palm to slap from shoulder to wrist",
        "Repeat the outer and inner sides - 10 times each",
        "Now slap your legs: Start from your hips down to your ankles",
        "Slap the front of your thighs and shins - 10 times each leg",
        "Slap the back of your thighs and calves - 10 times each leg",
        "Finish by gently patting your chest and abdomen in circular motions",
        "Take 3 deep breaths and feel the energy flowing through your meridians",
      ],
    },
    {
      id: "ironOx",
      title: t.qiDose.ironOx,
      desc: t.qiDose.ironOxDesc,
      duration: 300, // 5 minutes
      icon: Dumbbell,
      steps: [
        "Stand with feet shoulder-width apart, knees slightly bent",
        "Place your hands on your lower back (kidney area) with palms facing outward",
        "Slowly lean forward from your hips, keeping your back straight",
        "As you lean forward, imagine an ox plowing the earth - move slowly and deliberately",
        "Lean forward until you feel a gentle stretch in your hamstrings and lower back",
        "Hold this position for 3 deep breaths",
        "Slowly return to standing, pushing through your heels",
        "Repeat the forward lean 5 times, moving slowly with each breath",
        "After the 5th repetition, place your hands on your lower abdomen",
        "Massage your abdomen in clockwise circles - 20 times",
        "Then massage counterclockwise - 20 times",
        "This helps move stagnant Qi in your digestive system",
        "Finish by standing tall and taking 5 deep breaths, feeling your Dan Tian fill with energy",
      ],
    },
    {
      id: "digitalDetox",
      title: t.qiDose.digitalDetox,
      desc: t.qiDose.digitalDetoxDesc,
      duration: 120, // 2 minutes
      icon: Eye,
      steps: [
        "Sit comfortably and close your eyes gently",
        "Rub your palms together vigorously until they feel warm",
        "Place your warm palms over your closed eyes (without pressing)",
        "Feel the warmth and energy transfer to your eyes - hold for 30 seconds",
        "Remove your hands and slowly open your eyes",
        "Look into the distance (out a window if possible) for 10 seconds",
        "Look at something close for 10 seconds",
        "Repeat the distance/near focus 5 times",
        "Now massage the acupressure points around your eyes:",
        "Use your index fingers to press gently on the inner corners of your eyes (Jingming point)",
        "Hold for 5 seconds, then release",
        "Move to the outer corners (Tongziliao point) - press for 5 seconds",
        "Press below your eyes at the midpoint (Chengqi point) - 5 seconds",
        "Press above your eyebrows at the midpoint (Yuyao point) - 5 seconds",
        "Finish by gently massaging your temples in circular motions - 10 times each side",
        "Close your eyes and take 3 deep breaths, feeling refreshed",
      ],
    },
  ];

  // Get the selected routine details
  const currentRoutine = selectedRoutine ? quickFixes.find((f) => f.id === selectedRoutine) : null;
  const currentDeskRoutine = selectedDeskRoutine
    ? deskRoutines.find((r) => r.id === selectedDeskRoutine)
    : null;
  const activeRoutine = currentRoutine || currentDeskRoutine;
  const isDeskRoutine = !!selectedDeskRoutine;

  // Timer effect
  useEffect(() => {
    if (isExercising && !isPaused && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsExercising(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isExercising, isPaused, countdown]);

  // Reset states when routine changes
  useEffect(() => {
    if (selectedRoutine) {
      const routine = quickFixes.find((f) => f.id === selectedRoutine);
      if (routine) {
        setCountdown(routine.duration);
        setIsExercising(false);
        setIsPaused(false);
        setIsCompleted(false);
        setCurrentStep(0);
      }
    }
    if (selectedDeskRoutine) {
      const routine = deskRoutines.find((r) => r.id === selectedDeskRoutine);
      if (routine) {
        setCountdown(routine.duration);
        setIsExercising(false);
        setIsPaused(false);
        setIsCompleted(false);
        setCurrentStep(0);
      }
    }
  }, [selectedRoutine, selectedDeskRoutine]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
    };
  };

  const handleStartExercise = () => {
    if (activeRoutine) {
      setIsExercising(true);
      setIsPaused(false);
      setCountdown(activeRoutine.duration);
      setCurrentStep(0);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    setIsExercising(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentStep(0);
    if (activeRoutine) {
      setCountdown(activeRoutine.duration);
    }
  };

  const handleClose = () => {
    setIsExercising(false);
    setIsPaused(false);
    setIsCompleted(false);
    setSelectedRoutine(null);
    setSelectedDeskRoutine(null);
    setCurrentStep(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleComplete = () => {
    handleClose();
    // Here you could add logic to update user progress, unlock achievements, etc.
  };

  return (
    <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-2">
            {t.qiDose.subtitle}
          </h1>
          <p className="text-lg text-slate-600 font-normal">
            {t.qiDose.title}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">
              {t.qiDose.streak}
            </p>
            <p className="text-lg font-semibold text-slate-900">5 Days</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Tab Switcher - Apple-style Segmented Control */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setShowGarden(false)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            !showGarden
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Wind className="w-4 h-4" />
          {t.qiDose.practicesTab || "Practices"}
        </button>
        <button
          onClick={() => setShowGarden(true)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            showGarden
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Leaf className="w-4 h-4" />
          {t.qiDose.gardenTab || "Qi Garden"}
        </button>
      </div>

      {/* Conditionally Render Main Content */}
      {showGarden ? (
        <QiGarden />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* 8-Minute Brocade (Quick Fixes) */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                    {t.qiDose.eightMinuteBrocade}
                  </h2>
                  <p className="text-sm text-slate-500">{t.qiDose.quickFix}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickFixes.map((fix) => (
                  <motion.button
                    key={fix.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative overflow-hidden text-left"
                    onClick={() => setSelectedRoutine(fix.id)}
                  >
                    <div className="relative h-full p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-slate-300 overflow-hidden">
                      <div className="relative z-10 flex flex-col h-full min-h-[180px]">
                        <p className="text-sm font-medium text-slate-500 mb-2">{fix.title}</p>
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight mb-4">
                          {fix.movement}
                        </h3>
                        <div className="flex items-center gap-2 mt-auto">
                          <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                            <Play className="w-4 h-4 text-slate-700 fill-slate-700" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">Start</span>
                        </div>
                      </div>

                      {/* Exercise Illustration - Subtle */}
                      <img
                        src={fix.image}
                        alt={fix.movement}
                        className="absolute -bottom-6 -right-6 w-28 h-28 object-contain opacity-10 group-hover:opacity-15 transition-opacity duration-300"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Desk Friendly Circuits */}
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                {t.qiDose.deskFriendly}
              </h2>
              <div className="space-y-2">
                {deskRoutines.map((routine) => (
                  <motion.button
                    key={routine.id}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedDeskRoutine(routine.id);
                      setSelectedRoutine(null);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <routine.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-0.5">{routine.title}</h4>
                        <p className="text-sm text-slate-500 line-clamp-1">{routine.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                        {Math.floor(routine.duration / 60)}m
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          </div>

          {/* Gamification & Info Sidebar */}
          <div className="space-y-6">
            {/* Dan Tian Filling Visualization */}
            <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-slate-600" />
                  {t.qiDose.danTianFilling}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {t.qiDose.danTianDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-8">
                <div className="relative w-36 h-36 mx-auto">
                  {/* Subtle background glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-slate-100 rounded-full blur-2xl"
                  />
                  {/* SVG Progress ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(241 245 249)"
                      strokeWidth="6"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(51 65 85)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 0.78 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-semibold text-slate-900">78%</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Filled</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlocked Scrolls */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  {t.qiDose.unlockScrolls}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">
                      Day 7 Reward
                    </p>
                    <h5 className="font-semibold text-slate-900">Turtle Breath Scroll</h5>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">{t.qiDose.nextScroll}</span>
                    <span className="text-slate-500">2/7 {t.qiDose.minutes}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "30%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-slate-600 rounded-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Highlight: X-Ray Vision */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {t.qiDose.xRayVision}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-2">See Your Qi Flow</h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Overlay anatomical meridian lines to see exactly which organs you're healing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-medium border-slate-200 hover:bg-slate-50"
                >
                  Preview Feature
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Routine Execution Modal */}
      <AnimatePresence>
        {activeRoutine && (selectedRoutine || selectedDeskRoutine) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isExercising) {
                handleClose();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-xl border border-slate-200/50"
            >
              {isCompleted ? (
                // Completion Screen
                <div className="p-10 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="w-8 h-8 text-slate-700" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                      Exercise Complete
                    </h3>
                    <p className="text-slate-600 max-w-sm mx-auto">
                      Great job completing{" "}
                      {isDeskRoutine ? currentDeskRoutine?.title : currentRoutine?.movement}. Your
                      energy is flowing!
                    </p>
                  </div>
                  <Button
                    className="w-full py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={handleComplete}
                  >
                    Done
                  </Button>
                </div>
              ) : isExercising ? (
                // Exercise in Progress Screen
                <div className="p-10 text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isDeskRoutine && currentDeskRoutine ? (
                        <currentDeskRoutine.icon className="w-8 h-8 text-slate-700" />
                      ) : (
                        <Play className="w-8 h-8 text-slate-700" />
                      )}
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {isDeskRoutine ? currentDeskRoutine?.title : currentRoutine?.movement}
                  </h3>
                  {isDeskRoutine && currentDeskRoutine ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto px-2">
                      <div className="text-left space-y-2">
                        <p className="text-sm font-medium text-slate-600 mb-3">
                          Step {currentStep + 1} of {currentDeskRoutine.steps.length}
                        </p>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <p className="text-slate-700 leading-relaxed">
                            {currentDeskRoutine.steps[currentStep]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0 || !isPaused}
                          className="text-xs border-slate-200"
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-slate-500">
                          {currentStep + 1} / {currentDeskRoutine.steps.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentStep(
                              Math.min(currentDeskRoutine.steps.length - 1, currentStep + 1)
                            )
                          }
                          disabled={
                            currentStep === currentDeskRoutine.steps.length - 1 || !isPaused
                          }
                          className="text-xs border-slate-200"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 max-w-sm mx-auto">
                      "{t.qiDose.sifuVoice}": Sink your weight into your heels. Imagine your breath
                      filling your lower Dan Tian...
                    </p>
                  )}

                  <div className="flex justify-center gap-3">
                    <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatTime(countdown).minutes}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {t.qiDose.minutes}
                      </p>
                    </div>
                    <div className="flex items-center text-xl font-medium text-slate-300">:</div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatTime(countdown).seconds}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {t.qiDose.seconds}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 py-3 rounded-xl font-medium border-slate-200"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={handlePauseResume}
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Pre-Exercise Screen
                <div className="p-10 text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    {isDeskRoutine && currentDeskRoutine ? (
                      <currentDeskRoutine.icon className="w-8 h-8 text-slate-700" />
                    ) : (
                      <Play className="w-8 h-8 text-slate-700" />
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {isDeskRoutine ? currentDeskRoutine?.title : currentRoutine?.movement}
                  </h3>
                  {isDeskRoutine && currentDeskRoutine ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto px-2">
                      <div className="text-left space-y-2">
                        <p className="text-sm font-medium text-slate-600 mb-3">
                          Step-by-Step Instructions
                        </p>
                        <div className="space-y-2">
                          {currentDeskRoutine.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`bg-slate-50 rounded-lg p-3 border transition-all ${
                                idx === currentStep
                                  ? "border-slate-300 bg-white"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    idx === currentStep
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {idx + 1}
                                </div>
                                <p
                                  className={`text-sm leading-relaxed ${
                                    idx === currentStep
                                      ? "text-slate-900 font-medium"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 max-w-sm mx-auto">
                      "{t.qiDose.sifuVoice}": Sink your weight into your heels. Imagine your breath
                      filling your lower Dan Tian...
                    </p>
                  )}

                  <div className="flex justify-center gap-3">
                    <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatTime(countdown).minutes}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {t.qiDose.minutes}
                      </p>
                    </div>
                    <div className="flex items-center text-xl font-medium text-slate-300">:</div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatTime(countdown).seconds}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {t.qiDose.seconds}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 py-3 rounded-xl font-medium border-slate-200"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={handleStartExercise}
                    >
                      {t.qiDose.startExercise}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
