"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  History,
  Activity,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPatientHistory } from "@/lib/actions";
import { DiagnosisSession } from "@/types/database";
import { useLanguage } from "@/stores/useAppStore";
import { format } from "date-fns";

export function PortfolioSymptoms() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    // Use lightweight mode to only fetch needed columns (avoids large JSON fields)
    const result = await getPatientHistory(20, 0, true); // Get last 20 sessions, lightweight mode
    if (result.success && result.data) {
      setSessions(result.data.filter((s) => s.symptoms && s.symptoms.length > 0));
    }
    setLoading(false);
  }

  return (
    <Card className="border-none shadow-md bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-xl pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              {t.patientDashboard_v1.healthPortfolio.symptomsHistory.title}
            </CardTitle>
            <CardDescription className="text-orange-50 opacity-90">
              {t.patientDashboard_v1.healthPortfolio.symptomsHistory.subtitle}
            </CardDescription>
          </div>
          <div className="hidden md:flex bg-orange-700/30 rounded-lg p-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "simple" ? "bg-white text-orange-700 shadow-sm" : "text-orange-100 hover:text-white hover:bg-orange-600/50"}`}
              onClick={() => setViewMode("simple")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${viewMode === "detailed" ? "bg-white text-orange-700 shadow-sm" : "text-orange-100 hover:text-white hover:bg-orange-600/50"}`}
              onClick={() => setViewMode("detailed")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>{t.common.loading}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 max-w-xs mx-auto">
              {t.patientDashboard_v1.healthPortfolio.symptomsHistory.noHistory}
            </p>
          </div>
        ) : viewMode === "simple" ? (
          <div className="rounded-md border border-slate-100 overflow-x-auto -mx-2 sm:mx-0">
            <Table className="min-w-[400px] sm:min-w-0">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[30%] sm:w-[20%]">Date</TableHead>
                  <TableHead className="w-[30%] sm:w-[25%]">Diagnosis</TableHead>
                  <TableHead>Symptoms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                      {format(new Date(session.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-slate-800 font-medium text-xs sm:text-sm">
                      {session.primary_diagnosis || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {session.symptoms?.slice(0, 3).map((symptom, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] rounded-full"
                          >
                            {symptom}
                          </span>
                        ))}
                        {session.symptoms && session.symptoms.length > 3 && (
                          <span className="text-[9px] sm:text-[10px] text-slate-400 self-center">
                            +{session.symptoms.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/20 transition-all cursor-default"
              >
                <div className="hidden md:flex flex-col items-center justify-start pt-1">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="w-0.5 flex-grow bg-slate-100 my-2 group-last:hidden" />
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                        {format(new Date(session.created_at), "MMMM d, yyyy")}
                      </span>
                      <h4 className="font-semibold text-slate-800">{session.primary_diagnosis}</h4>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                      <Stethoscope className="h-3 w-3" />
                      Session {session.id.slice(0, 4)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {session.symptoms?.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full shadow-sm group-hover:border-amber-100 transition-colors"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>

                  {session.clinical_notes && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                      {session.clinical_notes}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
