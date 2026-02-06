import { motion } from "framer-motion";
import { User, Activity, Ruler, Weight, UserCircle } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ViewMode } from "./ViewSwitcher";

interface ReportPatientInfoProps {
  patientInfo: any;
  smartConnectData?: any;
  reportOptions: any;
  variants: any;
  viewMode?: ViewMode;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  bg?: string;
}

const MetricCard = ({ label, value, unit, color, bg }: MetricCardProps) => (
  <div
    className={`p-2 md:p-3 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm border border-stone-100 ${bg || "bg-white"}`}
  >
    <span
      className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 opacity-70 ${color}`}
    >
      {label}
    </span>
    <span className={`text-base md:text-lg font-bold ${color}`}>
      {value}
      <span className="text-[10px] ml-0.5 opacity-60 font-medium">{unit}</span>
    </span>
  </div>
);

export function ReportPatientInfo({
  patientInfo,
  smartConnectData,
  reportOptions: opts,
  variants,
  viewMode = "modern",
}: ReportPatientInfoProps) {
  const { t } = useLanguage();
  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return null;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  // Classic View (Paper-like)
  if (viewMode === "classic") {
    if (
      !(
        opts.includePatientName ||
        opts.includePatientAge ||
        opts.includePatientGender ||
        opts.includeBMI
      )
    )
      return null;

    return (
      <motion.div variants={variants} className="mb-8 font-serif">
        <h3 className="text-lg font-bold border-b border-stone-300 pb-2 mb-4 uppercase">
          {t.report.patientInfo}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4 md:gap-x-8 text-sm">
          {opts.includePatientName !== false && patientInfo.name && (
            <div>
              <span className="font-bold block text-stone-900">{t.report.name}:</span>
              <span>{patientInfo.name}</span>
            </div>
          )}
          {opts.includePatientAge !== false && patientInfo.age && (
            <div>
              <span className="font-bold block text-stone-900">{t.report.age}:</span>
              <span>{patientInfo.age}</span>
            </div>
          )}
          {opts.includePatientGender !== false && patientInfo.gender && (
            <div>
              <span className="font-bold block text-stone-900">{t.report.gender}:</span>
              <span>{patientInfo.gender}</span>
            </div>
          )}
          {opts.includeBMI !== false && patientInfo.height && patientInfo.weight && (
            <div>
              <span className="font-bold block text-stone-900">Biometrics:</span>
              <span>
                {patientInfo.height}cm / {patientInfo.weight}kg (BMI:{" "}
                {calculateBMI(patientInfo.height, patientInfo.weight)})
              </span>
            </div>
          )}
        </div>
        {/* Classic Smart Connect Table */}
        {smartConnectData &&
          opts.includeSmartConnectData &&
          Object.keys(smartConnectData).length > 0 && (
            <div className="mt-6">
              <h4 className="font-bold mb-2 text-stone-800">Vitals</h4>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 text-xs">
                {Object.entries(smartConnectData).map(([key, val]: [string, any]) => (
                  <div key={key} className="border border-stone-300 p-2">
                    <div className="font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {key}
                    </div>
                    <div className="text-base">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </motion.div>
    );
  }

  // Modern / Summary View
  const hasBasicInfo =
    opts.includePatientName ||
    opts.includePatientAge ||
    opts.includePatientGender ||
    opts.includeBMI;

  if (!hasBasicInfo) return null;

  return (
    <motion.div variants={variants} className="space-y-4">
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-stone-100 relative overflow-hidden">
        {/* Subtle Background Art */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Main ID Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shadow-inner">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              {opts.includePatientName !== false && (
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{patientInfo.name}</h3>
              )}
              <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                {opts.includePatientGender !== false && <span>{patientInfo.gender}</span>}
                {opts.includePatientGender !== false && opts.includePatientAge !== false && (
                  <span>•</span>
                )}
                {opts.includePatientAge !== false && (
                  <span>
                    {patientInfo.age} {t.analysisLoading?.yearsOld || "years old"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Biometrics Pills */}
          {opts.includeBMI !== false && patientInfo.height && patientInfo.weight && (
            <div className="flex flex-wrap gap-2 md:gap-3">
              <div className="px-3 md:px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center min-w-[70px] md:min-w-[80px] flex-1 md:flex-none">
                <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                  {t.report.height}
                </span>
                <span className="text-lg font-bold text-slate-700">
                  {patientInfo.height}
                  <span className="text-xs ml-0.5 font-normal text-stone-400">cm</span>
                </span>
              </div>
              <div className="px-3 md:px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center min-w-[70px] md:min-w-[80px] flex-1 md:flex-none">
                <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                  {t.report.weight}
                </span>
                <span className="text-lg font-bold text-slate-700">
                  {patientInfo.weight}
                  <span className="text-xs ml-0.5 font-normal text-stone-400">kg</span>
                </span>
              </div>
              <div className="px-3 md:px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col items-center min-w-[70px] md:min-w-[80px] flex-1 md:flex-none">
                <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                  {t.report.bmi}
                </span>
                <span className="text-lg font-bold text-blue-700">
                  {calculateBMI(patientInfo.height, patientInfo.weight)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Symptoms / Chief Complaint */}
        {patientInfo.symptoms && (
          <div className="mt-6 pt-4 border-t border-stone-100/50">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">
              {t.report.chiefComplaint}
            </p>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              {patientInfo.symptoms}
            </p>
          </div>
        )}
      </div>

      {/* Smart Connect Data */}
      {smartConnectData &&
        opts.includeSmartConnectData &&
        Object.keys(smartConnectData).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {/* Map smart connect data to small visual cards */}
            {smartConnectData.pulseRate && (
              <MetricCard
                label={t.smartConnect.pulseRate}
                value={smartConnectData.pulseRate}
                unit={t.pulse.bpm}
                color="text-rose-600"
                bg="bg-rose-50"
              />
            )}
            {smartConnectData.bloodPressure && (
              <MetricCard
                label={t.smartConnect.bloodPressure}
                value={smartConnectData.bloodPressure}
                unit="mmHg"
                color="text-red-600"
                bg="bg-red-50"
              />
            )}
            {smartConnectData.bloodOxygen && (
              <MetricCard
                label={t.smartConnect.bloodOxygen}
                value={smartConnectData.bloodOxygen}
                unit="%"
                color="text-sky-600"
                bg="bg-sky-50"
              />
            )}
            {smartConnectData.bodyTemp && (
              <MetricCard
                label={t.smartConnect.temperature}
                value={smartConnectData.bodyTemp}
                unit="°C"
                color="text-orange-600"
                bg="bg-orange-50"
              />
            )}
            {smartConnectData.stressLevel && (
              <MetricCard
                label={t.smartConnect.stressLevel}
                value={smartConnectData.stressLevel}
                unit=""
                color="text-violet-600"
                bg="bg-violet-50"
              />
            )}
          </div>
        )}
    </motion.div>
  );
}
