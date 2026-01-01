/**
 * Options Section Component
 * Displays report customization options organized in collapsible sections
 */

import { User, Activity, FileText, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CollapsibleOptionsSection, CheckboxOption } from "../";
import type { ReportOptions } from "../hooks/useReportOptions";
import type { TranslationKeys } from "@/lib/translations";

interface OptionsSectionProps {
  options: ReportOptions;
  onOptionChange: (key: keyof ReportOptions, checked: boolean) => void;
  additionalInfo: {
    address: string;
    contact: string;
    emergencyContact: string;
  };
  onAdditionalInfoChange: (key: string, value: string) => void;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  t: TranslationKeys;
}

export function OptionsSection({
  options,
  onOptionChange,
  additionalInfo,
  onAdditionalInfoChange,
  expandedSections,
  onToggleSection,
  t,
}: OptionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
        <p className="text-sm text-blue-800 leading-relaxed">
          {t.diagnosisSummary.instructions.options}
        </p>
      </div>

      {/* Patient Information Section */}
      <CollapsibleOptionsSection
        id="patientInfo"
        title={t.diagnosisSummary.reportOptions.patientInfo}
        subtitle={t.diagnosisSummary.reportOptions.demographics}
        icon={User}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        isExpanded={expandedSections.patientInfo}
        onToggle={() => onToggleSection("patientInfo")}
        delay={0.1}
      >
        <CheckboxOption
          id="includePatientName"
          label={t.diagnosisSummary.reportOptions.patientName}
          checked={options.includePatientName}
          onChange={(c) => onOptionChange("includePatientName", c)}
        />
        <CheckboxOption
          id="includePatientAge"
          label={t.diagnosisSummary.reportOptions.age}
          checked={options.includePatientAge}
          onChange={(c) => onOptionChange("includePatientAge", c)}
        />
        <CheckboxOption
          id="includePatientGender"
          label={t.diagnosisSummary.reportOptions.gender}
          checked={options.includePatientGender}
          onChange={(c) => onOptionChange("includePatientGender", c)}
        />
        <CheckboxOption
          id="includePatientContact"
          label={t.diagnosisSummary.reportOptions.contactInfo}
          checked={options.includePatientContact}
          onChange={(c) => onOptionChange("includePatientContact", c)}
        >
          <Input
            placeholder={t.diagnosisSummary.placeholders.contact}
            value={additionalInfo.contact}
            onChange={(e) => onAdditionalInfoChange("contact", e.target.value)}
            className="w-full h-9 text-sm bg-white"
          />
        </CheckboxOption>
        <CheckboxOption
          id="includePatientAddress"
          label={t.diagnosisSummary.reportOptions.address}
          checked={options.includePatientAddress}
          onChange={(c) => onOptionChange("includePatientAddress", c)}
        >
          <Input
            placeholder={t.diagnosisSummary.placeholders.address}
            value={additionalInfo.address}
            onChange={(e) => onAdditionalInfoChange("address", e.target.value)}
            className="w-full h-9 text-sm bg-white"
          />
        </CheckboxOption>
        <CheckboxOption
          id="includeEmergencyContact"
          label={t.diagnosisSummary.reportOptions.emergencyContact}
          checked={options.includeEmergencyContact}
          onChange={(c) => onOptionChange("includeEmergencyContact", c)}
        >
          <Input
            placeholder={t.diagnosisSummary.placeholders.emergencyContact}
            value={additionalInfo.emergencyContact}
            onChange={(e) =>
              onAdditionalInfoChange("emergencyContact", e.target.value)
            }
            className="w-full h-9 text-sm bg-white"
          />
        </CheckboxOption>
      </CollapsibleOptionsSection>

      {/* Vital Signs & Measurements Section */}
      <CollapsibleOptionsSection
        id="vitalSigns"
        title={t.diagnosisSummary.reportOptions.vitalSigns}
        subtitle={t.diagnosisSummary.reportOptions.healthData}
        icon={Activity}
        iconBgColor="bg-rose-100"
        iconColor="text-rose-500"
        isExpanded={expandedSections.vitalSigns}
        onToggle={() => onToggleSection("vitalSigns")}
        delay={0.2}
      >
        <CheckboxOption
          id="includeVitalSigns"
          label={t.diagnosisSummary.reportOptions.vitalSignsDesc}
          checked={options.includeVitalSigns}
          onChange={(c) => onOptionChange("includeVitalSigns", c)}
        />
        <CheckboxOption
          id="includeBMI"
          label={t.diagnosisSummary.reportOptions.bmiMeasurements}
          checked={options.includeBMI}
          onChange={(c) => onOptionChange("includeBMI", c)}
        />
        <CheckboxOption
          id="includeSmartConnectData"
          label={t.diagnosisSummary.reportOptions.smartConnectData}
          checked={options.includeSmartConnectData}
          onChange={(c) => onOptionChange("includeSmartConnectData", c)}
        />
      </CollapsibleOptionsSection>

      {/* Medical History Section */}
      <CollapsibleOptionsSection
        id="medicalHistory"
        title={t.diagnosisSummary.reportOptions.medicalHistory}
        subtitle={t.diagnosisSummary.reportOptions.background}
        icon={FileText}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-500"
        isExpanded={expandedSections.medicalHistory}
        onToggle={() => onToggleSection("medicalHistory")}
        delay={0.3}
      >
        <CheckboxOption
          id="includeMedicalHistory"
          label={t.diagnosisSummary.reportOptions.pastMedicalHistory}
          checked={options.includeMedicalHistory}
          onChange={(c) => onOptionChange("includeMedicalHistory", c)}
        />
        <CheckboxOption
          id="includeAllergies"
          label={t.diagnosisSummary.reportOptions.knownAllergies}
          checked={options.includeAllergies}
          onChange={(c) => onOptionChange("includeAllergies", c)}
        />
        <CheckboxOption
          id="includeCurrentMedications"
          label={t.diagnosisSummary.reportOptions.currentMedications}
          checked={options.includeCurrentMedications}
          onChange={(c) => onOptionChange("includeCurrentMedications", c)}
        />
        <CheckboxOption
          id="includePastDiagnoses"
          label={t.diagnosisSummary.reportOptions.pastTcmDiagnoses}
          checked={options.includePastDiagnoses}
          onChange={(c) => onOptionChange("includePastDiagnoses", c)}
        />
        <CheckboxOption
          id="includeFamilyHistory"
          label={t.diagnosisSummary.reportOptions.familyHistory}
          checked={options.includeFamilyHistory}
          onChange={(c) => onOptionChange("includeFamilyHistory", c)}
        />
      </CollapsibleOptionsSection>

      {/* TCM Recommendations Section */}
      <CollapsibleOptionsSection
        id="recommendations"
        title={t.diagnosisSummary.reportOptions.tcmRecommendations}
        subtitle={t.diagnosisSummary.reportOptions.treatment}
        icon={Check}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        isExpanded={expandedSections.recommendations}
        onToggle={() => onToggleSection("recommendations")}
        delay={0.4}
      >
        <CheckboxOption
          id="suggestMedicine"
          label={t.diagnosisSummary.reportOptions.herbalMedicine}
          checked={options.suggestMedicine}
          onChange={(c) => onOptionChange("suggestMedicine", c)}
        />
        <CheckboxOption
          id="suggestDoctor"
          label={t.diagnosisSummary.reportOptions.nearbyDoctor}
          checked={options.suggestDoctor}
          onChange={(c) => onOptionChange("suggestDoctor", c)}
        />
        <CheckboxOption
          id="includeDietary"
          label={t.diagnosisSummary.reportOptions.dietary}
          checked={options.includeDietary}
          onChange={(c) => onOptionChange("includeDietary", c)}
        />
        <CheckboxOption
          id="includeLifestyle"
          label={t.diagnosisSummary.reportOptions.lifestyle}
          checked={options.includeLifestyle}
          onChange={(c) => onOptionChange("includeLifestyle", c)}
        />
        <CheckboxOption
          id="includeAcupuncture"
          label={t.diagnosisSummary.reportOptions.acupuncture}
          checked={options.includeAcupuncture}
          onChange={(c) => onOptionChange("includeAcupuncture", c)}
        />
        <CheckboxOption
          id="includeExercise"
          label={t.diagnosisSummary.reportOptions.exercise}
          checked={options.includeExercise}
          onChange={(c) => onOptionChange("includeExercise", c)}
        />
        <CheckboxOption
          id="includeSleepAdvice"
          label={t.diagnosisSummary.reportOptions.sleepAdvice}
          checked={options.includeSleepAdvice}
          onChange={(c) => onOptionChange("includeSleepAdvice", c)}
        />
        <CheckboxOption
          id="includeEmotionalWellness"
          label={t.diagnosisSummary.reportOptions.emotionalWellness}
          checked={options.includeEmotionalWellness}
          onChange={(c) => onOptionChange("includeEmotionalWellness", c)}
        />
      </CollapsibleOptionsSection>

      {/* Report Format & Extras Section */}
      <CollapsibleOptionsSection
        id="reportExtras"
        title={t.diagnosisSummary.reportOptions.reportExtras}
        subtitle={t.diagnosisSummary.reportOptions.formatting}
        icon={FileText}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-500"
        isExpanded={expandedSections.reportExtras}
        onToggle={() => onToggleSection("reportExtras")}
        delay={0.5}
      >
        <CheckboxOption
          id="includePrecautions"
          label={t.diagnosisSummary.reportOptions.precautions}
          checked={options.includePrecautions}
          onChange={(c) => onOptionChange("includePrecautions", c)}
        />
        <CheckboxOption
          id="includeFollowUp"
          label={t.diagnosisSummary.reportOptions.followUp}
          checked={options.includeFollowUp}
          onChange={(c) => onOptionChange("includeFollowUp", c)}
        />
        <CheckboxOption
          id="includeTimestamp"
          label={t.diagnosisSummary.reportOptions.timestamp}
          checked={options.includeTimestamp}
          onChange={(c) => onOptionChange("includeTimestamp", c)}
        />
        <CheckboxOption
          id="includeQRCode"
          label={t.diagnosisSummary.reportOptions.qrCode}
          checked={options.includeQRCode}
          onChange={(c) => onOptionChange("includeQRCode", c)}
        />
        <CheckboxOption
          id="includeDoctorSignature"
          label={t.diagnosisSummary.reportOptions.doctorSignature}
          checked={options.includeDoctorSignature}
          onChange={(c) => onOptionChange("includeDoctorSignature", c)}
        />
      </CollapsibleOptionsSection>
    </div>
  );
}


