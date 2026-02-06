"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClinicalNotesSectionProps {
  clinicalNotes: string;
  treatmentPlan: string;
  onClinicalNotesChange: (value: string) => void;
  onTreatmentPlanChange: (value: string) => void;
}

export function ClinicalNotesSection({
  clinicalNotes,
  treatmentPlan,
  onClinicalNotesChange,
  onTreatmentPlanChange,
}: ClinicalNotesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clinical-notes-input">Clinical Observations & Findings</Label>
        <Textarea
          id="clinical-notes-input"
          value={clinicalNotes}
          onChange={(e) => onClinicalNotesChange(e.target.value)}
          placeholder="Enter your clinical observations, pulse analysis, or other findings..."
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment-plan-input">Proposed Treatment Plan</Label>
        <Textarea
          id="treatment-plan-input"
          value={treatmentPlan}
          onChange={(e) => onTreatmentPlanChange(e.target.value)}
          placeholder="Enter acupuncture points, herbal formula adjustments, or diet advice..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
}
