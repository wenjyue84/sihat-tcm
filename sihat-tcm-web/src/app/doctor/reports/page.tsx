"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";
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
    Filter,
    Loader2,
    ArrowLeft,
} from "lucide-react";

interface Inquiry {
    id: string;
    created_at: string;
    symptoms: string;
    diagnosis_report: any;
    profiles:
    | {
        full_name: string;
        age: number;
        gender: string;
    }[]
    | {
        full_name: string;
        age: number;
        gender: string;
    };
}

// Mock data (shared with dashboard for consistency)
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
        profiles: { full_name: "Ahmad bin Hassan", age: 45, gender: "Male" },
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
        profiles: { full_name: "Siti Nurhaliza", age: 38, gender: "Female" },
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
        profiles: { full_name: "Tan Wei Ming", age: 52, gender: "Male" },
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
        profiles: { full_name: "Priya Devi", age: 29, gender: "Female" },
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
        profiles: { full_name: "Lee Mei Ling", age: 62, gender: "Female" },
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
        profiles: { full_name: "Raj Kumar", age: 41, gender: "Male" },
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
        profiles: { full_name: "Fatimah binti Abdullah", age: 34, gender: "Female" },
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
        profiles: { full_name: "Lim Ah Kow", age: 68, gender: "Male" },
    },
];

