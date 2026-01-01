"use client";

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
import { User, Stethoscope, FileText } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { FlagBadge } from "@/components/ui/FlagBadge";
import { PatientFlagUpdate } from "@/components/doctor/PatientFlagUpdate";
import type { PatientFlag } from "@/types/database";
import type { Inquiry } from "@/lib/mock/doctorDashboard";

interface PatientCardProps {
    inquiry: Inquiry;
    onUpdateFlag: (profileId: string, flag: PatientFlag) => void;
}

interface ResolvedProfile {
    id?: string;
    full_name: string;
    age: number | string;
    gender: string;
    flag?: PatientFlag;
    isManaged?: boolean;
}

function resolvePatientProfile(inquiry: Inquiry): ResolvedProfile {
    const dbProfile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
    const dbPatient = Array.isArray(inquiry.patients) ? inquiry.patients[0] : inquiry.patients;
    const diagnosis = inquiry.diagnosis_report;

    // Resolve patient identity prioritizing specific sources
    if (diagnosis?.patient_profile) {
        return {
            full_name: diagnosis.patient_profile.name,
            age: diagnosis.patient_profile.age,
            gender: diagnosis.patient_profile.gender,
            flag: dbProfile?.flag || dbPatient?.flag
        };
    }

    if (dbProfile) {
        return {
            id: dbProfile.id,
            full_name: dbProfile.full_name,
            age: dbProfile.age,
            gender: dbProfile.gender,
            flag: dbProfile.flag
        };
    }

    if (dbPatient) {
        return {
            id: dbPatient.id,
            full_name: `${dbPatient.first_name} ${dbPatient.last_name || ''}`.trim(),
            age: dbPatient.birth_date ? differenceInYears(new Date(), new Date(dbPatient.birth_date)) : 'N/A',
            gender: dbPatient.gender,
            flag: dbPatient.flag,
            isManaged: true
        };
    }

    return { full_name: "Anonymous Patient", age: "?", gender: "Unknown" };
}

export function PatientCard({ inquiry, onUpdateFlag }: PatientCardProps) {
    const dbProfile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
    const patientProfile = resolvePatientProfile(inquiry);
    const diagnosis = inquiry.diagnosis_report;

    return (
        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
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
                                        currentFlag={dbProfile?.flag}
                                        onUpdate={(flag) => onUpdateFlag(dbProfile.id, flag)}
                                    />
                                ) : (
                                    <FlagBadge flag={patientProfile?.flag} />
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
                            <ReportDialog
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

interface ReportDialogProps {
    inquiry: Inquiry;
    patientProfile: ResolvedProfile;
    diagnosis: NonNullable<Inquiry["diagnosis_report"]>;
}

function ReportDialog({ inquiry, patientProfile, diagnosis }: ReportDialogProps) {
    return (
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
    );
}
