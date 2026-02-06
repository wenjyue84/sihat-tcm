"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Download,
  Share2,
  Save,
  Loader2,
  ImageIcon,
  BadgeCheck,
  Check,
  X,
  UserPlus,
  Home,
  FileText,
} from "lucide-react";
import { useAuth } from "@/stores/useAppStore";
import type { ViewMode } from "./ViewSwitcher";
import { translations } from "@/lib/translations";

interface ReportActionsProps {
  onChatOpen: () => void;
  onDownloadPDF: () => void;
  onShare: () => void;
  onSave: () => void;
  onRestart: () => void;
  onInfographicsOpen: () => void;
  onRequestVerification: () => void;
  isSaving: boolean;
  hasSaved: boolean;
  language: string;
  variants: any;
  isDoctorView?: boolean;
  viewMode?: ViewMode;
}

// Translations for the guest dialog (Same as before)
const guestDialogTranslations = {
  en: {
    title: "Create an Account?",
    message:
      "Would you like to create an account to save your diagnosis history and access it anytime?",
    loginSignup: "Login / Sign Up",
    continueWithout: "Continue Without Account",
    benefits: "Benefits of having an account:",
    benefit1: "Save and access your diagnosis history",
    benefit2: "Track your health progress over time",
    benefit3: "Get personalized recommendations",
  },
  zh: {
    title: "创建账户？",
    message: "您是否要创建账户以保存诊断历史记录，随时访问？",
    loginSignup: "登录 / 注册",
    continueWithout: "无需账户继续",
    benefits: "拥有账户的好处：",
    benefit1: "保存并访问您的诊断历史",
    benefit2: "随时追踪健康进展",
    benefit3: "获取个性化建议",
  },
  ms: {
    title: "Buat Akaun?",
    message:
      "Adakah anda ingin membuat akaun untuk menyimpan sejarah diagnosis anda dan mengaksesnya bila-bila masa?",
    loginSignup: "Log Masuk / Daftar",
    continueWithout: "Teruskan Tanpa Akaun",
    benefits: "Manfaat mempunyai akaun:",
    benefit1: "Simpan dan akses sejarah diagnosis anda",
    benefit2: "Jejak kemajuan kesihatan anda dari masa ke masa",
    benefit3: "Dapatkan cadangan yang diperibadikan",
  },
};

export function ReportActions({
  onChatOpen,
  onDownloadPDF,
  onShare,
  onSave,
  onRestart,
  onInfographicsOpen,
  onRequestVerification,
  isSaving,
  hasSaved,
  language,
  variants,
  isDoctorView = false,
  viewMode = "modern",
}: ReportActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  // const { t } = useLanguage(); // Removed to rely on props
  const t = translations[language as keyof typeof translations] || translations.en;
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  const dialogT =
    guestDialogTranslations[language as keyof typeof guestDialogTranslations] ||
    guestDialogTranslations.en;

  const handleStartNewConsultation = () => {
    if (user) {
      onRestart();
      return;
    }
    setShowGuestDialog(true);
  };

  const handleLoginSignup = () => {
    setShowGuestDialog(false);
    router.push("/patient");
  };

  const handleCloseDialog = () => {
    setShowGuestDialog(false);
    router.push("/patient");
  };

  const handleContinueWithoutAccount = () => {
    setShowGuestDialog(false);
    onRestart();
  };

  if (viewMode === "classic") {
    return (
      <motion.div
        variants={variants}
        className="mt-8 pt-8 border-t-2 border-stone-800 print:hidden font-serif"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onDownloadPDF}
            className="px-4 py-2 border border-stone-800 text-stone-900 font-bold uppercase hover:bg-stone-100 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={onShare}
            className="px-4 py-2 border border-stone-800 text-stone-900 font-bold uppercase hover:bg-stone-100 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={onSave}
            disabled={hasSaved}
            className={`px-4 py-2 border border-stone-800 font-bold uppercase hover:bg-stone-100 flex items-center gap-2 ${hasSaved ? "bg-stone-200 cursor-not-allowed" : "text-stone-900"}`}
          >
            {hasSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {hasSaved ? "Saved" : "Save Report"}
          </button>
          <button
            onClick={handleStartNewConsultation}
            className="px-4 py-2 bg-stone-900 text-white font-bold uppercase hover:bg-stone-800 flex items-center gap-2"
          >
            Start New
          </button>
        </div>
      </motion.div>
    );
  }

  // Modern View
  return (
    <motion.div variants={variants} className="w-full pt-6 md:pt-8 print:hidden">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Primary CTA - Chat Button */}
        <div className="flex justify-center">
          <button
            onClick={onChatOpen}
            className="relative group px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white rounded-full shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-3 text-lg font-bold min-w-[280px] md:min-w-[320px] transform hover:-translate-y-1"
          >
            <MessageCircle className="h-6 w-6" />
            <span>{t.report.askAboutReport}</span>
          </button>
        </div>

        {/* Action Groups */}
        <div className="space-y-4">
          {/* Export & Share Group */}
          <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto sm:max-w-none sm:w-auto sm:grid-cols-3 md:flex md:flex-wrap md:justify-center">
            <SecondaryButton onClick={onDownloadPDF} icon={FileText} label={t.report.downloadPdf} />
            <SecondaryButton onClick={onShare} icon={Share2} label={t.report.shareReport} />
            <SecondaryButton
              onClick={onInfographicsOpen}
              icon={ImageIcon}
              label={t.report.infographics}
            />
          </div>

          {/* Save & Verify Group */}
          <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto sm:max-w-none sm:w-auto sm:grid-cols-2 md:flex md:flex-wrap md:justify-center">
            <button
              onClick={onSave}
              disabled={isSaving || hasSaved}
              className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2 text-sm font-semibold min-w-[140px] justify-center ${
                hasSaved
                  ? "bg-green-100 border border-green-200 text-green-700 cursor-default"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : hasSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  {t.report.actionAlerts.saved}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t.report.saveToHistory}
                </>
              )}
            </button>

            {!isDoctorView && (
              <SecondaryButton
                onClick={onRequestVerification}
                icon={BadgeCheck}
                label={t.report.requestDoctorVerification}
              />
            )}
          </div>

          {/* Start New */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleStartNewConsultation}
              className="text-stone-400 hover:text-stone-600 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Home className="w-4 h-4" />
              {t.report.backToHome}
            </button>
          </div>
        </div>
      </div>

      {/* Guest Login/Signup Dialog */}
      <AnimatePresence>
        {showGuestDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseDialog}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{dialogT.title}</h2>
                <p className="text-stone-500 text-sm leading-relaxed">{dialogT.message}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLoginSignup}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {dialogT.loginSignup}
                </button>
                <button
                  onClick={handleContinueWithoutAccount}
                  className="w-full py-3.5 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  {dialogT.continueWithout}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SecondaryButton = ({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] active:bg-stone-100 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px]"
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);
