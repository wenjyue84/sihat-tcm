"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Calendar, Activity, Sparkles, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Patient, PatientFlag } from "@/types/database";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { FlagSelect } from "@/components/ui/FlagSelect";

export default function PatientDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setPatient(data);
            } catch (error) {
                console.error("Error fetching patient", error);
                toast.error("Could not load patient details");
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [id]);

    const generateSummary = async () => {
        if (!patient) return;
        setGeneratingSummary(true);
        try {
            const res = await fetch('/api/ai/patient-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: patient.id })
            });

            if (!res.ok) throw new Error("Failed to generate details");

            const data = await res.json();

            // Update local state with new summary
            setPatient(prev => prev ? ({
                ...prev,
                clinical_summary: {
                    summary: data.summary,
                    generated_at: new Date().toISOString()
                }
            }) : null);

            toast.success("Summary updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate summary");
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleFlagChange = async (flag: PatientFlag) => {
        if (!patient) return;
        try {
            const { error } = await supabase
                .from('patients')
                .update({ flag })
                .eq('id', patient.id);

            if (error) throw error;

            setPatient(prev => prev ? ({ ...prev, flag }) : null);
            toast.success(`Patient marked as ${flag}`);
        } catch (error) {
            console.error('Error updating flag:', error);
            toast.error("Failed to update status");
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading patient record...</div>;
    if (!patient) return <div className="p-12 text-center text-red-500">Patient not found</div>;

    const age = patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 'N/A';

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-auto">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/doctor/patients">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {patient.first_name} {patient.last_name}
                            <Badge variant={patient.type === 'registered' ? 'default' : 'secondary'}>
                                {patient.type}
                            </Badge>
                            <Badge variant="outline" className={
                                patient.status === 'active' ? 'text-green-600 border-green-200 bg-green-50' : ''
                            }>
                                {patient.status}
                            </Badge>
                        </h1>
                    </div>
                    <div className="ml-auto flex gap-2 items-center">
                        <FlagSelect
                            value={patient.flag}
                            onValueChange={handleFlagChange}
                        />
                        {patient.type === 'managed' && (
                            <Button variant="outline" className="gap-2">
                                <Mail className="w-4 h-4" />
                                Invite to Register
                            </Button>
                        )}
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                            Start Diagnosis
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Demographics & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Demographics Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Patient Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-sm text-slate-500">Age</div>
                                    <div className="font-medium">{age} years</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500">Gender</div>
                                    <div className="font-medium capitalize">{patient.gender || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500">IC / ID</div>
                                    <div className="font-medium">{patient.ic_no || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500">Contact</div>
                                    <div className="font-medium">{patient.phone || '-'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Summary Card */}
                    <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-medium text-indigo-600 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> AI Clinical Summary
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateSummary}
                                disabled={generatingSummary}
                                className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${generatingSummary ? 'animate-spin' : ''}`} />
                                {patient.clinical_summary ? 'Refresh' : 'Generate'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {patient.clinical_summary ? (
                                <div className="prose prose-sm prose-indigo max-w-none">
                                    <ReactMarkdown>{patient.clinical_summary.summary}</ReactMarkdown>
                                    <div className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">
                                        Generated on {new Date(patient.clinical_summary.generated_at).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    <Sparkles className="w-8 h-8 text-indigo-200 mx-auto mb-2" />
                                    No summary generated yet. Click generate to analyze patient history.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: History / Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Visit History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-slate-500 text-center py-4">
                                {patient.user_id ? "View full history in History tab (coming soon)" : "No linked account history."}
                            </div>
                            {/* Placeholder for history list */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
