"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay, differenceInYears } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  User,
  Stethoscope,
  FileText,
  X,
  Users,
  Activity,
  Clock,
  Filter,
  Loader2,
  AlertCircle
} from "lucide-react";
import { FlagBadge } from "@/components/ui/FlagBadge";
import { PatientFlagUpdate } from "@/components/doctor/PatientFlagUpdate";
import { PatientFlag } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Inquiry {
  id: string;
  created_at: string;
  symptoms: string;
  diagnosis_report: any;
  profiles: any;
  patients?: any;
}

// Mock data for demonstration when Supabase has no records
const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "mock-1",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Persistent headache, fatigue, and dizziness for the past week. Difficulty concentrating at work.",
    diagnosis_report: {
      summary: "Qi Deficiency with Blood Stasis",
      tcmPattern: "气虚血瘀证",
      recommendations: [
        "Rest adequately",
        "Acupuncture for Zusanli (ST36)",
        "Herbal formula: Bu Zhong Yi Qi Tang",
      ],
      tongueObservation: "Pale tongue with thin white coating",
      pulseObservation: "Weak and thready pulse",
    },
    profiles: { id: "p1", full_name: "Ahmad bin Hassan", age: 45, gender: "Male", flag: "Critical" },
  },
  {
    id: "mock-2",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Insomnia, heart palpitations, anxiety, and night sweats. Feeling restless especially at night.",
    diagnosis_report: {
      summary: "Heart Yin Deficiency with Empty Heat",
      tcmPattern: "心阴虚证",
      recommendations: [
        "Avoid spicy foods",
        "Meditation and relaxation",
        "Herbal formula: Tian Wang Bu Xin Dan",
      ],
      tongueObservation: "Red tongue tip with little coating",
      pulseObservation: "Rapid and thin pulse",
    },
    profiles: { id: "p2", full_name: "Siti Nurhaliza", age: 38, gender: "Female", flag: "High Priority" },
  },
  {
    id: "mock-3",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Lower back pain, knee weakness, frequent urination especially at night. Cold extremities.",
    diagnosis_report: {
      summary: "Kidney Yang Deficiency",
      tcmPattern: "肾阳虚证",
      recommendations: [
        "Avoid cold foods",
        "Keep lower back warm",
        "Herbal formula: Jin Gui Shen Qi Wan",
      ],
      tongueObservation: "Pale, puffy tongue with tooth marks",
      pulseObservation: "Deep and slow pulse",
    },
    profiles: { id: "p3", full_name: "Tan Wei Ming", age: 52, gender: "Male" },
  },
  {
    id: "mock-4",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Digestive issues, bloating after meals, loose stools, lack of appetite, and general weakness.",
    diagnosis_report: {
      summary: "Spleen Qi Deficiency with Dampness",
      tcmPattern: "脾气虚湿困证",
      recommendations: [
        "Eat warm, cooked foods",
        "Avoid dairy and raw foods",
        "Herbal formula: Shen Ling Bai Zhu San",
      ],
      tongueObservation: "Swollen tongue with thick greasy coating",
      pulseObservation: "Soggy and slippery pulse",
    },
    profiles: { id: "p4", full_name: "Priya Devi", age: 29, gender: "Female" },
  },
  {
    id: "mock-5",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Chronic cough with white phlegm, shortness of breath, catches cold easily, spontaneous sweating.",
    diagnosis_report: {
      summary: "Lung Qi Deficiency",
      tcmPattern: "肺气虚证",
      recommendations: [
        "Deep breathing exercises",
        "Avoid cold and windy weather",
        "Herbal formula: Yu Ping Feng San",
      ],
      tongueObservation: "Pale tongue with white coating",
      pulseObservation: "Weak and floating pulse",
    },
    profiles: { id: "p5", full_name: "Lee Mei Ling", age: 62, gender: "Female" },
  },
  {
    id: "mock-6",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Irritability, red eyes, headache on the sides, bitter taste in mouth, anger outbursts.",
    diagnosis_report: {
      summary: "Liver Fire Rising",
      tcmPattern: "肝火上炎证",
      recommendations: [
        "Stress management",
        "Avoid alcohol and spicy foods",
        "Herbal formula: Long Dan Xie Gan Tang",
      ],
      tongueObservation: "Red tongue with yellow coating on sides",
      pulseObservation: "Wiry and rapid pulse",
    },
    profiles: { id: "p6", full_name: "Raj Kumar", age: 41, gender: "Male" },
  },
  {
    id: "mock-7",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms:
      "Menstrual irregularities, breast tenderness before period, mood swings, sighing frequently.",
    diagnosis_report: {
      summary: "Liver Qi Stagnation",
      tcmPattern: "肝气郁结证",
      recommendations: ["Regular exercise", "Emotional expression", "Herbal formula: Xiao Yao San"],
      tongueObservation: "Normal color with thin coating",
      pulseObservation: "Wiry pulse especially on left side",
    },
    profiles: { id: "p7", full_name: "Fatimah binti Abdullah", age: 34, gender: "Female" },
  },
  {
    id: "mock-8",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Joint pain worse in cold and damp weather, stiffness in the morning, heavy limbs.",
    diagnosis_report: {
      summary: "Wind-Cold-Damp Bi Syndrome",
      tcmPattern: "风寒湿痹证",
      recommendations: [
        "Keep joints warm",
        "Gentle movement exercises",
        "Herbal formula: Du Huo Ji Sheng Tang",
      ],
      tongueObservation: "Pale tongue with white greasy coating",
      pulseObservation: "Tight and slippery pulse",
    },
    profiles: { id: "p8", full_name: "Lim Ah Kow", age: 68, gender: "Male" },
  },
];