export default function DoctorReportsPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [useMockData, setUseMockData] = useState(false);
    const { loading: authLoading } = useAuth();
    const router = useRouter();

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [symptomFilter, setSymptomFilter] = useState("");
    const [showFilters, setShowFilters] = useState(true); // Default open on Reports page

    // Common symptom tags for quick filtering
    const symptomTags = ["Headache", "Fatigue", "Insomnia", "Pain", "Digestive", "Cough", "Anxiety"];

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            // Try diagnosis_sessions first
            const { data: sessions, error: sessionError } = await supabase
                .from("diagnosis_sessions")
                .select("id, created_at, primary_diagnosis, full_report, symptoms, user_id")
                .order("created_at", { ascending: false });

            let sessionInquiries: any[] = [];

            if (!sessionError && sessions && sessions.length > 0) {
                // Fetch profiles manually
                const userIds = Array.from(new Set(sessions.map(s => s.user_id).filter(Boolean)));
                const profilesMap = new Map();

                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, full_name, age, gender")
                        .in("id", userIds);
                    (profiles || []).forEach(p => profilesMap.set(p.id, p));
                }

                sessionInquiries = sessions.map(session => ({
                    id: session.id,
                    created_at: session.created_at,
                    symptoms: Array.isArray(session.symptoms) ? session.symptoms.join(', ') : (session.symptoms || session.primary_diagnosis),
                    diagnosis_report: session.full_report,
                    profiles: session.user_id ? profilesMap.get(session.user_id) : null
                }));

                setInquiries(sessionInquiries);
            }

            // If diagnosis_sessions failed or returned specific error, try inquiries
            // But if we got data successfully, we can skip this or merge? 
            // The original logic was: IF error OR empty, try inquiries.

            if (sessionError || !sessions || sessions.length === 0) {
                if (sessionError) {
                    console.warn("Error fetching from diagnosis_sessions, falling back to inquiries:", sessionError.message);
                }

                const { data: inqData, error: inqError } = await supabase
                    .from("inquiries")
                    .select(
                        `
                        id,
                        created_at,
                        symptoms,
                        diagnosis_report,
                        profiles (
                            full_name,
                            age,
                            gender
                        )
                    `
                    )
                    .order("created_at", { ascending: false });

                if (inqError) throw inqError;

                if (!inqData || inqData.length === 0) {
                    setUseMockData(true);
                    setInquiries(MOCK_INQUIRIES);
                } else {
                    setInquiries(inqData);
                }
            }
        } catch (error) {
            console.error("Error fetching inquiries:", error);
            // On error, fallback to mock data
            setUseMockData(true);
            setInquiries(MOCK_INQUIRIES);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredInquiries = useMemo(() => {
        return inquiries.filter((inquiry) => {
            const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
            // Prefer patient_profile from diagnosis_report if available (for doctor entered patients)
            const reportProfile = inquiry.diagnosis_report?.patient_profile;
            const patientName = (reportProfile?.name || profile?.full_name || "").toLowerCase();

            const symptoms = inquiry.symptoms?.toLowerCase() || "";
            const diagnosisText = JSON.stringify(inquiry.diagnosis_report || {}).toLowerCase();
            const searchLower = searchQuery.toLowerCase();

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
    }, [inquiries, searchQuery, dateFrom, dateTo, symptomFilter]);

    const clearFilters = () => {
        setSearchQuery("");
        setDateFrom("");
        setDateTo("");
        setSymptomFilter("");
    };

    const hasActiveFilters = searchQuery || dateFrom || dateTo || symptomFilter;

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            {/* Top Header */}
            <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800">Medical Reports</h1>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">View and manage patient diagnosis histories</p>
                    </div>
                </div>
            </header>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto pb-24 md:pb-20">

                    {/* Search & Filter Section */}
                    <Card className="mb-6 bg-white/90 backdrop-blur sticky top-0 z-10 shadow-sm">
                        <CardContent className="p-3 md:p-4">
                            {/* Main Search Bar */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder="Search patients, conditions, symptoms..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 md:h-11 bg-white text-sm md:text-base border-slate-200 focus:border-blue-300 ring-0 focus:ring-2 focus:ring-blue-100"
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
                                            Quick Filter by Condition:
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
                    <div className="mb-4 text-sm text-gray-600 font-medium">
                        Found {filteredInquiries.length} records
                        {hasActiveFilters && " (filtered)"}
                    </div>

                    {/* Patient Records List */}
                    <div className="grid gap-4">
                        {filteredInquiries.map((inquiry) => {
                            const dbProfile = Array.isArray(inquiry.profiles)
                                ? inquiry.profiles[0]
                                : inquiry.profiles;
                            const diagnosis = inquiry.diagnosis_report;
                            // Prefer patient_profile from diagnosis_report if available
                            const patientProfile = diagnosis?.patient_profile
                                ? {
                                    full_name: diagnosis.patient_profile.name,
                                    age: diagnosis.patient_profile.age,
                                    gender: diagnosis.patient_profile.gender,
                                }
                                : dbProfile;

                            return (
                                <Card
                                    key={inquiry.id}
                                    className="bg-white hover:shadow-md transition-shadow transition-all border-slate-200"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                    {patientProfile?.full_name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-semibold text-slate-800">
                                                        {patientProfile?.full_name || "Anonymous Patient"}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2 text-xs">
                                                        <span className="capitalize">{patientProfile?.gender}</span>
                                                        <span>•</span>
                                                        <span>{patientProfile?.age} years old</span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-1">
                                                    <p className="text-xs font-medium text-slate-700">
                                                        {format(new Date(inquiry.created_at), "dd MMM yyyy")}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    {format(new Date(inquiry.created_at), "h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-4">
                                            {/* Diagnosis Summary */}
                                            {diagnosis && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                            Diagnosis
                                                        </h4>
                                                        {diagnosis.tcmPattern && (
                                                            <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-serif">
                                                                {diagnosis.tcmPattern}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-800 font-medium text-sm mb-3">
                                                        {diagnosis.summary || "Analysis Complete"}
                                                    </p>

                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 h-8">
                                                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                                View Full Report
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="w-[95vw] max-w-[800px] max-h-[85vh] overflow-y-auto p-4 md:p-6">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                                    Medical Report
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    ID: {inquiry.id.slice(0, 8)} • {format(new Date(inquiry.created_at), "PPpp")}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="mt-4 space-y-6">
                                                                {/* Patient Info */}
                                                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold text-slate-700 shadow-sm border border-slate-200">
                                                                        {patientProfile?.full_name?.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-bold text-lg text-slate-800">{patientProfile?.full_name}</h3>
                                                                        <p className="text-sm text-slate-600">{patientProfile?.gender}, {patientProfile?.age} years old</p>
                                                                    </div>
                                                                </div>

                                                                {/* Chief Complaints */}
                                                                <div>
                                                                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
                                                                        <Stethoscope className="w-4 h-4 text-blue-600" /> Reported Symptoms
                                                                    </h4>
                                                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-slate-700 leading-relaxed">
                                                                        {inquiry.symptoms}
                                                                    </div>
                                                                </div>

                                                                {/* Diagnosis Details */}
                                                                {diagnosis.summary && (
                                                                    <div className="border border-green-100 bg-green-50/30 rounded-lg overflow-hidden">
                                                                        <div className="bg-green-50/80 px-4 py-2 border-b border-green-100">
                                                                            <h4 className="font-semibold text-green-800 flex items-center gap-2">
                                                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                                TCM Diagnosis
                                                                            </h4>
                                                                        </div>
                                                                        <div className="p-4">
                                                                            <p className="text-green-900 font-medium text-lg leading-snug">
                                                                                {diagnosis.summary}
                                                                            </p>
                                                                            {diagnosis.tcmPattern && (
                                                                                <p className="text-green-700 mt-1 font-serif text-lg">
                                                                                    {diagnosis.tcmPattern}
                                                                                </p>
                                                                            )}

                                                                            <div className="mt-4 grid md:grid-cols-2 gap-4">
                                                                                {diagnosis.tongueObservation && (
                                                                                    <div className="bg-white p-3 rounded border border-green-100">
                                                                                        <span className="text-xs font-bold text-green-600 uppercase">Tongue</span>
                                                                                        <p className="text-sm text-slate-700 mt-1">{diagnosis.tongueObservation}</p>
                                                                                    </div>
                                                                                )}
                                                                                {diagnosis.pulseObservation && (
                                                                                    <div className="bg-white p-3 rounded border border-green-100">
                                                                                        <span className="text-xs font-bold text-green-600 uppercase">Pulse</span>
                                                                                        <p className="text-sm text-slate-700 mt-1">{diagnosis.pulseObservation}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Recommendations */}
                                                                {diagnosis.recommendations && (
                                                                    <div>
                                                                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
                                                                            <FileText className="w-4 h-4 text-amber-600" /> Treatment Plan
                                                                        </h4>
                                                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                                                            <ul className="list-disc list-inside text-slate-700 space-y-1.5">
                                                                                {Array.isArray(diagnosis.recommendations) ? (
                                                                                    diagnosis.recommendations.map(
                                                                                        (rec: string, i: number) => <li key={i}>{rec}</li>
                                                                                    )
                                                                                ) : (
                                                                                    <li>{diagnosis.recommendations}</li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                )}
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
                            <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-none">
                                <CardContent className="py-12 text-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                        <Search className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700">No reports found</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mt-1">
                                        Try adjusting your search filters or check back later for new patient inquiries.
                                    </p>
                                    {hasActiveFilters && (
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="mt-4"
                                        >
                                            Clear Filters
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
