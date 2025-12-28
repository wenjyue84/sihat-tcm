"use client";

import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2, Syringe, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { TreatmentRecord } from "@/types/database";
import { TreatmentList } from "@/components/doctor/treatment/TreatmentList";
import { Input } from "@/components/ui/input";
import { TreatmentDetailsDialog } from "@/components/doctor/treatment/TreatmentDetailsDialog";

export default function DoctorTreatmentPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTreatment, setSelectedTreatment] = useState<TreatmentRecord | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchTreatments = useCallback(async () => {
        try {
            setLoading(true);
            // 1. Fetch diagnosis sessions (raw)
            const { data: sessions, error } = await supabase
                .from('diagnosis_sessions')
                .select(`
                    id,
                    primary_diagnosis,
                    treatment_plan,
                    created_at,
                    is_guest_session,
                    guest_name,
                    user_id
                `)
                .not('treatment_plan', 'is', null) // Only show sessions with treatment plans
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // 2. Fetch patient profiles
            const userIds = Array.from(new Set((sessions || []).map(s => s.user_id).filter(Boolean)));
            const profilesMap = new Map();

            if (userIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    // distinct selection to avoid duplicates
                    .select('id, full_name, flag')
                    .in('id', userIds);

                if (profileError && profileError.code === "42703") {
                    // Retry without flag if missing
                    const { data: retryProfiles } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', userIds);
                    (retryProfiles || []).forEach((p: any) => profilesMap.set(p.id, p));
                } else {
                    (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
                }
            }

            const formattedTreatments: TreatmentRecord[] = (sessions || []).map(session => {
                const patient = session.user_id ? profilesMap.get(session.user_id) : null;
                return {
                    id: session.id,
                    patient_name: session.is_guest_session ? (session.guest_name || 'Guest User') : (patient?.full_name || 'Unknown Patient'),
                    diagnosis: session.primary_diagnosis,
                    treatment_plan: session.treatment_plan || 'No plan recorded',
                    date: session.created_at,
                    status: 'active', // Default to active
                    flag: patient?.flag // Inherit flag
                };
            });

            setTreatments(formattedTreatments);
        } catch (error) {
            console.error("Error fetching treatments:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && (!profile || profile.role !== "doctor")) {
            router.push("/doctor");
            return;
        }

        if (profile) {
            fetchTreatments();
        }
    }, [profile, authLoading, router, fetchTreatments]);

    const filteredTreatments = treatments.filter(t =>
        t.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (!profile || profile.role !== "doctor") return null;

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            <header className="mb-6 flex-none">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Syringe className="w-6 h-6 text-blue-600" />
                            Treatment Plans
                        </h1>
                        <p className="text-slate-500">Manage patient protocols and prescriptions</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by patient or diagnosis..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <TreatmentList
                    treatments={filteredTreatments}
                    isLoading={loading}
                    onTreatmentClick={(t) => {
                        setSelectedTreatment(t);
                        setDetailsOpen(true);
                    }}
                />
            </div>

            <TreatmentDetailsDialog
                treatment={selectedTreatment}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onUpdate={fetchTreatments}
            />
        </div>
    );
}
