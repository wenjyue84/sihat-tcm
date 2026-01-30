"use client";

import { useState } from "react";
import { ReportChatWindow } from "@/features/diagnosis/components/ReportChatWindow";
import { Button } from "@/components/ui/button";
// Note: Providers are no longer needed - using Zustand store instead
import { useDoctorLevel } from "@/stores/useAppStore";

function TestChatContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { doctorLevel, setDoctorLevel } = useDoctorLevel();

  const mockReportData = {
    diagnosis: {
      primary_pattern: "Liver Qi Stagnation",
      secondary_patterns: ["Spleen Deficiency"],
      affected_organs: ["Liver", "Spleen"],
    },
    constitution: {
      type: "Qi Stagnation",
      description: "Tendency towards emotional instability and digestive issues.",
    },
    analysis: {
      summary: "The patient shows signs of stress affecting digestion.",
      key_findings: {
        from_inquiry: "Reports high stress at work.",
        from_pulse: "Wiry pulse.",
        from_visual: "Pale tongue with thin white coating.",
      },
    },
    recommendations: {
      food: ["Green leafy vegetables", "Mint tea"],
      avoid: ["Spicy foods", "Alcohol"],
      lifestyle: ["Daily meditation", "Light exercise"],
      acupoints: ["LV3", "LI4"],
    },
  };

  const mockPatientInfo = {
    name: "Test Patient",
    age: 30,
    gender: "Female",
    symptoms: "Stress, bloating",
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Report Chat Test Page</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Select Doctor Level</h2>
        <div className="flex gap-4">
          {(["physician", "expert", "master"] as const).map((level) => (
            <Button
              key={level}
              variant={doctorLevel === level ? "default" : "outline"}
              onClick={() => setDoctorLevel(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
        <p>
          Current Level: <span className="font-bold capitalize">{doctorLevel}</span>
        </p>
        <p className="text-sm text-gray-500">
          Model:{" "}
          <span className="font-mono">
            {doctorLevel === "master"
              ? "gemini-2.5-pro"
              : doctorLevel === "expert"
                ? "gemini-2.5-flash"
                : "gemini-2.0-flash"}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Open Chat</h2>
        <Button onClick={() => setIsChatOpen(true)}>Open Chat Window</Button>
      </div>

      <ReportChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        reportData={mockReportData}
        patientInfo={mockPatientInfo}
      />
    </div>
  );
}

export default function TestChatPage() {
  // Providers are no longer needed - Zustand store is initialized globally
  return <TestChatContent />;
}
