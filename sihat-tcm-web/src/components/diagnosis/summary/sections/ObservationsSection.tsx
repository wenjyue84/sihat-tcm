/**
 * Observations Section Component
 * Displays and allows editing of visual observation summaries (tongue, face, body, audio, pulse)
 */

import { useMemo } from "react";
import { SummaryEditCard } from "../SummaryEditCard";
import type { DiagnosisWizardData } from "@/types/diagnosis";

interface ObservationsSectionProps {
  summaries: Record<string, string>;
  data: DiagnosisWizardData;
  onSummaryChange: (key: string, value: string) => void;
  t: any;
}

export function ObservationsSection({
  summaries,
  data,
  onSummaryChange,
  t,
}: ObservationsSectionProps) {
  const observationSections = useMemo(
    () => [
      { id: "wang_tongue", title: t.diagnosisSummary.sections.wangTongue },
      { id: "wang_face", title: t.diagnosisSummary.sections.wangFace },
      { id: "wang_part", title: t.diagnosisSummary.sections.wangPart },
      { id: "wen_audio", title: t.diagnosisSummary.sections.wenAudio },
      { id: "qie", title: t.diagnosisSummary.sections.qie },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
        <p className="text-sm text-blue-800 leading-relaxed">
          {t.diagnosisSummary.instructions.observations}
        </p>
      </div>
      {observationSections.map((section) => {
        if (!summaries[section.id]) return null;

        // Check for image in the corresponding data section
        const sectionData = data[section.id as keyof DiagnosisWizardData] as any;
        const imageSrc = sectionData?.image;

        return (
          <SummaryEditCard
            key={section.id}
            title={section.title}
            value={summaries[section.id]}
            onChange={(newValue) => onSummaryChange(section.id, newValue)}
            imageSrc={imageSrc}
          />
        );
      })}
    </div>
  );
}