export default function DoctorDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symptomFilter, setSymptomFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatientFlag | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  // Common symptom tags for quick filtering
  const symptomTags = ["Headache", "Fatigue", "Insomnia", "Pain", "Digestive", "Cough", "Anxiety"];

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      console.log("Starting fetchInquiries...");
      setLoading(true);

      // 1. Fetch diagnosis sessions (raw, no joins to avoid relationship errors)
      const { data: sessions, error: sessionError } = await supabase
        .from("diagnosis_sessions")
        .select(`
            id,
            created_at,
            primary_diagnosis,
            full_report,
            symptoms,
            user_id,
            patient_id
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (sessionError) throw sessionError;

      if (!sessions || sessions.length === 0) {
        console.log("No sessions found, using mock data");
        setUseMockData(true);
        setInquiries(MOCK_INQUIRIES);
        return;
      }

      // 2. Extract IDs for manual fetching
      const userIds = Array.from(new Set(sessions.map(s => s.user_id).filter(Boolean)));
      const patientIds = Array.from(new Set(sessions.map(s => s.patient_id).filter(Boolean)));

      // 3. Fetch Profiles (Handle missing flag column gracefully)
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, age, gender, flag")
          .in("id", userIds);

        if (profileError && profileError.code === "42703") {
          // Retry without flag if column missing
          console.warn("Flag column missing in profiles, fetching without it");
          const { data: retryProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, age, gender")
            .in("id", userIds);
          (retryProfiles || []).forEach((p: any) => profilesMap.set(p.id, p));
        } else {
          (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
        }
      }

      // 4. Fetch Managed Patients
      let patientsMap = new Map();
      if (patientIds.length > 0) {
        const { data: patients, error: patientError } = await supabase
          .from("patients")
          .select("id, first_name, last_name, birth_date, gender, flag")
          .in("id", patientIds);

        if (patientError && patientError.code === "42703") {
          // Retry without flag if column missing
          const { data: retryPatients } = await supabase
            .from("patients")
            .select("id, first_name, last_name, birth_date, gender")
            .in("id", patientIds);
          (retryPatients || []).forEach((p: any) => patientsMap.set(p.id, p));
        } else {
          (patients || []).forEach((p: any) => patientsMap.set(p.id, p));
        }
      }

      // 5. Join and Transform Data
      console.log("Transforming and joining data...");
      const transformedData: Inquiry[] = sessions.map(session => ({
        id: session.id,
        created_at: session.created_at,
        symptoms: Array.isArray(session.symptoms) ? session.symptoms.join(', ') : (session.symptoms || session.full_report?.analysis?.key_findings?.from_inquiry || 'No symptoms recorded'),
        diagnosis_report: session.full_report,
        profiles: session.user_id ? profilesMap.get(session.user_id) : null,
        patients: session.patient_id ? patientsMap.get(session.patient_id) : null
      }));

      console.log("Transformed data length:", transformedData.length);
      setUseMockData(false);
      setInquiries(transformedData);

    } catch (error: unknown) {
      // Handle different error types
      let errorDetails: Record<string, any> = {
        type: typeof error,
        isError: error instanceof Error,
        timestamp: new Date().toISOString()
      };

      if (error && typeof error === 'object') {
        const err = error as any;
        errorDetails = {
          ...errorDetails,
          message: err.message || err.msg || 'Unknown error',
          code: err.code || 'UNKNOWN',
        };
        if (error instanceof Error) {
          errorDetails.stack = err.stack;
        }
      } else {
        errorDetails.rawError = String(error);
      }

      console.error("❌ Error fetching diagnosis sessions:", errorDetails);
      console.warn("⚠️ Falling back to mock data...");
      setUseMockData(true);
      setInquiries(MOCK_INQUIRIES);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileFlag = async (profileId: string, flag: PatientFlag) => {
    // If it's mock data (mock-ID or p1, p2, etc), just update local state
    if (useMockData || profileId.startsWith('p') || profileId.startsWith('mock')) {
      setInquiries(prev => prev.map(inq => {
        const profiles = inq.profiles;
        if (Array.isArray(profiles)) {
          return { ...inq, profiles: profiles.map(p => p.id === profileId ? { ...p, flag } : p) };
        } else {
          if (!profiles) return inq;
          return profiles.id === profileId ? { ...inq, profiles: { ...profiles, flag } } : inq;
        }
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ flag })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setInquiries(prev => prev.map(inq => {
        const profiles = inq.profiles;
        if (Array.isArray(profiles)) {
          return { ...inq, profiles: profiles.map(p => p.id === profileId ? { ...p, flag } : p) };
        } else {
          // If profiles is null/undefined, don't update
          if (!profiles) return inq;
          return profiles.id === profileId ? { ...inq, profiles: { ...profiles, flag } } : inq;
        }
      }));
    } catch (err: any) {
      console.error("Error updating flag:", err.message || err);
    }
  };

  // Filter logic
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
      const patient = Array.isArray(inquiry.patients) ? inquiry.patients[0] : inquiry.patients;
      // Prefer patient_profile from diagnosis_report if available (for doctor entered patients)
      const reportProfile = inquiry.diagnosis_report?.patient_profile;
      const patientName = (
        reportProfile?.name ||
        profile?.full_name ||
        (patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : "") ||
        ""
      ).toLowerCase();

      const symptoms = inquiry.symptoms?.toLowerCase() || "";
      const diagnosisText = JSON.stringify(inquiry.diagnosis_report || {}).toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      // Filter by Flag
      if (flagFilter !== 'All') {
        const patientFlag = profile?.flag || patient?.flag;
        if (patientFlag !== flagFilter) return false;
      }

      // Keyword search (patient name, symptoms, diagnosis)
      if (searchQuery) {
        const matchesSearch =
          patientName.includes(searchLower) ||
          symptoms.includes(searchLower) ||
          diagnosisText.includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateFrom) {
        const fromDate = startOfDay(parseISO(dateFrom));
        const inquiryDate = parseISO(inquiry.created_at);
        if (isBefore(inquiryDate, fromDate)) return false;
      }

      if (dateTo) {
        const toDate = endOfDay(parseISO(dateTo));
        const inquiryDate = parseISO(inquiry.created_at);
        if (isAfter(inquiryDate, toDate)) return false;
      }

      // Symptom tag filter
      if (symptomFilter) {
        if (!symptoms.includes(symptomFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [inquiries, searchQuery, dateFrom, dateTo, symptomFilter, flagFilter]);



  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setDateTo("");
    setSymptomFilter("");
    setFlagFilter("All");
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || symptomFilter || flagFilter !== 'All';

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = inquiries.filter((i) => new Date(i.created_at) >= last7Days).length;
    const uniquePatients = new Set(
      inquiries.map((i) => {
        const p = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles;
        const reportProfile = i.diagnosis_report?.patient_profile;
        return reportProfile?.name || p?.full_name;
      })
    ).size;

    return {
      total: inquiries.length,
      recent: recentCount,
      uniquePatients,
    };
  }, [inquiries]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient records...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Top Header */}
      <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Patient History & Records Management</p>
        </div>
      </header>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-24 md:pb-20">
          {/* Mock Data Notice */}
          {useMockData && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-amber-800 font-medium">Demo Mode</p>
                <p className="text-amber-600 text-sm">
                  Showing sample patient records. Real data will appear once patients submit
                  inquiries.
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur border-blue-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.uniquePatients}</p>
                  <p className="text-sm text-gray-500">Unique Patients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-green-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Inquiries</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-purple-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.recent}</p>
                  <p className="text-sm text-gray-500">Last 7 Days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Section */}
          <Card className="mb-6 bg-white/90 backdrop-blur">
            <CardContent className="p-3 md:p-4">
              {/* Main Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search patients, symptoms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 md:h-11 bg-white text-sm md:text-base"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 h-10 md:h-auto w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4" />
                  <span className="sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </Button>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600 shrink-0">From:</span>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="flex-1 h-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 shrink-0 ml-6 sm:ml-0">To:</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="flex-1 h-9"
                      />
                    </div>
                  </div>

                  {/* Symptom Tags */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Quick Filter by Symptom:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {symptomTags.map((tag) => (
                        <Button
                          key={tag}
                          variant={symptomFilter === tag ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSymptomFilter(symptomFilter === tag ? "" : tag)}
                          className="h-8"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredInquiries.length} of {inquiries.length} records
            {hasActiveFilters && " (filtered)"}
          </div>

          {/* Patient Records List */}
          <div className="grid gap-4">
            {filteredInquiries.map((inquiry) => {
              const dbProfile = Array.isArray(inquiry.profiles)
                ? inquiry.profiles[0]
                : inquiry.profiles;
              const dbPatient = Array.isArray(inquiry.patients)
                ? inquiry.patients[0]
                : inquiry.patients;
              const diagnosis = inquiry.diagnosis_report;

              // Resolve patient identity prioritizing specific sources
              const patientProfile = diagnosis?.patient_profile
                ? {
                  full_name: diagnosis.patient_profile.name,
                  age: diagnosis.patient_profile.age,
                  gender: diagnosis.patient_profile.gender,
                  flag: dbProfile?.flag || dbPatient?.flag
                }
                : dbProfile
                  ? {
                    id: dbProfile.id,
                    full_name: dbProfile.full_name,
                    age: dbProfile.age,
                    gender: dbProfile.gender,
                    flag: dbProfile.flag
                  }
                  : dbPatient
                    ? {
                      id: dbPatient.id,
                      full_name: `${dbPatient.first_name} ${dbPatient.last_name || ''}`.trim(),
                      age: dbPatient.birth_date ? differenceInYears(new Date(), new Date(dbPatient.birth_date)) : 'N/A',
                      gender: dbPatient.gender,
                      flag: dbPatient.flag,
                      isManaged: true
                    }
                    : { full_name: "Anonymous Patient", age: "?", gender: "Unknown" };

              return (
                <Card
                  key={inquiry.id}
                  className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {patientProfile?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {patientProfile?.full_name || "Anonymous Patient"}
                            {/* Only show flag update if we have a real profile ID */}
                            {dbProfile?.id ? (
                              <PatientFlagUpdate
                                currentFlag={(dbProfile as any)?.flag}
                                onUpdate={(flag) => updateProfileFlag(dbProfile.id, flag)}
                              />
                            ) : (
                              <FlagBadge flag={(patientProfile as any)?.flag} />
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {patientProfile?.gender}, {patientProfile?.age} years old
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(inquiry.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Symptoms */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-500" />
                          Chief Complaints
                        </h4>
                        <p className="text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg text-sm leading-relaxed">
                          {inquiry.symptoms}
                        </p>
                      </div>

                      {/* Diagnosis Summary */}
                      {diagnosis && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                              TCM Diagnosis
                            </h4>
                            <p className="text-green-700 font-medium text-sm sm:text-base break-words">
                              {diagnosis.summary || diagnosis.tcmPattern || "Analysis Complete"}
                            </p>
                            {diagnosis.tcmPattern && diagnosis.summary && (
                              <p className="text-xs text-gray-500 mt-1 break-words">
                                {diagnosis.tcmPattern}
                              </p>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="bg-white w-full sm:w-auto shrink-0">
                                <FileText className="w-4 h-4 mr-1" />
                                View Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-[800px] max-h-[85vh] overflow-y-auto p-4 md:p-6">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  Full Diagnosis Report
                                </DialogTitle>
                                <DialogDescription>
                                  Comprehensive analysis for{" "}
                                  {patientProfile?.full_name || "Patient"}
                                  <span className="block text-xs mt-1">
                                    {format(new Date(inquiry.created_at), "PPP p")}
                                  </span>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-6">
                                {/* Patient Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Patient Information
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Name:</span>{" "}
                                      <span className="font-medium">{patientProfile?.full_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Age:</span>{" "}
                                      <span className="font-medium">{patientProfile?.age}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Gender:</span>{" "}
                                      <span className="font-medium">{patientProfile?.gender}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Chief Complaints */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-blue-600" /> Chief
                                    Complaints
                                  </h4>
                                  <p className="text-gray-700">{inquiry.symptoms}</p>
                                </div>

                                {/* Diagnosis Details */}
                                {diagnosis.summary && (
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-green-800">
                                      TCM Pattern Diagnosis
                                    </h4>
                                    <p className="text-green-700 font-medium text-lg">
                                      {diagnosis.summary}
                                    </p>
                                    {diagnosis.tcmPattern && (
                                      <p className="text-green-600 mt-1">
                                        {diagnosis.tcmPattern}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Observations */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  {diagnosis.tongueObservation && (
                                    <div className="bg-pink-50 p-4 rounded-lg">
                                      <h4 className="font-semibold mb-2 text-pink-800">
                                        Tongue Observation
                                      </h4>
                                      <p className="text-gray-700">
                                        {diagnosis.tongueObservation}
                                      </p>
                                    </div>
                                  )}
                                  {diagnosis.pulseObservation && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                      <h4 className="font-semibold mb-2 text-purple-800">
                                        Pulse Observation
                                      </h4>
                                      <p className="text-gray-700">
                                        {diagnosis.pulseObservation}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Recommendations */}
                                {diagnosis.recommendations && (
                                  <div className="bg-amber-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-amber-800">
                                      Recommendations
                                    </h4>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                                      {Array.isArray(diagnosis.recommendations) ? (
                                        diagnosis.recommendations.map(
                                          (rec: string, i: number) => <li key={i}>{rec}</li>
                                        )
                                      ) : (
                                        <li>{diagnosis.recommendations}</li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {/* Raw Data (Collapsible) */}
                                <details className="bg-gray-100 rounded-lg">
                                  <summary className="p-3 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                    View Raw Report Data
                                  </summary>
                                  <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                    {JSON.stringify(diagnosis, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredInquiries.length === 0 && (
              <Card className="bg-white/80">
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No patient records found</p>
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="mt-2 text-blue-600"
                    >
                      Clear filters to see all records
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
