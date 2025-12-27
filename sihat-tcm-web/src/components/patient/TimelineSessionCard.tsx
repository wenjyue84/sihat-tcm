"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ChevronDown, ChevronUp, Calendar, FileText, MoreVertical, EyeOff, Trash2 } from "lucide-react";
import { deleteSession, hideSession } from "@/lib/actions";
import type { DiagnosisSession } from "@/types/database";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";
import { ScoreRing } from "./ScoreRing";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/stores/useAppStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimelineSessionCardProps {
  session: DiagnosisSession;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  onRefresh?: () => void;
}

const formatDate = (dateString: string, locale: string = "en-US"): string => {
  const date = new Date(dateString);
  try {
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "ms" ? "ms-MY" : "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
};

export function TimelineSessionCard({
  session,
  index,
  isFirst = false,
  isLast = false,
  onRefresh
}: TimelineSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  // Safe access to translation keys
  const journeyT = t?.patientDashboard_v1?.healthJourney || {};
  const cardT = journeyT.card || {
    viewReport: "View Full Report",
    inquiry: "Inquiry",
    tongue: "Tongue",
    face: "Face",
    voice: "Voice",
    pulse: "Pulse"
  };

  const diagnosisTitle = extractDiagnosisTitle(session.primary_diagnosis);
  const constitutionTitle = extractConstitutionType(session.constitution);
  const score = session.overall_score ?? 0;

  const handleViewDetails = () => {
    router.push(`/patient/history/${session.id}`);
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHiding) return;

    try {
      setIsHiding(true);
      const result = await hideSession(session.id);
      if (result.success) {
        toast.success(t?.patientDashboard?.messages?.sessionHidden || "Session hidden successfully");
        onRefresh?.();
      } else {
        toast.error(result.error || "Failed to hide session");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsHiding(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      const result = await deleteSession(session.id);
      if (result.success) {
        toast.success(t?.patientDashboard?.messages?.sessionDeleted || "Session deleted successfully");
        onRefresh?.();
      } else {
        toast.error(result.error || "Failed to delete session");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline dot connector - only show if not last */}
      {!isLast && (
        <div className="absolute left-0 top-8 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-emerald-300 to-emerald-200 -translate-x-1/2" />
      )}

      {/* Timeline dot */}
      <div className="absolute left-0 top-6 -translate-x-1/2 z-10">
        <motion.div
          className="w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
        />
      </div>

      {/* Card */}
      <Card
        className="ml-6 sm:ml-8 group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-slate-200/60 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4 sm:p-6">
          {/* Date and Actions */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <time className="text-base sm:text-2xl font-light text-slate-800 tracking-tight truncate">
                {formatDate(session.created_at, language)}
              </time>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleHide}
                  className="text-slate-600 cursor-pointer"
                  disabled={isHiding}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  {isHiding ? "Hiding..." : t?.patientDashboard?.actions?.hide || "Hide"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t?.patientDashboard?.actions?.delete || "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Main content row */}
          <div className="flex items-start justify-between gap-3 sm:gap-6 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              {/* Diagnosis title */}
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-2 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                {diagnosisTitle}
              </h3>

              {/* Constitution badge */}
              {constitutionTitle && (
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {constitutionTitle}
                </span>
              )}
            </div>

            {/* Score ring */}
            {score > 0 && (
              <div className="shrink-0">
                <div className="hidden sm:block">
                  <ScoreRing score={score} size={72} strokeWidth={6} />
                </div>
                <div className="sm:hidden">
                  <ScoreRing score={score} size={56} strokeWidth={5} />
                </div>
              </div>
            )}
          </div>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  {/* Input data indicators */}
                  {(session.inquiry_summary ||
                    session.tongue_analysis ||
                    session.face_analysis ||
                    session.audio_analysis ||
                    session.pulse_data) && (
                      <div className="flex flex-wrap gap-2">
                        {session.inquiry_summary && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                            {cardT.inquiry}
                          </span>
                        )}
                        {session.tongue_analysis && (
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                            {cardT.tongue}
                          </span>
                        )}
                        {session.face_analysis && (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                            {cardT.face}
                          </span>
                        )}
                        {session.audio_analysis && (
                          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-200">
                            {cardT.voice}
                          </span>
                        )}
                        {session.pulse_data && (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200">
                            {cardT.pulse}
                          </span>
                        )}
                      </div>
                    )}

                  {/* Notes preview */}
                  {session.notes && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-900 leading-relaxed line-clamp-3">
                          {session.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* View details button */}
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleViewDetails();
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {cardT.viewReport}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand/collapse indicator */}
          <div className="mt-4 flex items-center justify-center">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </div>

        {/* Bottom accent line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t?.patientDashboard?.deleteDialog?.title || "Are you absolutely sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t?.patientDashboard?.deleteDialog?.description ||
                "This action cannot be undone. This will permanently delete your session record from our servers."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              {t?.patientDashboard?.deleteDialog?.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : t?.patientDashboard?.deleteDialog?.confirm || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

