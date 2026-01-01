/**
 * Inquiry Section Component
 * Displays and allows editing of inquiry-related summaries (basic info, inquiry, smart connect)
 */

import { useMemo } from "react";
import { SummaryEditCard } from "../SummaryEditCard";

interface InquirySectionProps {
  summaries: Record<string, string>;
  onSummaryChange: (key: string, value: string) => void;
  t: any;
}

export function InquirySection({
  summaries,
  onSummaryChange,
  t,
}: InquirySectionProps) {
  const inquirySections = useMemo(
    () => [
      { id: "basic_info", title: t.diagnosisSummary.sections.basicInfo },
      { id: "wen_inquiry", title: t.diagnosisSummary.sections.wenInquiry },
      { id: "smart_connect", title: t.diagnosisSummary.sections.smartConnect },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
        <p className="text-sm text-blue-800 leading-relaxed">
          {t.diagnosisSummary.instructions.inquiry}
        </p>
      </div>
      {inquirySections.map((section) => {
        if (!summaries[section.id]) return null;
        return (
          <SummaryEditCard
            key={section.id}
            title={section.title}
            value={summaries[section.id]}
            onChange={(newValue) => onSummaryChange(section.id, newValue)}
          />
        );
      })}
    </div>
  );
}


