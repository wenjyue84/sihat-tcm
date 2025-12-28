"use client";

import { ActiveSection } from "../hooks/usePatientDashboardState";
import { HealthJourneySection } from "./HealthJourneySection";
import { ProfileSection } from "./ProfileSection";
import { DocumentsSection } from "./DocumentsSection";
import { MealPlannerSection } from "./MealPlannerSection";
import { SettingsSection } from "./SettingsSection";
import { FamilyManagement } from "../FamilyManagement";
import { HeartCompanion } from "../HeartCompanion";
import { PatientCommunication } from "../PatientCommunication";
import { SnoreAnalysisTab } from "../snore-analysis/SnoreAnalysisTab";
import { VitalityRhythmTab } from "../VitalityRhythmTab";
import { QiDose } from "../qi-dose/QiDose";
import { CircleOfHealth } from "../CircleOfHealth";

interface DashboardContentProps {
  activeSection: ActiveSection;
  mealSubSection: "plan" | "checker";
  onMealSubSectionChange: (section: "plan" | "checker") => void;
  // Pass through props for sections
  [key: string]: unknown;
}

/**
 * Main content area component that renders the appropriate section
 * Extracted from UnifiedDashboard for better organization
 */
export function DashboardContent({
  activeSection,
  mealSubSection,
  onMealSubSectionChange,
  ...sectionProps
}: DashboardContentProps) {
  switch (activeSection) {
    case "journey":
      return <HealthJourneySection {...sectionProps} />;

    case "profile":
      return <ProfileSection {...sectionProps} />;

    case "documents":
      return <DocumentsSection {...sectionProps} />;

    case "meals":
      return (
        <MealPlannerSection
          mealSubSection={mealSubSection}
          onMealSubSectionChange={onMealSubSectionChange}
          {...sectionProps}
        />
      );

    case "snore":
      return <SnoreAnalysisTab {...sectionProps} />;

    case "qi-dose":
      return <QiDose {...sectionProps} />;

    case "vitality":
      return <VitalityRhythmTab {...sectionProps} />;

    case "five-elements":
      return <CircleOfHealth {...sectionProps} />;

    case "family":
      return <FamilyManagement />;

    case "heart-companion":
      return <HeartCompanion {...sectionProps} />;

    case "communication":
      return <PatientCommunication {...sectionProps} />;

    case "settings":
      return <SettingsSection {...sectionProps} />;

    default:
      return <HealthJourneySection {...sectionProps} />;
  }
}

