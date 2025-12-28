/**
 * Main Content Component for UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Upload, Eye, Trash2, Utensils, Sparkles, Users, Plus } from "lucide-react";
import { HealthJourneyTimeline } from "../HealthJourneyTimeline";
import { FiveElementsRadar } from "../FiveElementsRadar";
import { MealPlanWizard } from "../../meal-planner/MealPlanWizard";
import { TCMFoodChecker } from "../../meal-planner/TCMFoodChecker";
import { SnoreAnalysisTab } from "../snore-analysis/SnoreAnalysisTab";
import { QiDose } from "../../qi-dose/QiDose";
import { VitalityRhythmTab } from "../VitalityRhythmTab";
import { CircleOfHealth } from "../CircleOfHealth";
import { FamilyManagement } from "../FamilyManagement";
import { HeartCompanion } from "../HeartCompanion";
import { PatientCommunication } from "../PatientCommunication";
import { PatientSettings } from "../PatientSettings";
import { ProfileHero } from "../ProfileHero";
import { PersonalDetailsCard } from "../PersonalDetailsCard";
import { HealthMetricsCard } from "../HealthMetricsCard";
import { MedicalHistoryTags } from "../MedicalHistoryTags";
import { PortfolioMedicines } from "../PortfolioMedicines";
import { PortfolioSymptoms } from "../PortfolioSymptoms";
import { DocumentViewerModal } from "../DocumentViewerModal";
import { extractConstitutionType } from "@/lib/tcm-utils";
import type { DiagnosisSession, MedicalReport } from "@/types/database";
import type { DashboardSection } from "./dashboardTypes";

interface UnifiedDashboardContentProps {
  activeSection: DashboardSection;
  sessions: DiagnosisSession[];
  loadingSessions: boolean;
  reports: MedicalReport[];
  loadingReports: boolean;
  uploadingReport: boolean;
  selectedReport: MedicalReport | null;
  profileData: {
    full_name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    medical_history: string;
  };
  editingProfile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  onUpdateProfileField: (field: string, value: string) => Promise<void>;
  onSetSelectedReport: (report: MedicalReport | null) => void;
  onSetEditingProfile: (editing: boolean) => void;
  onRestoreMedicalReports: () => Promise<void>;
  seedingReports: boolean;
  profile: { full_name?: string | null; preferences?: Record<string, unknown> } | null | undefined;
  userEmail?: string;
  t: Record<string, unknown>;
}

export function UnifiedDashboardContent({
  activeSection,
  sessions,
  loadingSessions,
  reports,
  loadingReports,
  uploadingReport,
  selectedReport,
  profileData,
  editingProfile,
  fileInputRef,
  onFileChange,
  onDeleteReport,
  onUpdateProfileField,
  onSetSelectedReport,
  onSetEditingProfile,
  onRestoreMedicalReports,
  seedingReports,
  profile,
  userEmail,
  t,
}: UnifiedDashboardContentProps) {
  const router = useRouter();
  const [mealSubSection, setMealSubSection] = useState<"plan" | "checker">("plan");

  // Health Journey Section
  if (activeSection === "journey") {
    return (
      <HealthJourneyTimeline
        sessions={sessions}
        loading={loadingSessions}
        onStartDiagnosis={() => router.push("/")}
      />
    );
  }

  // Five Elements Section
  if (activeSection === "five-elements") {
    return (
      <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <FiveElementsRadar
          constitutionType={
            sessions.length > 0 && sessions[0].constitution
              ? extractConstitutionType(sessions[0].constitution)
              : undefined
          }
          diagnosisData={sessions.length > 0 ? sessions[0] : undefined}
        />
      </div>
    );
  }

  // Meal Planner Section
  if (activeSection === "meals") {
    return (
      <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
              {(t.patientDashboard?.mealPlanner?.title as string) || "Meal Planner"}
            </h2>
            <p className="text-base text-slate-600 font-light">
              {(t.patientDashboard?.mealPlanner?.subtitle as string) || "Personalized meal plans"}
            </p>
          </div>

          {/* Apple-style Segmented Control */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl w-fit shadow-sm">
            <button
              onClick={() => setMealSubSection("plan")}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${mealSubSection === "plan"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                7-Day Plan
              </span>
            </button>
            <button
              onClick={() => setMealSubSection("checker")}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${mealSubSection === "checker"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Food Checker
              </span>
            </button>
          </div>
        </div>

        {mealSubSection === "plan" ? (
          <MealPlanWizard
            latestDiagnosis={
              sessions.length > 0 ? sessions[0].full_report || sessions[0] : null
            }
          />
        ) : (
          <TCMFoodChecker
            latestDiagnosis={
              sessions.length > 0 ? sessions[0].full_report || sessions[0] : null
            }
            onBack={() => setMealSubSection("plan")}
          />
        )}
      </div>
    );
  }

  // Snore Analysis Section
  if (activeSection === "snore") {
    return <SnoreAnalysisTab sessions={sessions} />;
  }

  // Qi Dose Section
  if (activeSection === "qi-dose") {
    return <QiDose />;
  }

  // Vitality Rhythm Section
  if (activeSection === "vitality") {
    return <VitalityRhythmTab sessions={sessions} />;
  }

  // Community Section
  if (activeSection === "community") {
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        {sessions.length > 0 ? (
          <>
            <p className="text-slate-600 mb-6">
              {(t.circleOfHealth?.subtitle as string) ||
                "Connect with others on similar healing journeys"}
            </p>
            <CircleOfHealth
              userConstitution={
                sessions.length > 0 && sessions[0].constitution
                  ? extractConstitutionType(sessions[0].constitution)
                  : undefined
              }
            />
          </>
        ) : (
          <Card className="p-12 text-center bg-white border-none shadow-md">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Join Our Community</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Complete your first diagnosis to unlock personalized community groups based on
                your constitution.
              </p>
              <Button
                onClick={() => router.push("/")}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Your First Diagnosis
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Family Health Management Section
  if (activeSection === "family") {
    return <FamilyManagement />;
  }

  // Heart Companion Section
  if (activeSection === "heart-companion") {
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 h-[calc(100vh-12rem)]">
        <HeartCompanion profile={profile} />
      </div>
    );
  }

  // Profile Section
  if (activeSection === "profile") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <ProfileHero
          name={profileData.full_name || "Patient"}
          email={userEmail}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PersonalDetailsCard
              fullName={profileData.full_name || ""}
              email={userEmail}
              age={profileData.age}
              gender={profileData.gender}
              onUpdate={onUpdateProfileField}
              editing={editingProfile}
              onEditingChange={onSetEditingProfile}
            />

            <HealthMetricsCard
              height={profileData.height}
              weight={profileData.weight}
              onUpdate={onUpdateProfileField}
              editing={editingProfile}
            />

            <MedicalHistoryTags
              medicalHistory={profileData.medical_history}
              onUpdate={(value) => onUpdateProfileField("medical_history", value)}
              editing={editingProfile}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PortfolioMedicines />
            <PortfolioSymptoms />

            {/* Medical Reports Card */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-white/90" />
                      {(t.patientDashboard?.documents?.yourDocuments as string) || "Your Documents"}
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      {loadingReports ? (
                        <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                      ) : (
                        reports.length
                      )}{" "}
                      {(t.patientDashboard?.documents?.filesUploaded as string) || "files uploaded"}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                    disabled={uploadingReport}
                  >
                    {uploadingReport ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {(t.patientDashboard?.documents?.upload as string) || "Upload"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={onFileChange}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
                <div className="space-y-2">
                  {loadingReports ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
                      <p className="text-sm text-slate-500">Loading your reports...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500 mb-4">
                        {(t.patientDashboard?.documents?.noDocumentsYet as string) ||
                          "No documents yet"}
                      </p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {report.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {report.date} • {report.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => onSetSelectedReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteReport(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DocumentViewerModal
          isOpen={!!selectedReport}
          onClose={() => onSetSelectedReport(null)}
          report={selectedReport}
        />
      </div>
    );
  }

  // Documents Section
  if (activeSection === "documents") {
    return (
      <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <Card className="border-none shadow-md bg-white max-w-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white/90" />
                  {(t.patientDashboard?.documents?.yourDocuments as string) || "Your Documents"}
                </CardTitle>
                <CardDescription className="text-blue-100">
                  {loadingReports ? (
                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  ) : (
                    reports.length
                  )}{" "}
                  {(t.patientDashboard?.documents?.filesUploaded as string) || "files uploaded"}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-blue-600 hover:bg-blue-50"
                disabled={uploadingReport}
              >
                {uploadingReport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {(t.patientDashboard?.documents?.upload as string) || "Upload"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={onFileChange}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingReports ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">Loading your reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 mb-4">
                    {(t.patientDashboard?.documents?.noDocumentsYet as string) ||
                      "No documents yet"}
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">Want to see sample documents?</p>
                    <Button
                      onClick={onRestoreMedicalReports}
                      variant="outline"
                      size="sm"
                      disabled={seedingReports}
                      className="text-slate-500 hover:text-blue-600"
                    >
                      {seedingReports ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Adding samples...
                        </>
                      ) : (
                        "Add Sample Reports"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {report.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.date} • {report.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onSetSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDeleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <DocumentViewerModal
          isOpen={!!selectedReport}
          onClose={() => onSetSelectedReport(null)}
          report={selectedReport}
        />
      </div>
    );
  }

  // Communication Section
  if (activeSection === "communication") {
    return (
      <div className="h-full animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <PatientCommunication />
      </div>
    );
  }

  // Settings Section
  if (activeSection === "settings") {
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        <PatientSettings />
      </div>
    );
  }

  return null;
}

