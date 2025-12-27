"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { motion } from "framer-motion";
import {
  FileHeart,
  User,
  Upload,
  Plus,
  LogOut,
  Loader2,
  Edit,
  FileText,
  Download,
  Eye,
  Trash2,
  UtensilsCrossed,
  Settings,
  Globe,
  Check,
  Grid3X3,
  List,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Home,
  ExternalLink,
  Activity,
  Heart,
  Moon,
  Utensils,
  Sparkles,
  Wind,
  ArrowRight,
  Users,
  Zap,
  Menu,
  X,
  Pill,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPatientHistory,
  getHealthTrends,
  DiagnosisSession,
  seedPatientHistory,
  getMedicalReports,
  saveMedicalReport,
  deleteMedicalReport,
  seedMedicalReports,
  MedicalReport,
} from "@/lib/actions";
import { supabase } from "@/lib/supabase/client";
import { TrendWidget } from "./TrendWidget";
import { HistoryCard } from "./HistoryCard";
import { MealPlanWizard } from "../meal-planner/MealPlanWizard";
import { SnoreAnalysisTab } from "./snore-analysis/SnoreAnalysisTab";
import { VitalityRhythmTab } from "./VitalityRhythmTab";
import { useLanguage } from "@/stores/useAppStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { TCMFoodChecker } from "../meal-planner/TCMFoodChecker";
import { QiDose } from "../qi-dose/QiDose";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";

import { DocumentViewerModal } from "./DocumentViewerModal";
import { HealingGarden } from "./HealingGarden";
import { FamilyManagement } from "./FamilyManagement";
import { PatientSettings } from "./PatientSettings";
import { DashboardGrid } from "./DashboardWidgets";
import { SolarTermsTimeline } from "./SolarTermsTimeline";
import { DailyTipCard } from "./DailyTipCard";
import { ConstitutionCard } from "./ConstitutionCard";
import { FiveElementsRadar } from "./FiveElementsRadar";
import { DigitalTwin } from "./DigitalTwin";
import { Search } from "lucide-react";
import { HealthJourneyTimeline } from "./HealthJourneyTimeline";

import { PersonalDetailsCard } from "./PersonalDetailsCard";
import { HealthMetricsCard } from "./HealthMetricsCard";
import { MedicalHistoryTags } from "./MedicalHistoryTags";
import { HeartCompanion } from "./HeartCompanion";
import { PortfolioMedicines } from "./PortfolioMedicines";
import { PortfolioSymptoms } from "./PortfolioSymptoms";
import { TextReviewModal } from "../diagnosis/TextReviewModal";

