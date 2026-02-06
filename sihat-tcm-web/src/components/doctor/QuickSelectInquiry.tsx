"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

interface QuickSelectQuestion {
  id: string;
  question: string;
  choices: { id: string; label: string }[];
  multiSelect: boolean;
}

interface QuickSelectInquiryProps {
  patientInfo: {
    name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
  };
  symptoms: string;
  answers: Record<string, string[]>;
  onAnswersChange: (answers: Record<string, string[]>) => void;
}

// Schema for AI-generated questions
const questionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      choices: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
        })
      ),
      multiSelect: z.boolean(),
    })
  ),
});

export function QuickSelectInquiry({
  patientInfo,
  symptoms,
  answers,
  onAnswersChange,
}: QuickSelectInquiryProps) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<QuickSelectQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate questions using AI
  const handleGenerateQuestions = useCallback(async () => {
    if (!symptoms && !patientInfo.age) {
      setError("Please fill in patient information and symptoms first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/doctor/generate-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientInfo,
          symptoms,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      console.error("Error generating questions:", err);
      setError("Failed to generate questions. Please try again.");

      // Fallback to static questions
      setQuestions(generateFallbackQuestions());
    } finally {
      setIsGenerating(false);
    }
  }, [patientInfo, symptoms]);

  // Toggle answer selection
  const toggleAnswer = (questionId: string, choiceId: string, multiSelect: boolean) => {
    const currentAnswers = answers[questionId] || [];
    let newAnswers: string[];

    if (multiSelect) {
      // Multi-select: toggle the choice
      if (currentAnswers.includes(choiceId)) {
        newAnswers = currentAnswers.filter((id) => id !== choiceId);
      } else {
        newAnswers = [...currentAnswers, choiceId];
      }
    } else {
      // Single-select: replace current answer
      newAnswers = currentAnswers.includes(choiceId) ? [] : [choiceId];
    }

    onAnswersChange({
      ...answers,
      [questionId]: newAnswers,
    });
  };

  // Reset questions and answers
  const handleReset = () => {
    setQuestions([]);
    onAnswersChange({});
  };

  // Generate fallback questions if API fails
  const generateFallbackQuestions = (): QuickSelectQuestion[] => [
    {
      id: "q1",
      question: "How is your appetite recently?",
      choices: [
        { id: "good", label: "Good" },
        { id: "poor", label: "Poor" },
        { id: "excessive", label: "Excessive" },
        { id: "variable", label: "Variable" },
      ],
      multiSelect: false,
    },
    {
      id: "q2",
      question: "How is your sleep quality?",
      choices: [
        { id: "good", label: "Good" },
        { id: "difficulty_falling", label: "Difficulty falling asleep" },
        { id: "waking_up", label: "Waking up frequently" },
        { id: "dreams", label: "Many dreams" },
        { id: "early_waking", label: "Early morning waking" },
      ],
      multiSelect: true,
    },
    {
      id: "q3",
      question: "How is your energy level?",
      choices: [
        { id: "good", label: "Good" },
        { id: "low", label: "Low" },
        { id: "fluctuating", label: "Fluctuating" },
        { id: "exhausted", label: "Exhausted" },
      ],
      multiSelect: false,
    },
    {
      id: "q4",
      question: "Any emotional concerns?",
      choices: [
        { id: "none", label: "None" },
        { id: "stress", label: "Stress" },
        { id: "anxiety", label: "Anxiety" },
        { id: "irritability", label: "Irritability" },
        { id: "depression", label: "Low mood" },
      ],
      multiSelect: true,
    },
    {
      id: "q5",
      question: "How is your digestion?",
      choices: [
        { id: "normal", label: "Normal" },
        { id: "bloating", label: "Bloating" },
        { id: "constipation", label: "Constipation" },
        { id: "diarrhea", label: "Diarrhea" },
        { id: "acid_reflux", label: "Acid reflux" },
      ],
      multiSelect: true,
    },
    {
      id: "q6",
      question: "Body temperature preference?",
      choices: [
        { id: "normal", label: "Normal" },
        { id: "cold", label: "Always feel cold" },
        { id: "hot", label: "Always feel hot" },
        { id: "mixed", label: "Cold hands/feet, hot head" },
      ],
      multiSelect: false,
    },
  ];

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 opacity-60" />
          <p className="text-slate-600 mb-4">
            Generate AI-powered TCM inquiry questions based on patient information and symptoms
          </p>
          <Button onClick={handleGenerateQuestions} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Questions
              </>
            )}
          </Button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{questions.length} questions generated</p>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <Card key={q.id} className="p-4">
                <div className="mb-3">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Q{index + 1}
                  </span>
                  {q.multiSelect && (
                    <span className="ml-2 text-xs text-slate-400">(Select all that apply)</span>
                  )}
                </div>
                <p className="font-medium text-slate-800 mb-3">{q.question}</p>
                <div className="flex flex-wrap gap-2">
                  {q.choices.map((choice) => {
                    const isSelected = (answers[q.id] || []).includes(choice.id);
                    return (
                      <Button
                        key={choice.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAnswer(q.id, choice.id, q.multiSelect)}
                        className="h-9"
                      >
                        {isSelected && <Check className="w-3 h-3 mr-1" />}
                        {choice.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
