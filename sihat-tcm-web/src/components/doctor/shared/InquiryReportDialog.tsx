"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Inquiry } from "@/lib/mock/doctorDashboard";
import type { ResolvedProfile } from "./utils";

interface InquiryReportDialogProps {
  inquiry: Inquiry;
  patientProfile: ResolvedProfile;
  trigger?: React.ReactNode;
}

export function InquiryReportDialog({
  inquiry,
  patientProfile,
  trigger,
}: InquiryReportDialogProps) {
  const diagnosis = inquiry.diagnosis_report;

  if (!diagnosis) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="bg-white w-full sm:w-auto shrink-0">
            <FileText className="w-4 h-4 mr-1" />
            View Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[85vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Full Diagnosis Report
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis for {patientProfile?.full_name || "Patient"}
            <span className="block text-xs mt-1 border-t pt-1 border-slate-100">
              {format(new Date(inquiry.created_at), "PPP p")}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {/* Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-slate-100">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
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
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
              <Stethoscope className="w-4 h-4 text-blue-600" /> Chief Complaints
            </h4>
            <p className="text-gray-700 leading-relaxed">{inquiry.symptoms}</p>
          </div>

          {/* Diagnosis Details */}
          {diagnosis.summary && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold mb-2 text-green-800">TCM Pattern Diagnosis</h4>
              <p className="text-green-700 font-medium text-lg leading-snug">{diagnosis.summary}</p>
              {diagnosis.tcmPattern && (
                <p className="text-green-600 mt-1 font-serif text-lg">{diagnosis.tcmPattern}</p>
              )}
            </div>
          )}

          {/* Observations */}
          <div className="grid md:grid-cols-2 gap-4">
            {diagnosis.tongueObservation && (
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                <h4 className="font-semibold mb-2 text-pink-800">Tongue Observation</h4>
                <p className="text-gray-700">{diagnosis.tongueObservation}</p>
              </div>
            )}
            {diagnosis.pulseObservation && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="font-semibold mb-2 text-purple-800">Pulse Observation</h4>
                <p className="text-gray-700">{diagnosis.pulseObservation}</p>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {diagnosis.recommendations && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h4 className="font-semibold mb-2 text-amber-800">Recommendations & Treatment</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {Array.isArray(diagnosis.recommendations) ? (
                  diagnosis.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="leading-relaxed">
                      {rec}
                    </li>
                  ))
                ) : (
                  <li className="leading-relaxed">{diagnosis.recommendations}</li>
                )}
              </ul>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details className="bg-gray-100 rounded-lg border border-gray-200">
            <summary className="p-3 cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium select-none">
              View Raw Report Data
            </summary>
            <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono bg-white m-2 rounded border border-gray-100 shadow-inner">
              {JSON.stringify(diagnosis, null, 2)}
            </pre>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
