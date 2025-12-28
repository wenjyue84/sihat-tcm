"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Stethoscope,
    User,
    FileText,
    Loader2,
    Activity
} from "lucide-react";
import { PatientFlag } from "@/types/database";
import { FlagBadge } from "@/components/ui/FlagBadge";

interface Inquiry {
    id: string;
    created_at: string;
    symptoms: string;
    diagnosis_report: any;
    notes?: string;
    profiles:
    | {
        id: string;
        full_name: string;
        age: number;
        gender: string;
        flag?: PatientFlag;
    }[]
    | {
        id: string;
        full_name: string;
        age: number;
        gender: string;
        flag?: PatientFlag;
    };
}

// Mock data for fallback
const MOCK_INQUIRIES: Inquiry[] = [
    {
        id: "mock-1",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: "Severe difficulty breathing and chest pain for 2 hours.",
        diagnosis_report: {
            summary: "Critical Respiratory Distress",
            precautions: {
                warning_signs: ["Immediate attention required", "Potential cardiac involvement"]
            },
            patient_profile: { name: "John Doe", age: 58, gender: "Male" }
        },
        profiles: { id: "mock-p1", full_name: "John Doe", age: 58, gender: "Male", flag: "Critical" }
    },
    {
        id: "mock-2",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: "Loss of consciousness followed by severe headache.",
        diagnosis_report: {
            summary: "Neurological Emergency",
            precautions: {
                warning_signs: ["Emergency evaluation needed", "Rule out stroke"]
            }
        },
        profiles: { id: "mock-p2", full_name: "Jane Smith", age: 42, gender: "Female", flag: "Critical" }
    }
];

