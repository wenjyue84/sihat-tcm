"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickFix, DeskRoutine } from "../types";

interface ExerciseModalProps {
  isOpen: boolean;
  isExercising: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  countdown: number;
  currentStep: number;
  activeRoutine: QuickFix | DeskRoutine | null;
  isDeskRoutine: boolean;
  t: {
    minutes: string;
    seconds: string;
    sifuVoice: string;
    startExercise: string;
  };
  formatTime: (seconds: number) => { minutes: string; seconds: string };
  onStart: () => void;
  onPauseResume: () => void;
  onCancel: () => void;
  onClose: () => void;
  onComplete: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export function ExerciseModal({
  isOpen,
  isExercising,
  isPaused,
  isCompleted,
  countdown,
  currentStep,
  activeRoutine,
  isDeskRoutine,
  t,
  formatTime,
  onStart,
  onPauseResume,
  onCancel,
  onClose,
  onComplete,
  onNextStep,
  onPrevStep,
}: ExerciseModalProps) {
  if (!isOpen || !activeRoutine) return null;

  const deskRoutine = isDeskRoutine ? (activeRoutine as DeskRoutine) : null;
  const quickFix = !isDeskRoutine ? (activeRoutine as QuickFix) : null;
  const title = isDeskRoutine ? deskRoutine?.title : quickFix?.movement;
  const RoutineIcon = deskRoutine?.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExercising) {
            onClose();
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
            <CompletionScreen title={title || ""} onComplete={onComplete} />
          ) : isExercising ? (
            <ExerciseInProgress
              title={title || ""}
              isDeskRoutine={isDeskRoutine}
              deskRoutine={deskRoutine}
              RoutineIcon={RoutineIcon}
              currentStep={currentStep}
              isPaused={isPaused}
              countdown={countdown}
              t={t}
              formatTime={formatTime}
              onPauseResume={onPauseResume}
              onCancel={onCancel}
              onNextStep={onNextStep}
              onPrevStep={onPrevStep}
            />
          ) : (
            <PreExerciseScreen
              title={title || ""}
              isDeskRoutine={isDeskRoutine}
              deskRoutine={deskRoutine}
              RoutineIcon={RoutineIcon}
              currentStep={currentStep}
              countdown={countdown}
              t={t}
              formatTime={formatTime}
              onStart={onStart}
              onClose={onClose}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface CompletionScreenProps {
  title: string;
  onComplete: () => void;
}

function CompletionScreen({ title, onComplete }: CompletionScreenProps) {
  return (
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
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Exercise Complete</h3>
        <p className="text-slate-600 max-w-sm mx-auto">
          Great job completing {title}. Your energy is flowing!
        </p>
      </div>
      <Button
        className="w-full py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
        onClick={onComplete}
      >
        Done
      </Button>
    </div>
  );
}

interface ExerciseInProgressProps {
  title: string;
  isDeskRoutine: boolean;
  deskRoutine: DeskRoutine | null;
  RoutineIcon: React.ElementType | undefined;
  currentStep: number;
  isPaused: boolean;
  countdown: number;
  t: { minutes: string; seconds: string; sifuVoice: string };
  formatTime: (seconds: number) => { minutes: string; seconds: string };
  onPauseResume: () => void;
  onCancel: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

function ExerciseInProgress({
  title,
  isDeskRoutine,
  deskRoutine,
  RoutineIcon,
  currentStep,
  isPaused,
  countdown,
  t,
  formatTime,
  onPauseResume,
  onCancel,
  onNextStep,
  onPrevStep,
}: ExerciseInProgressProps) {
  const time = formatTime(countdown);

  return (
    <div className="p-10 text-center space-y-6">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          {isDeskRoutine && RoutineIcon ? (
            <RoutineIcon className="w-8 h-8 text-slate-700" />
          ) : (
            <Play className="w-8 h-8 text-slate-700" />
          )}
        </motion.div>
      </div>
      <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>

      {isDeskRoutine && deskRoutine ? (
        <div className="space-y-4 max-h-64 overflow-y-auto px-2">
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-slate-600 mb-3">
              Step {currentStep + 1} of {deskRoutine.steps.length}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-slate-700 leading-relaxed">{deskRoutine.steps[currentStep]}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevStep}
              disabled={currentStep === 0 || !isPaused}
              className="text-xs border-slate-200"
            >
              Previous
            </Button>
            <span className="text-xs text-slate-500">
              {currentStep + 1} / {deskRoutine.steps.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextStep}
              disabled={currentStep === deskRoutine.steps.length - 1 || !isPaused}
              className="text-xs border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-slate-600 max-w-sm mx-auto">
          "{t.sifuVoice}": Sink your weight into your heels. Imagine your breath filling your lower
          Dan Tian...
        </p>
      )}

      <TimerDisplay time={time} t={t} />

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1 py-3 rounded-xl font-medium border-slate-200"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
          onClick={onPauseResume}
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
  );
}

interface PreExerciseScreenProps {
  title: string;
  isDeskRoutine: boolean;
  deskRoutine: DeskRoutine | null;
  RoutineIcon: React.ElementType | undefined;
  currentStep: number;
  countdown: number;
  t: { minutes: string; seconds: string; sifuVoice: string; startExercise: string };
  formatTime: (seconds: number) => { minutes: string; seconds: string };
  onStart: () => void;
  onClose: () => void;
}

function PreExerciseScreen({
  title,
  isDeskRoutine,
  deskRoutine,
  RoutineIcon,
  currentStep,
  countdown,
  t,
  formatTime,
  onStart,
  onClose,
}: PreExerciseScreenProps) {
  const time = formatTime(countdown);

  return (
    <div className="p-10 text-center space-y-6">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
        {isDeskRoutine && RoutineIcon ? (
          <RoutineIcon className="w-8 h-8 text-slate-700" />
        ) : (
          <Play className="w-8 h-8 text-slate-700" />
        )}
      </div>
      <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>

      {isDeskRoutine && deskRoutine ? (
        <div className="space-y-4 max-h-80 overflow-y-auto px-2">
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-slate-600 mb-3">Step-by-Step Instructions</p>
            <div className="space-y-2">
              {deskRoutine.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-50 rounded-lg p-3 border transition-all ${
                    idx === currentStep ? "border-slate-300 bg-white" : "border-slate-200"
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
                        idx === currentStep ? "text-slate-900 font-medium" : "text-slate-600"
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
          "{t.sifuVoice}": Sink your weight into your heels. Imagine your breath filling your lower
          Dan Tian...
        </p>
      )}

      <TimerDisplay time={time} t={t} />

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1 py-3 rounded-xl font-medium border-slate-200"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 py-3 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white"
          onClick={onStart}
        >
          {t.startExercise}
        </Button>
      </div>
    </div>
  );
}

interface TimerDisplayProps {
  time: { minutes: string; seconds: string };
  t: { minutes: string; seconds: string };
}

function TimerDisplay({ time, t }: TimerDisplayProps) {
  return (
    <div className="flex justify-center gap-3">
      <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
        <p className="text-2xl font-semibold text-slate-900">{time.minutes}</p>
        <p className="text-xs font-medium text-slate-500 mt-1">{t.minutes}</p>
      </div>
      <div className="flex items-center text-xl font-medium text-slate-300">:</div>
      <div className="text-center p-4 bg-slate-50 rounded-xl w-20 border border-slate-200">
        <p className="text-2xl font-semibold text-slate-900">{time.seconds}</p>
        <p className="text-xs font-medium text-slate-500 mt-1">{t.seconds}</p>
      </div>
    </div>
  );
}
