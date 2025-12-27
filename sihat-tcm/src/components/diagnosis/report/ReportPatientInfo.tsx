import { motion } from "framer-motion";
import { User, Activity } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportPatientInfoProps {
  patientInfo: any;
  smartConnectData?: any;
  reportOptions: any;
  variants: any;
}

export function ReportPatientInfo({
  patientInfo,
  smartConnectData,
  reportOptions: opts,
  variants,
}: ReportPatientInfoProps) {
  const { t } = useLanguage();
  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return null;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  return (
    <>
      {/* Patient Info - Collapsible */}
      {patientInfo &&
        (opts.includePatientName ||
          opts.includePatientAge ||
          opts.includePatientGender ||
          opts.includeBMI) && (
          <motion.div variants={variants}>
            <CollapsibleSection title={t.report.patientInfo} icon={User} accentColor="blue">
              <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {opts.includePatientName !== false && patientInfo.name && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">{t.report.name}</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.name}</p>
                    </div>
                  )}
                  {opts.includePatientAge !== false && patientInfo.age && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">{t.report.age}</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.age} {t.analysisLoading.yearsOld}</p>
                    </div>
                  )}
                  {opts.includePatientGender !== false && patientInfo.gender && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">{t.report.gender}</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.gender}</p>
                    </div>
                  )}
                  {opts.includeBMI !== false && patientInfo.height && patientInfo.weight && (
                    <>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">{t.report.height} / {t.report.weight}</p>
                        <p className="text-blue-900 font-semibold">
                          {patientInfo.height}cm / {patientInfo.weight}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">{t.report.bmi}</p>
                        <p className="text-blue-900 font-semibold">
                          {calculateBMI(patientInfo.height, patientInfo.weight)}
                        </p>
                      </div>
                    </>
                  )}
                  {opts.includePatientContact && patientInfo.contact && (
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-blue-600 font-medium">{t.patientDashboard.settings.accountInfo}</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.contact}</p>
                    </div>
                  )}
                  {opts.includePatientAddress && patientInfo.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-blue-600 font-medium">{t.patientDashboard.profile.personalInfo}</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.address}</p>
                    </div>
                  )}
                  {opts.includeEmergencyContact && patientInfo.emergencyContact && (
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-blue-600 font-medium">Emergency Contact</p>
                      <p className="text-blue-900 font-semibold">{patientInfo.emergencyContact}</p>
                    </div>
                  )}
                </div>
                {patientInfo.symptoms && (
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">{t.report.chiefComplaint}</p>
                    <p className="text-blue-800 text-sm">{patientInfo.symptoms}</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </motion.div>
        )}

      {/* Smart Connect Data - Collapsible */}
      {smartConnectData &&
        opts.includeSmartConnectData &&
        Object.keys(smartConnectData).length > 0 && (
          <motion.div variants={variants}>
            <CollapsibleSection title={t.smartConnect.smartHealthMonitor} icon={Activity} accentColor="purple">
              <div className="w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {smartConnectData.pulseRate && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.pulseRate}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.pulseRate}{" "}
                        <span className="text-sm font-normal">{t.pulse.bpm}</span>
                      </p>
                    </div>
                  )}
                  {smartConnectData.bloodPressure && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.bloodPressure}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.bloodPressure}{" "}
                        <span className="text-sm font-normal">mmHg</span>
                      </p>
                    </div>
                  )}
                  {smartConnectData.bloodOxygen && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.bloodOxygen}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.bloodOxygen}
                        <span className="text-sm font-normal">%</span>
                      </p>
                    </div>
                  )}
                  {smartConnectData.bodyTemp && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.temperature}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.bodyTemp}
                        <span className="text-sm font-normal">°C</span>
                      </p>
                    </div>
                  )}
                  {smartConnectData.hrv && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.hrv}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.hrv} <span className="text-sm font-normal">ms</span>
                      </p>
                    </div>
                  )}
                  {smartConnectData.stressLevel && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">{t.smartConnect.stressLevel}</p>
                      <p className="text-xl font-bold text-purple-900">
                        {smartConnectData.stressLevel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </motion.div>
        )}
    </>
  );
}