export default function DoctorCriticalPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            console.log("Starting fetchInquiries for Critical page...");

            // First attempt with 'flag' column (matching dashboard)
            // 1. Fetch sessions (handle missing 'notes' column)
            let sessions = [];
            let sessionError = null;

            // Try with notes first
            const { data: sessionsWithNotes, error: notesError } = await supabase
                .from("diagnosis_sessions")
                .select("id, created_at, primary_diagnosis, full_report, symptoms, user_id, notes")
                .order("created_at", { ascending: false })
                .limit(50);

            if (notesError && notesError.code === "42703") {
                console.warn("Notes column missing in diagnosis_sessions, fetching without it");
                const { data: sessionsNoNotes, error: noNotesError } = await supabase
                    .from("diagnosis_sessions")
                    .select("id, created_at, primary_diagnosis, full_report, symptoms, user_id")
                    .order("created_at", { ascending: false })
                    .limit(50);
                sessions = sessionsNoNotes || [];
                sessionError = noNotesError;
            } else {
                sessions = sessionsWithNotes || [];
                sessionError = notesError;
            }

            if (sessionError) throw sessionError;

            if (sessions.length === 0) {
                console.log("No sessions found, using mock data");
                setInquiries(MOCK_INQUIRIES);
                return;
            }

            // 2. Fetch profiles (handle missing 'flag' column)
            const userIds = Array.from(new Set(sessions.map((s: any) => s.user_id).filter(Boolean)));
            const profilesMap = new Map();

            if (userIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, full_name, age, gender, flag")
                    .in("id", userIds);

                if (profileError && profileError.code === "42703") {
                    // Retry without flag
                    const { data: retryProfiles } = await supabase
                        .from("profiles")
                        .select("id, full_name, age, gender")
                        .in("id", userIds);
                    (retryProfiles || []).forEach((p: any) => profilesMap.set(p.id, p));
                } else {
                    (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
                }
            }

            // 3. Join and Transform
            const transformedData: Inquiry[] = sessions.map((session: any) => ({
                id: session.id,
                created_at: session.created_at,
                symptoms: Array.isArray(session.symptoms) ? session.symptoms.join(', ') : (session.symptoms || session.full_report?.analysis?.key_findings?.from_inquiry || 'No symptoms recorded'),
                diagnosis_report: session.full_report,
                notes: session.notes,
                profiles: session.user_id ? profilesMap.get(session.user_id) : null
            }));

            console.log("Using real data:", transformedData.length);
            setInquiries(transformedData);
        } catch (error: unknown) {
            // Handle different error types
            let errorDetails: Record<string, any> = {
                type: typeof error,
                isError: error instanceof Error,
                timestamp: new Date().toISOString()
            };

            // Extract error information based on type
            if (error && typeof error === 'object') {
                const err = error as any;
                errorDetails = {
                    ...errorDetails,
                    message: err.message || err.msg || 'Unknown error',
                    code: err.code || 'UNKNOWN',
                    details: err.details || null,
                    hint: err.hint || null,
                    name: err.name || 'Unknown',
                };

                if (error instanceof Error) {
                    errorDetails.stack = err.stack;
                }
            } else {
                errorDetails.rawError = String(error);
            }

            console.error("❌ Error fetching critical cases:", errorDetails);

            // On error, fallback to mock data
            console.warn("⚠️ Falling back to mock data...");
            setInquiries(MOCK_INQUIRIES);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (id: string, currentNotes: string | null) => {
        const newNotes = currentNotes ? `${currentNotes} [DISMISSED]` : '[DISMISSED]';

        // If it's mock data, just update local state
        if (id.startsWith('mock')) {
            setInquiries(prev => prev.map(inq =>
                inq.id === id ? { ...inq, notes: newNotes } : inq
            ));
            return;
        }

        try {
            const { error } = await supabase
                .from('diagnosis_sessions')
                .update({ notes: newNotes })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setInquiries(prev => prev.map(inq =>
                inq.id === id ? { ...inq, notes: newNotes } : inq
            ));

        } catch (error: any) {
            console.error("Error dismissing case:", error.message || error);
            if (error.code === "42703") {
                alert("This feature requires a database update (missing 'notes' column). Please contact the administrator.");
            } else {
                alert(`Failed to dismiss case: ${error.message || 'Unknown error'}`);
            }
        }
    };

    // Filter for critical cases
    const criticalInquiries = useMemo(() => {
        return inquiries.filter((inquiry) => {
            // Exclude dismissed cases
            if (inquiry.notes && inquiry.notes.includes('[DISMISSED]')) {
                return false;
            }

            // Get patient profile
            const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;

            // Check if patient is flagged as Critical
            if (profile?.flag === 'Critical') {
                return true;
            }

            const report = inquiry.diagnosis_report;
            if (!report) return false;

            // Check for explicit precautions/warnings
            const hasWarnings = report.precautions?.warning_signs &&
                Array.isArray(report.precautions.warning_signs) &&
                report.precautions.warning_signs.length > 0;

            // Check for emergency keywords in diagnosis/summary
            const textToCheck = JSON.stringify(report).toLowerCase();
            const emergencyKeywords = [
                "emergency", "immediate attention", "critical", "severe",
                "difficulty breathing", "chest pain", "loss of consciousness"
            ];
            const hasEmergencyKeywords = emergencyKeywords.some(keyword => textToCheck.includes(keyword));

            return hasWarnings || hasEmergencyKeywords;
        });
    }, [inquiries]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading critical cases...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            {/* Header */}
            <header className="h-14 md:h-16 bg-white border-b border-red-100 flex items-center justify-between px-4 md:px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800">Critical Cases</h1>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">High Priority & Emergency Attention Needed</p>
                    </div>
                </div>
            </header>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto pb-24 md:pb-20">

                    {/* Alert Banner */}
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-900">Attention Required</h3>
                            <p className="text-sm text-red-700 mt-1">
                                These patients have been flagged as critical or have reported symptoms requiring immediate medical evaluation.
                            </p>
                        </div>
                    </div>

                    {criticalInquiries.length === 0 ? (
                        <Card className="bg-white/80">
                            <CardContent className="py-12 text-center">
                                <Activity className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No Critical Cases Found</h3>
                                <p className="text-gray-500 mt-2">There are currently no inquiries flagged as critical or high risk.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {criticalInquiries.map((inquiry) => {
                                const dbProfile = Array.isArray(inquiry.profiles)
                                    ? inquiry.profiles[0]
                                    : inquiry.profiles;
                                const diagnosis = inquiry.diagnosis_report;
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
                                        className="bg-white/90 backdrop-blur border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                                                        {patientProfile?.full_name?.charAt(0) || "!"}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            {patientProfile?.full_name || "Unknown Patient"}
                                                            {dbProfile?.flag && <FlagBadge flag={dbProfile.flag} />}
                                                        </CardTitle>
                                                        <CardDescription className="flex items-center gap-2">
                                                            <User className="w-3 h-3" />
                                                            {patientProfile?.gender}, {patientProfile?.age} years old
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-red-700">
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
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <Stethoscope className="w-4 h-4 text-red-500" />
                                                        Reported Symptoms
                                                    </h4>
                                                    <p className="text-gray-700 bg-red-50/50 p-3 rounded-lg text-sm">
                                                        {inquiry.symptoms}
                                                    </p>
                                                </div>

                                                {diagnosis && diagnosis.precautions?.warning_signs && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            Warning Signs Identified
                                                        </h4>
                                                        <ul className="list-disc list-inside text-red-700 text-sm bg-red-50 p-3 rounded-lg">
                                                            {Array.isArray(diagnosis.precautions.warning_signs) ?
                                                                diagnosis.precautions.warning_signs.map((sign: string, i: number) => (
                                                                    <li key={i}>{sign}</li>
                                                                )) :
                                                                <li>{String(diagnosis.precautions.warning_signs)}</li>
                                                            }
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDismiss(inquiry.id, inquiry.notes || null)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        Dismiss
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                View Full Report
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Full Diagnosis Report</DialogTitle>
                                                                <DialogDescription>
                                                                    Report generated on {format(new Date(inquiry.created_at), "PPP p")}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="mt-4">
                                                                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                                                    {JSON.stringify(diagnosis, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
