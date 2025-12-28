"use client";

import { TreatmentRecord } from "@/types/database";
import { format } from "date-fns";
import { Pill, Syringe, ChevronRight, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FlagBadge } from "@/components/ui/FlagBadge";
import { Button } from "@/components/ui/button";

interface TreatmentListProps {
    treatments: TreatmentRecord[];
    isLoading?: boolean;
    onTreatmentClick?: (treatment: TreatmentRecord) => void;
}

export function TreatmentList({ treatments, isLoading, onTreatmentClick }: TreatmentListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (treatments.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Syringe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No active treatment plans found.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {treatments.map((treatment) => (
                <div
                    key={treatment.id}
                    onClick={() => onTreatmentClick?.(treatment)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${treatment.status === 'completed' ? 'bg-green-100 text-green-600' :
                            treatment.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {treatment.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                treatment.status === 'active' ? <Syringe className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                {treatment.patient_name}
                                <FlagBadge flag={treatment.flag} />
                            </h3>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <span>{format(new Date(treatment.date), "MMM d, yyyy")}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{treatment.diagnosis}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant={
                            treatment.status === 'completed' ? 'secondary' :
                                treatment.status === 'active' ? 'default' : 'outline'
                        } className={
                            treatment.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''
                        }>
                            {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
                        </Badge>
                        <div className="w-px h-8 bg-slate-100 mx-2 hidden md:block" />
                        <div className="hidden md:block text-sm text-slate-600 max-w-xs truncate w-48">
                            {treatment.treatment_plan}
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
