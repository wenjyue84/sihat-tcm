"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  User,
  Loader2,
  AlertCircle,
  Crown,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Shield,
} from "lucide-react";
import { useDoctorVerification, type ApprovedDoctor } from "./hooks/useDoctorVerification";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DiagnosisReport } from "@/types/database";

interface DoctorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: DiagnosisReport;
  patientData?: {
    name?: string;
    email?: string;
    age?: number;
    gender?: string;
  };
}

export function DoctorVerificationModal({
  isOpen,
  onClose,
  reportData,
  patientData,
}: DoctorVerificationModalProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [showProcessInfo, setShowProcessInfo] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    doctors,
    selectedDoctor,
    loading,
    sending,
    step,
    error,
    setSelectedDoctor,
    setStep,
    sendVerificationRequest,
    reset,
  } = useDoctorVerification({ reportData, patientData });

  const handleClose = () => {
    reset();
    onClose();
  };

  // Direct send - no confirm step
  const handleSend = async () => {
    await sendVerificationRequest();
  };

  const handleNavigate = (path: string) => {
    onClose();
    if (path) router.push(path);
  };

  // Format response time for display
  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Translations
  const translations = {
    en: {
      title: "Request Doctor Verification",
      subtitle: "Get your AI diagnosis reviewed by a qualified TCM practitioner",
      defaultDoctor: "Master Doctor",
      defaultDescription: "Default recipient - fastest response",
      selectOther: "Or select a specific doctor:",
      noOtherDoctors: "No other verified doctors available",
      sendButton: "Send Request",
      cancelButton: "Cancel",
      successTitle: "Request Sent!",
      successMessage: "The doctor will review your diagnosis and provide professional feedback.",
      successDetail: "You can check the status anytime in the Communication page.",
      goToCommunication: "Go to Communication",
      stayHere: "Stay Here",
      errorTitle: "Error",
      loading: "Loading doctors...",
      // New translations
      whatHappens: "What happens next?",
      processStep1: "Your diagnosis data is securely sent to the doctor",
      processStep2: "The doctor reviews and provides professional feedback",
      processStep3: "You'll receive a notification when ready",
      responseTime: "Avg. response",
      experience: " yrs exp.",
      certified: "Verified",
      infoTooltip:
        "A qualified TCM practitioner will review your AI-generated diagnosis and provide professional medical feedback. Your data is handled securely.",
      specialty: "Specialty",
    },
    zh: {
      title: "请求医生核实",
      subtitle: "让合格中医审核您的AI诊断",
      defaultDoctor: "主治医生",
      defaultDescription: "默认接收者 - 最快响应",
      selectOther: "或选择特定医生：",
      noOtherDoctors: "暂无其他已认证医生",
      sendButton: "发送请求",
      cancelButton: "取消",
      successTitle: "请求已发送！",
      successMessage: "医生将审核您的诊断并提供专业反馈。",
      successDetail: "您可以随时在沟通页面查看状态。",
      goToCommunication: "前往沟通页面",
      stayHere: "留在此处",
      errorTitle: "错误",
      loading: "加载医生列表...",
      // New translations
      whatHappens: "接下来会发生什么？",
      processStep1: "您的诊断数据将安全发送给医生",
      processStep2: "医生审核并提供专业反馈",
      processStep3: "准备好后您会收到通知",
      responseTime: "平均响应",
      experience: "年经验",
      certified: "已认证",
      infoTooltip: "合格的中医师将审核您的AI诊断结果，并提供专业的医学反馈。您的数据将被安全处理。",
      specialty: "专长",
    },
    ms: {
      title: "Mohon Pengesahan Doktor",
      subtitle: "Dapatkan diagnosis AI anda disemak oleh pengamal TCM",
      defaultDoctor: "Doktor Utama",
      defaultDescription: "Penerima lalai - respons terpantas",
      selectOther: "Atau pilih doktor tertentu:",
      noOtherDoctors: "Tiada doktor lain yang disahkan",
      sendButton: "Hantar Permintaan",
      cancelButton: "Batal",
      successTitle: "Permintaan Dihantar!",
      successMessage:
        "Doktor akan menyemak diagnosis anda dan memberikan maklum balas profesional.",
      successDetail: "Anda boleh menyemak status pada bila-bila masa di halaman Komunikasi.",
      goToCommunication: "Pergi ke Komunikasi",
      stayHere: "Kekal Di Sini",
      errorTitle: "Ralat",
      loading: "Memuatkan doktor...",
      // New translations
      whatHappens: "Apa yang berlaku seterusnya?",
      processStep1: "Data diagnosis anda dihantar dengan selamat kepada doktor",
      processStep2: "Doktor menyemak dan memberikan maklum balas profesional",
      processStep3: "Anda akan menerima pemberitahuan apabila siap",
      responseTime: "Purata respons",
      experience: " thn pengalaman",
      certified: "Disahkan",
      infoTooltip:
        "Pengamal TCM yang berkelayakan akan menyemak diagnosis AI anda dan memberikan maklum balas perubatan profesional. Data anda dikendalikan dengan selamat.",
      specialty: "Kepakaran",
    },
  };

  const tt = translations[language as keyof typeof translations] || translations.en;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white flex-shrink-0">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{tt.title}</h2>
              {/* Info Tooltip */}
              <div className="relative">
                <button
                  onClick={() => setShowTooltip(!showTooltip)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors touch-manipulation"
                  aria-label="More info"
                >
                  <Info className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 top-full mt-2 w-64 p-3 bg-white text-gray-700 text-sm rounded-lg shadow-xl z-10"
                    >
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p>{tt.infoTooltip}</p>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-2 left-4 w-3 h-3 bg-white rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-1 pr-8">{tt.subtitle}</p>
          </div>

          {/* Content - Scrollable */}
          <div className="p-5 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {/* Step: Select Doctor */}
              {step === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* What happens next - Expandable */}
                  <button
                    onClick={() => setShowProcessInfo(!showProcessInfo)}
                    className="w-full flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-left touch-manipulation"
                  >
                    <span className="text-sm font-medium text-emerald-700">{tt.whatHappens}</span>
                    {showProcessInfo ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showProcessInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pl-2 pb-2">
                          <ProcessStep number={1} text={tt.processStep1} />
                          <ProcessStep number={2} text={tt.processStep2} />
                          <ProcessStep number={3} text={tt.processStep3} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <span className="ml-3 text-gray-500">{tt.loading}</span>
                    </div>
                  ) : (
                    <>
                      {/* Master Doctor (Default) */}
                      <DoctorCard
                        doctor={doctors.find((d) => d.is_master) || doctors[0]}
                        isSelected={selectedDoctor?.is_master === true}
                        onSelect={setSelectedDoctor}
                        isMaster
                        translations={tt}
                        formatResponseTime={formatResponseTime}
                      />

                      {/* Other Approved Doctors */}
                      {doctors.filter((d) => !d.is_master).length > 0 && (
                        <>
                          <p className="text-sm text-gray-500 font-medium mt-4">{tt.selectOther}</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {doctors
                              .filter((d) => !d.is_master)
                              .map((doctor) => (
                                <DoctorCard
                                  key={doctor.id}
                                  doctor={doctor}
                                  isSelected={selectedDoctor?.id === doctor.id}
                                  onSelect={setSelectedDoctor}
                                  translations={tt}
                                  formatResponseTime={formatResponseTime}
                                />
                              ))}
                          </div>
                        </>
                      )}

                      {doctors.filter((d) => !d.is_master).length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">
                          {tt.noOtherDoctors}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          onClick={handleClose}
                          className="w-full sm:flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation min-h-[48px]"
                        >
                          {tt.cancelButton}
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={!selectedDoctor || sending}
                          className="w-full sm:flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation min-h-[48px] font-medium"
                        >
                          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                          {tt.sendButton}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{tt.successTitle}</h3>
                  <p className="text-gray-600 mb-2">{tt.successMessage}</p>
                  <p className="text-sm text-gray-400 mb-6">{tt.successDetail}</p>

                  <div className="flex flex-col gap-3 px-2">
                    <button
                      onClick={() => handleNavigate("/patient/communication")}
                      className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {tt.goToCommunication}
                    </button>
                    <button
                      onClick={() => handleNavigate("")}
                      className="w-full px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation min-h-[48px]"
                    >
                      {tt.stayHere}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step: Error */}
              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{tt.errorTitle}</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => setStep("select")}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation min-h-[48px]"
                  >
                    {tt.cancelButton}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Process step component
function ProcessStep({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-emerald-700">{number}</span>
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

// Enhanced DoctorCard component
interface DoctorCardProps {
  doctor: ApprovedDoctor;
  isSelected: boolean;
  onSelect: (doctor: ApprovedDoctor) => void;
  isMaster?: boolean;
  translations: {
    defaultDoctor: string;
    defaultDescription: string;
    responseTime: string;
    experience: string;
    certified: string;
  };
  formatResponseTime: (minutes: number) => string;
}

function DoctorCard({
  doctor,
  isSelected,
  onSelect,
  isMaster,
  translations,
  formatResponseTime,
}: DoctorCardProps) {
  const displayName = isMaster ? translations.defaultDoctor : doctor.full_name;

  return (
    <button
      onClick={() => onSelect(doctor)}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 touch-manipulation min-h-[80px] ${
        isSelected
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
      }`}
    >
      {/* Avatar with verified badge */}
      <div className="relative flex-shrink-0">
        {doctor.avatar_url ? (
          <img
            src={doctor.avatar_url}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isMaster
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-emerald-400 to-teal-500"
            }`}
          >
            {isMaster ? (
              <Crown className="w-7 h-7 text-white" />
            ) : (
              <User className="w-7 h-7 text-white" />
            )}
          </div>
        )}
        {/* Verified badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Info section */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{displayName}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500">
          {doctor.specialty && <span className="truncate">{doctor.specialty}</span>}
          {doctor.years_experience && (
            <>
              {doctor.specialty && <span className="text-gray-300">·</span>}
              <span className="whitespace-nowrap">
                {doctor.years_experience}
                {translations.experience}
              </span>
            </>
          )}
        </div>
        {isMaster && (
          <p className="text-xs text-emerald-600 mt-0.5">{translations.defaultDescription}</p>
        )}
      </div>

      {/* Right side: Response time + Selection state */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {doctor.avg_response_time && (
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>~{formatResponseTime(doctor.avg_response_time)}</span>
          </div>
        )}
        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      </div>
    </button>
  );
}
