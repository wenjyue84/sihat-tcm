import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EcgAnimation } from "@/components/ui/EcgAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

interface SmartHealthMetricsProps {
  smartConnectData: any;
  includeSmartConnectData: boolean;
}

export function SmartHealthMetrics({
  smartConnectData,
  includeSmartConnectData,
}: SmartHealthMetricsProps) {
  const { t } = useLanguage();
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (!smartConnectData || !includeSmartConnectData || Object.keys(smartConnectData).length === 0) {
    return null;
  }

  // Extract numeric BPM value from pulseRate (could be number or string like "72 bpm")
  const getBpmValue = (pulseRate: number | string | undefined): number | null => {
    if (!pulseRate) return null;
    if (typeof pulseRate === "number") return pulseRate;
    const match = String(pulseRate).match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  const bpmValue = getBpmValue(smartConnectData.pulseRate);

  return (
    <motion.div variants={item}>
      <GlassCard
        variant="elevated"
        intensity="medium"
        className="border-purple-100/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50"
      >
        <div className="flex items-center gap-2 text-purple-900 text-base md:text-lg font-semibold mb-4 border-b border-purple-200/30 pb-2">
          <Activity className="h-5 w-5" />
          {t.smartConnect.smartHealthMonitor}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {smartConnectData.pulseRate && (
            <div className="bg-white/60 rounded-lg p-3 col-span-2 md:col-span-1">
              <p className="text-xs text-purple-600 font-medium">{t.smartConnect.pulseRate}</p>
              <p className="text-xl font-bold text-purple-900">
                {smartConnectData.pulseRate}{" "}
                <span className="text-sm font-normal">{t.pulse.bpm}</span>
              </p>
              {/* ECG Animation - 心电图 */}
              {bpmValue && bpmValue > 0 && (
                <div className="mt-2 rounded-lg overflow-hidden bg-purple-900/5 border border-purple-200/30">
                  <EcgAnimation bpm={bpmValue} isActive={true} height={40} lineColor="#7c3aed" />
                </div>
              )}
            </div>
          )}
          {smartConnectData.bloodPressure && (
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-purple-600 font-medium">{t.smartConnect.bloodPressure}</p>
              <p className="text-xl font-bold text-purple-900">
                {smartConnectData.bloodPressure} <span className="text-sm font-normal">mmHg</span>
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
              <p className="text-xl font-bold text-purple-900">{smartConnectData.stressLevel}</p>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
