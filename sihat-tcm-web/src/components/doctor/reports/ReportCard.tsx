"use client";

import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Stethoscope } from "lucide-react";
import type { Inquiry, PatientProfile, DiagnosisReport } from "@/lib/mock/doctorReports";

interface ReportCardProps {
    inquiry: Inquiry;
}

/**
 * Extracts the patient profile from an inquiry, preferring diagnosis_report.patient_profile
 */
function getPatientProfile(inquiry: Inquiry): PatientProfile | null {
    const dbProfile = Array.isArray(inquiry.profiles)
        ? inquiry.profiles[0]
        : inquiry.profiles;
    const diagnosis = inquiry.diagnosis_report;

    // Prefer patient_profile from diagnosis_report if available
    if (diagnosis?.patient_profile) {
        return {
            full_name: diagnosis.patient_profile.name,
            age: diagnosis.patient_profile.age,
            gender: diagnosis.patient_profile.gender,
        };
    }
    return dbProfile;
}

/**
 * Individual report card component displaying patient info and diagnosis summary
 * Includes a dialog for viewing the full report
 */
export function ReportCard({ inquiry }: ReportCardProps): JSX.Element {
    const patientProfile = getPatientProfile(inquiry);
    const diagnosis = inquiry.diagnosis_report;

    return (
        <Card className="bg-white hover:shadow-md transition-shadow transition-all border-slate-200">
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

                            <ReportDetailDialog
                                inquiry={inquiry}
                                patientProfile={patientProfile}
                                diagnosis={diagnosis}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface ReportDetailDialogProps {
    inquiry: Inquiry;
    patientProfile: PatientProfile | null;
    diagnosis: DiagnosisReport;
}

/**
 * Full report dialog with detailed TCM diagnosis information
 */
function ReportDetailDialog({ inquiry, patientProfile, diagnosis }: ReportDetailDialogProps): JSX.Element {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 h-8"
                >
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
                            <p className="text-sm text-slate-600">
                                {patientProfile?.gender}, {patientProfile?.age} years old
                            </p>
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
                                        diagnosis.recommendations.map((rec: string, i: number) => (
                                            <li key={i}>{rec}</li>
                                        ))
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
    );
}