export function UnifiedDashboard() {
  const { user, profile, updatePreferences, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { language, setLanguage, languageNames, t } = useLanguage();

  // Sync language from profile on login
  useLanguageSync();

  // Health Journey State
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // View & Sort State
  type ViewType = "table" | "list" | "gallery";
  type SortField = "date" | "score" | "diagnosis";
  type SortDirection = "asc" | "desc";

  const [viewType, setViewTypeState] = useState<ViewType>("table");
  const [sortField, setSortFieldState] = useState<SortField>("date");
  const [sortDirection, setSortDirectionState] = useState<SortDirection>("desc");

  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    medical_history: "",
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Documents State
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingReports, setSeedingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Text Extraction Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentReviewFile, setCurrentReviewFile] = useState<File | null>(null);

  // Active Section
  const [activeSection, setActiveSectionState] = useState<
    | "journey"
    | "healthPortfolio"
    | "documents"
    | "meals"
    | "snore"
    | "qi-dose"
    | "vitality"
    | "community"
    | "family"
    | "settings"
    | "heart-companion"
  >("journey");
  const [mealSubSection, setMealSubSection] = useState<"plan" | "checker">("plan");

  // Settings State
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize from profile preferences
  useEffect(() => {
    if (profile?.preferences) {
      if (profile.preferences.viewType) setViewTypeState(profile.preferences.viewType as ViewType);
      if (profile.preferences.sortField)
        setSortFieldState(profile.preferences.sortField as SortField);
      if (profile.preferences.sortDirection)
        setSortDirectionState(profile.preferences.sortDirection as SortDirection);
      if (profile.preferences.activeSection && profile.preferences.activeSection !== "five-elements")
        setActiveSectionState(profile.preferences.activeSection as any);
    }
  }, [profile]);

  // Wrappers to update state and sync preferences
  const setViewType = (type: ViewType) => {
    setViewTypeState(type);
    updatePreferences({ viewType: type });
  };

  const setSortField = (field: SortField) => {
    setSortFieldState(field);
    updatePreferences({ sortField: field });
  };

  const setSortDirection = (dir: SortDirection) => {
    setSortDirectionState(dir);
    updatePreferences({ sortDirection: dir });
  };

  const setActiveSection = (
    section:
      | "journey"
      | "healthPortfolio"
      | "documents"
      | "meals"
      | "snore"
      | "qi-dose"
      | "vitality"
      | "community"
      | "family"
      | "settings"
      | "heart-companion"
  ) => {
    setActiveSectionState(section);
    updatePreferences({ activeSection: section });
  };

  // Load health journey data
  useEffect(() => {
    async function loadHealthData() {
      if (!user) return;

      try {
        setLoadingSessions(true);
        const [historyResult, trendsResult] = await Promise.all([
          getPatientHistory(50, 0),
          getHealthTrends(30),
        ]);

        if (historyResult.success && historyResult.data) {
          setSessions(historyResult.data);
        }

        if (trendsResult.success && trendsResult.data) {
          setTrendData(trendsResult.data);
        }
      } catch (err) {
        console.error("[UnifiedDashboard] Error loading health data:", err);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadHealthData();
  }, [user]);

  const refreshSessions = async () => {
    if (!user) return;
    try {
      setLoadingSessions(true);
      const [historyResult, trendsResult] = await Promise.all([
        getPatientHistory(50, 0),
        getHealthTrends(30),
      ]);
      if (historyResult.success && historyResult.data) {
        setSessions(historyResult.data);
      }
      if (trendsResult.success && trendsResult.data) {
        setTrendData(trendsResult.data);
      }
    } catch (err) {
      console.error("[UnifiedDashboard] Error refreshing health data:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        age: profile.age?.toString() || "",
        gender: profile.gender || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        medical_history: profile.medical_history || "",
      });
    }
  }, [profile]);

  // Load documents from Supabase
  useEffect(() => {
    async function loadReports() {
      if (!user) return;
      try {
        setLoadingReports(true);
        const result = await getMedicalReports();
        if (result.success && result.data) {
          setReports(result.data);
        }
      } catch (err) {
        console.error("[UnifiedDashboard] Error loading reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    loadReports();
  }, [user]);

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          age: parseInt(profileData.age) || null,
          gender: profileData.gender,
          height: parseFloat(profileData.height) || null,
          weight: parseFloat(profileData.weight) || null,
          medical_history: profileData.medical_history,
        })
        .eq("id", user.id);

      if (error) throw error;

      setEditingProfile(false);
      await refreshProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle individual field update (for inline editing)
  const handleUpdateProfileField = async (field: string, value: string) => {
    if (!user) return;

    try {
      // Update local state immediately for optimistic update
      setProfileData((prev) => ({ ...prev, [field]: value }));

      // Prepare update object
      const updateData: any = { [field]: value };

      // Convert numeric fields
      if (field === "age") {
        updateData.age = parseInt(value) || null;
      } else if (field === "height" || field === "weight") {
        updateData[field] = parseFloat(value) || null;
      }

      // Update in database
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profile to get latest data
      await refreshProfile();
    } catch (error) {
      console.error("Error updating profile field:", error);
      // Revert on error
      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          age: profile.age?.toString() || "",
          gender: profile.gender || "",
          height: profile.height?.toString() || "",
          weight: profile.weight?.toString() || "",
          medical_history: profile.medical_history || "",
        });
      }
      alert("Failed to update. Please try again.");
    }
  };

  // Handle document upload - opens AI text extraction modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t.errors?.fileTooBig?.replace("{size}", "5") || "File too big (max 5MB)");
      e.target.value = "";
      return;
    }

    // Open AI text extraction review modal
    setCurrentReviewFile(file);
    setIsReviewModalOpen(true);
    e.target.value = "";
  };

  // Handle confirmed text after AI extraction and user review
  const handleReviewConfirm = async (extractedText: string, file: File) => {
    if (!user) return;

    try {
      setUploadingReport(true);
      setIsReviewModalOpen(false);

      // Optional: Upload to Supabase Storage
      let file_url = undefined;
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("medical-reports")
          .upload(filePath, file);

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("medical-reports").getPublicUrl(filePath);
          file_url = publicUrl;
        } else {
          console.warn(
            "Storage upload failed (bucket might not exist), falling back to metadata only:",
            uploadError.message
          );
        }
      } catch (storageErr) {
        console.warn("Storage error, falling back to metadata only:", storageErr);
      }

      const newReport = {
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
        file_url,
        extracted_text: extractedText, // Store AI-extracted text for future diagnosis prefill
      };

      const result = await saveMedicalReport(newReport);

      if (result.success && result.data) {
        setReports([result.data, ...reports]);
      } else if (!result.success) {
        alert("Failed to save report: " + result.error);
      }
    } catch (error) {
      console.error("Error in handleReviewConfirm:", error);
      alert("An error occurred while uploading the report.");
    } finally {
      setUploadingReport(false);
      setCurrentReviewFile(null);
    }
  };

  // Handle document delete
  const handleDeleteReport = async (reportId: string) => {
    if (confirm(t.patientDashboard.documents.deleteConfirm)) {
      try {
        const result = await deleteMedicalReport(reportId);
        if (result.success) {
          setReports(reports.filter((r) => r.id !== reportId));
        } else {
          alert("Failed to delete report: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      setLoggingOut(false);
    }
  };

  const handleRestoreData = async () => {
    if (!confirm("This will add mocked data to your history. Proceed?")) return;
    try {
      setSeeding(true);
      const result = await seedPatientHistory();
      if (result.success) {
        alert("Mock data restored successfully!");
        window.location.reload();
      } else {
        if (
          result.error &&
          (result.error.includes("does not exist") ||
            result.error.includes('relation "public.diagnosis_sessions"'))
        ) {
          alert(
            'Database Error: The "diagnosis_sessions" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.'
          );
        } else {
          alert("Failed to restore mock data: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error restoring mock data:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSeeding(false);
    }
  };

  const handleRestoreMedicalReports = async () => {
    if (!confirm("This will add sample medical reports to your documents. Proceed?")) return;
    try {
      setSeedingReports(true);
      const result = await seedMedicalReports();
      if (result?.success) {
        alert("Sample medical reports added successfully!");
        window.location.reload();
      } else {
        if (
          result?.error &&
          (result.error.includes("does not exist") ||
            result.error.includes('relation "public.medical_reports"'))
        ) {
          alert(
            'Database Error: The "medical_reports" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.'
          );
        } else {
          alert("Failed to add sample reports: " + (result?.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error adding sample reports:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSeedingReports(false);
    }
  };

  // Helper functions for views
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
      en: "en-US",
      zh: "zh-CN",
      ms: "ms-MY",
    };
    return new Intl.DateTimeFormat(localeMap[language] || "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getScoreBadge = (score?: number) => {
    if (score === undefined || score === null) return null;
    if (score >= 75)
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: t.patientDashboard.historyTable.good,
        Icon: TrendingUp,
      };
    if (score >= 50)
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: t.patientDashboard.historyTable.fair,
        Icon: Minus,
      };
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      label: t.patientDashboard.historyTable.needsAttention,
      Icon: TrendingDown,
    };
  };

  // Sort sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "score":
        comparison = (a.overall_score || 0) - (b.overall_score || 0);
        break;
      case "diagnosis":
        comparison = (a.primary_diagnosis || "").localeCompare(b.primary_diagnosis || "");
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Section title helper
  const getSectionTitle = () => {
    switch (activeSection) {
      case "journey":
        return t.patientDashboard?.tabs?.healthJourney || "Health Journey";
      case "meals":
        return t.patientDashboard?.tabs?.mealPlanner || "Dietary Therapy";
      case "snore":
        return t.patientDashboard?.tabs?.snoreAnalysis || "Sleep Cultivation";
      case "qi-dose":
        return t.patientDashboard?.tabs?.qiDose || "Guided Exercise";
      case "vitality":
        return t.patientDashboard?.tabs?.vitalityRhythm || "Meridian Clock";
      case "community":
        return t.patientDashboard?.tabs?.community || "Community";
      case "family":
        return t.familyManagement?.title || t.patientDashboard?.tabs?.family || "Family Care";
      case "healthPortfolio":
        return t.patientDashboard_v1.healthPortfolio.title;
      case "settings":
        return t.patientDashboard?.tabs?.settings || "Settings";
      case "heart-companion":
        return t.patientDashboard?.tabs?.heartCompanion || t.heartCompanion?.title || "Heart Companion";
      default:
        return t.patientDashboard?.tabs?.healthJourney || "Health Journey";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-sm transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Patient <span className="text-emerald-600">Portal</span>
            </span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Group 1: Diagnosis Assessment */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                {t.patientDashboard?.navigation?.groupAssessment || "Assessment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("journey");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "journey" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Activity className="w-4 h-4" />
                  {t.patientDashboard?.tabs?.healthJourney || "Health Journey"}
                </button>
                <button
                  onClick={() => {
                    setActiveSection("healthPortfolio");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "healthPortfolio" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <User className="w-4 h-4" />
                  {t.patientDashboard_v1.healthPortfolio.title}
                </button>
              </div>
            </div>

            {/* Group 2: Treatment Plan */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Pill className="w-3.5 h-3.5 text-amber-500" />
                {t.patientDashboard?.navigation?.groupTreatment || "Treatment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("meals");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "meals" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  {t.patientDashboard.tabs.mealPlanner}
                </button>
                <button
                  onClick={() => {
                    setActiveSection("snore");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "snore" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Moon className="w-4 h-4" />
                  {t.patientDashboard.tabs.snoreAnalysis}
                </button>
                <button
                  onClick={() => {
                    setActiveSection("qi-dose");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "qi-dose" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Wind className="w-4 h-4" />
                  {t.patientDashboard.tabs.qiDose}
                </button>
              </div>
            </div>

            {/* Group 3: Care Hub */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                {t.patientDashboard?.navigation?.groupCultivation || "Care Hub"}
              </div>

              <div className="space-y-1">
                {profile?.preferences?.showMeridianClock && (
                  <button
                    onClick={() => {
                      setActiveSection("vitality");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "vitality" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <Activity className="w-4 h-4" />
                    {t.patientDashboard.tabs.vitalityRhythm}
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveSection("heart-companion");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "heart-companion" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Heart className="w-4 h-4" />
                  {t.patientDashboard?.tabs?.heartCompanion || t.heartCompanion?.title || "Heart Companion"}
                </button>
                <button
                  onClick={() => {
                    setActiveSection("community");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "community" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Users className="w-4 h-4" />
                  {t.patientDashboard.tabs.community}
                </button>
                <button
                  onClick={() => {
                    setActiveSection("family");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "family" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Heart className="w-4 h-4" />
                  {t.patientDashboard.tabs.family}
                </button>
              </div>
            </div>

            {/* Group 4: Account */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {t.patientDashboard?.navigation?.groupAccount || "Account"}
              </div>
              <div className="space-y-1">
                {/* Health Portfolio is already in Group 1 */}
                <button
                  onClick={() => {
                    setActiveSection("settings");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === "settings" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Settings className="w-4 h-4" />
                  {t.patientDashboard.tabs.settings}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {t.patientDashboard.navigation.logout}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{getSectionTitle()}</h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 hidden sm:flex">
                {t.patientDashboard.welcomeBack}, {profile?.full_name || user?.email || "Patient"}
                {profile?.full_name === "Test Patient" && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-wider">
                    Demo Mode
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2"
              onClick={() => router.push("/")}
            >
              <Plus className="w-3.5 h-3.5" />
              {t.patientDashboard.newDiagnosis}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex gap-2"
              onClick={() => window.open("/", "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.patientDashboard.navigation.home}
            </Button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white border border-emerald-200">
              <span className="text-xs font-bold">
                {(profile?.full_name?.[0] || user?.email?.[0] || "P").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-20">
            {/* Health Journey Section */}
            {activeSection === "journey" && (
              <HealthJourneyTimeline
                sessions={sessions}
                loading={loadingSessions}
                onRefresh={refreshSessions}
                onStartDiagnosis={() => router.push("/")}
                onRestoreData={handleRestoreData}
              />
            )}

            {/* Meal Planner Section */}
            {activeSection === "meals" && (
              <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col gap-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                      {t.patientDashboard.mealPlanner.title}
                    </h2>
                    <p className="text-base text-slate-600 font-light">
                      {t.patientDashboard.mealPlanner.subtitle}
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
            )}

            {/* Snore Analysis Section */}
            {activeSection === "snore" && <SnoreAnalysisTab sessions={sessions} />}

            {/* Qi Dose Section */}
            {activeSection === "qi-dose" && <QiDose />}

            {/* Vitality Rhythm Section */}
            {activeSection === "vitality" && <VitalityRhythmTab sessions={sessions} />}

            {/* Circle of Health / Community Section */}
            {activeSection === "community" && (
              <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {sessions.length > 0 ? (
                  <>
                    <p className="text-slate-600 mb-6">{t.healingGarden.subtitle}</p>
                    <HealingGarden
                      sessions={sessions}
                      userConstitution={
                        sessions.length > 0 && sessions[0].constitution
                          ? extractConstitutionType(sessions[0].constitution)
                          : undefined
                      }
                      showHealthVitality={false}
                    />
                  </>
                ) : (
                  <Card className="p-12 text-center bg-white border-none shadow-md">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Users className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">
                        Join Our Community
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                        Complete your first diagnosis to unlock personalized community groups based on your constitution.
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
            )}

            {/* Family Health Management Section */}
            {activeSection === "family" && <FamilyManagement />}

            {/* Heart Companion Section */}
            {activeSection === "heart-companion" && (
              <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 h-[calc(100vh-12rem)]">
                <HeartCompanion profile={profile} />
              </div>
            )}

            {/* Health Portfolio Section */}
            {activeSection === "healthPortfolio" && (
              <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {/* Hero Section */}


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column - Personal Info */}
                  <div className="lg:col-span-4 space-y-6">
                    <PersonalDetailsCard
                      fullName={profileData.full_name || ""}
                      email={user?.email}
                      age={profileData.age}
                      gender={profileData.gender}
                      onUpdate={handleUpdateProfileField}
                      editing={editingProfile}
                      onEditingChange={setEditingProfile}
                    />

                    <HealthMetricsCard
                      height={profileData.height}
                      weight={profileData.weight}
                      onUpdate={handleUpdateProfileField}
                      editing={editingProfile}
                    />

                    <MedicalHistoryTags
                      medicalHistory={profileData.medical_history}
                      onUpdate={(value) => handleUpdateProfileField("medical_history", value)}
                      editing={editingProfile}
                    />
                  </div>

                  {/* Right Column - Health Data */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Medicines Section */}
                    <PortfolioMedicines />

                    {/* Symptoms History */}
                    <PortfolioSymptoms />

                    {/* Medical Reports Integrated */}
                    <Card className="border-none shadow-md bg-white overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                              <FileText className="w-6 h-6 text-white/90" />
                              {t.patientDashboard_v1.healthPortfolio.documents.title}
                            </CardTitle>
                            <CardDescription className="text-blue-100 italic">
                              {loadingReports ? (
                                <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                              ) : (
                                reports.length
                              )}{" "}
                              {t.patientDashboard.documents.filesUploaded}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white text-blue-600 hover:bg-blue-50 border-none shadow-sm gap-2"
                            disabled={uploadingReport}
                          >
                            {uploadingReport ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            {t.patientDashboard.documents.upload}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
                        {loadingReports ? (
                          <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
                            <p className="text-sm text-slate-500">Loading your reports...</p>
                          </div>
                        ) : reports.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500 mb-4 font-medium">
                              {t.patientDashboard.documents.noDocumentsYet}
                            </p>
                            <Button
                              onClick={handleRestoreMedicalReports}
                              variant="outline"
                              size="sm"
                              disabled={seedingReports}
                              className="text-slate-500 hover:text-blue-600 border-slate-200"
                            >
                              {seedingReports ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              ) : (
                                "Add Sample Reports"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                            {reports.map((report) => (
                              <div
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all border border-slate-200/50 cursor-pointer group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="p-2 rounded bg-blue-100 text-blue-600">
                                    <FileText className="w-4 h-4 shrink-0" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                      {report.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {report.date} • {report.size}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReport(report);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteReport(report.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {activeSection === "documents" && (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <Card className="border-none shadow-md bg-white max-w-2xl">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-white/90" />
                          {t.patientDashboard.documents.yourDocuments}
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                          {loadingReports ? (
                            <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                          ) : (
                            reports.length
                          )}{" "}
                          {t.patientDashboard.documents.filesUploaded}
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
                        {t.patientDashboard.documents.upload}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Documents List */}
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
                            {t.patientDashboard.documents.noDocumentsYet}
                          </p>
                          <div className="pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400 mb-2">
                              Want to see sample documents?
                            </p>
                            <Button
                              onClick={handleRestoreMedicalReports}
                              variant="outline"
                              size="sm"
                              disabled={seedingReports}
                              className="text-slate-500 hover:text-blue-600"
                            >
                              {seedingReports ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Adding
                                  samples...
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
                            onClick={() => setSelectedReport(report)}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReport(report);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReport(report.id);
                                }}
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
                  onClose={() => setSelectedReport(null)}
                  report={selectedReport}
                />
              </div>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <PatientSettings />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Digital Twin Enlarged Modal */}
      <div
        id="digital-twin-modal"
        className="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-4xl w-full"
        >
          <button
            onClick={() => {
              const modal = document.getElementById('digital-twin-modal');
              if (modal) modal.classList.add('hidden');
            }}
            className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-3 shadow-2xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <div className="transform scale-110">
            <DigitalTwin sessions={sessions} loading={loadingSessions} />
          </div>
        </motion.div>
      </div>

      {/* AI Text Extraction Modal for Medical Reports */}
      <TextReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setCurrentReviewFile(null);
        }}
        onConfirm={handleReviewConfirm}
        file={currentReviewFile}
        mode="general"
      />
    </div>
  );
}
