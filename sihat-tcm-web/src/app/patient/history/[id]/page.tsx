"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { getSessionById, updateSessionNotes, deleteSession } from "@/lib/actions";
import { DiagnosisReport } from "@/components/diagnosis/DiagnosisReport";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Edit3, Save, X, Trash2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";
import { DiagnosisInputDataViewer } from "@/components/patient/DiagnosisInputDataViewer";

export default function HistoryViewerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/patient");
    }
  }, [user, authLoading, router]);

  // Load session data
  useEffect(() => {
    async function loadSession() {
      if (!user || !sessionId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getSessionById(sessionId);

        if (result.success && result.data) {
          setSession(result.data);
          setNotesValue(result.data.notes || "");
        } else {
          setError(result.error || "Failed to load session");
        }
      } catch (err: any) {
        console.error("[HistoryViewer] Error loading session:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (user && sessionId) {
      loadSession();
    }
  }, [user, sessionId]);

  // Save notes
  const handleSaveNotes = async () => {
    if (!sessionId) return;

    try {
      setSavingNotes(true);
      const result = await updateSessionNotes(sessionId, notesValue);

      if (result.success) {
        setSession((prev: any) => ({ ...prev, notes: notesValue }));
        setIsEditingNotes(false);
      } else {
        alert(`Failed to save notes: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error saving notes: ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete session
  const handleDelete = async () => {
    if (!sessionId) return;

    try {
      setDeleting(true);
      const result = await deleteSession(sessionId);

      if (result.success) {
        router.push("/patient");
      } else {
        alert(`Failed to delete session: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting session: ${err.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Back to dashboard
  const handleBack = () => {
    router.push("/patient");
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-emerald-600" />
          <p className="text-slate-600">Loading session...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {error ? "Error Loading Session" : "Session Not Found"}
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "This diagnosis session could not be found or you do not have access to it."}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect
  }

  // Extract report data from session
  const reportData = session.full_report;
  const patientInfo = reportData.patient_profile || reportData.patient_summary || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>

          <div className="flex items-center gap-2">
            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Session Date & Notes Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {extractDiagnosisTitle(session.primary_diagnosis)}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(session.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {session.overall_score !== null && session.overall_score !== undefined && (
                <div
                  className={`px-4 py-2 rounded-full font-bold ${session.overall_score >= 75
                      ? "bg-emerald-100 text-emerald-700"
                      : session.overall_score >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  Score: {session.overall_score}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Personal Notes
                </h3>
                {!isEditingNotes ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingNotes(true)}
                    className="text-emerald-600 hover:bg-emerald-50"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotesValue(session.notes || "");
                      }}
                      disabled={savingNotes}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {savingNotes ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
              {isEditingNotes ? (
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes about how you felt, symptoms, or recovery progress..."
                  className="min-h-[100px] bg-white"
                />
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 min-h-[60px]">
                  {session.notes || "No notes added yet. Click Edit to add your observations."}
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Input Data Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <DiagnosisInputDataViewer session={session} />
        </motion.div>

        {/* Report Display */}
        <DiagnosisReport
          data={reportData}
          patientInfo={patientInfo}
          reportOptions={{}}
          smartConnectData={null}
          onRestart={handleBack}
          saved={true}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
                Delete This Session?
              </h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                This action cannot be undone. All data from this diagnosis session will be
                permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
