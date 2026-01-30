"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Wind, Leaf, Zap, Eye, Dumbbell } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { QiGarden } from "./QiGarden";
import { useExerciseTimer } from "./hooks";
import { QuickFixGrid, DeskRoutinesList, Sidebar, ExerciseModal } from "./components";
import { QuickFix, DeskRoutine } from "./types";

export function QiDose() {
  const { t } = useLanguage();
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [selectedDeskRoutine, setSelectedDeskRoutine] = useState<string | null>(null);
  const [showGarden, setShowGarden] = useState(false);

  const timer = useExerciseTimer();

  // Data definitions
  const quickFixes: QuickFix[] = useMemo(
    () => [
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
    ],
    [t]
  );

  const deskRoutines: DeskRoutine[] = useMemo(
    () => [
      {
        id: "meridianSlap",
        title: t.qiDose.meridianSlap,
        desc: t.qiDose.meridianSlapDesc,
        duration: 180,
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
        duration: 300,
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
        duration: 120,
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
    ],
    [t]
  );

  // Get the selected routine details
  const currentRoutine = selectedRoutine ? quickFixes.find((f) => f.id === selectedRoutine) : null;
  const currentDeskRoutine = selectedDeskRoutine
    ? deskRoutines.find((r) => r.id === selectedDeskRoutine)
    : null;
  const activeRoutine = currentRoutine || currentDeskRoutine;
  const isDeskRoutine = !!selectedDeskRoutine;

  // Reset states when routine changes
  useEffect(() => {
    if (selectedRoutine) {
      const routine = quickFixes.find((f) => f.id === selectedRoutine);
      if (routine) timer.initializeForRoutine(routine);
    }
    if (selectedDeskRoutine) {
      const routine = deskRoutines.find((r) => r.id === selectedDeskRoutine);
      if (routine) timer.initializeForRoutine(routine);
    }
  }, [selectedRoutine, selectedDeskRoutine, quickFixes, deskRoutines, timer]);

  const handleSelectQuickFix = (id: string) => {
    setSelectedRoutine(id);
    setSelectedDeskRoutine(null);
  };

  const handleSelectDeskRoutine = (id: string) => {
    setSelectedDeskRoutine(id);
    setSelectedRoutine(null);
  };

  const handleClose = () => {
    timer.reset();
    setSelectedRoutine(null);
    setSelectedDeskRoutine(null);
  };

  const handleStart = () => {
    if (activeRoutine) {
      timer.startExercise(activeRoutine.duration);
    }
  };

  const handleCancel = () => {
    if (activeRoutine) {
      timer.cancel(activeRoutine.duration);
    }
  };

  const handleNextStep = () => {
    if (isDeskRoutine && currentDeskRoutine) {
      timer.nextStep(currentDeskRoutine.steps.length);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-2">
            {t.qiDose.subtitle}
          </h1>
          <p className="text-lg text-slate-600 font-normal">{t.qiDose.title}</p>
        </div>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">{t.qiDose.streak}</p>
            <p className="text-lg font-semibold text-slate-900">5 Days</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
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

      {/* Main Content */}
      {showGarden ? (
        <QiGarden />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <QuickFixGrid
              quickFixes={quickFixes}
              title={t.qiDose.eightMinuteBrocade}
              subtitle={t.qiDose.quickFix}
              onSelect={handleSelectQuickFix}
            />
            <DeskRoutinesList
              routines={deskRoutines}
              title={t.qiDose.deskFriendly}
              onSelect={handleSelectDeskRoutine}
            />
          </div>
          <Sidebar
            t={{
              danTianFilling: t.qiDose.danTianFilling,
              danTianDesc: t.qiDose.danTianDesc,
              unlockScrolls: t.qiDose.unlockScrolls,
              nextScroll: t.qiDose.nextScroll,
              minutes: t.qiDose.minutes,
              xRayVision: t.qiDose.xRayVision,
            }}
          />
        </div>
      )}

      {/* Exercise Modal */}
      <ExerciseModal
        isOpen={!!(selectedRoutine || selectedDeskRoutine)}
        isExercising={timer.isExercising}
        isPaused={timer.isPaused}
        isCompleted={timer.isCompleted}
        countdown={timer.countdown}
        currentStep={timer.currentStep}
        activeRoutine={activeRoutine || null}
        isDeskRoutine={isDeskRoutine}
        t={{
          minutes: t.qiDose.minutes,
          seconds: t.qiDose.seconds,
          sifuVoice: t.qiDose.sifuVoice,
          startExercise: t.qiDose.startExercise,
        }}
        formatTime={timer.formatTime}
        onStart={handleStart}
        onPauseResume={timer.pauseResume}
        onCancel={handleCancel}
        onClose={handleClose}
        onComplete={handleClose}
        onNextStep={handleNextStep}
        onPrevStep={timer.prevStep}
      />
    </div>
  );
}
