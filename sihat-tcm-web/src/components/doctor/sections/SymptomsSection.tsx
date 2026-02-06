"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

// Common symptom chips for quick selection
const COMMON_SYMPTOMS = [
  "Headache",
  "Fatigue",
  "Insomnia",
  "Dizziness",
  "Back Pain",
  "Digestive Issues",
  "Anxiety",
  "Cold/Flu",
  "Joint Pain",
  "Cough",
  "Nausea",
  "Skin Issues",
  "Menstrual Issues",
  "Heart Palpitations",
];

interface SymptomsSectionProps {
  selectedSymptoms: string[];
  otherSymptoms: string;
  onToggleSymptom: (symptom: string) => void;
  onOtherSymptomsChange: (value: string) => void;
}

export function SymptomsSection({
  selectedSymptoms,
  otherSymptoms,
  onToggleSymptom,
  onOtherSymptomsChange,
}: SymptomsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Quick Select Symptoms</Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <Button
              key={symptom}
              type="button"
              variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleSymptom(symptom)}
              className="h-8"
            >
              {selectedSymptoms.includes(symptom) && <Check className="w-3 h-3 mr-1" />}
              {symptom}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="other-symptoms">Other Symptoms / Details</Label>
        <Textarea
          id="other-symptoms"
          value={otherSymptoms}
          onChange={(e) => onOtherSymptomsChange(e.target.value)}
          placeholder="Describe other symptoms or provide more details..."
          className="mt-1 min-h-[100px]"
        />
      </div>
    </div>
  );
}

export { COMMON_SYMPTOMS };
