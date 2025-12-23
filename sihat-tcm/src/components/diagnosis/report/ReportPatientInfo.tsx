import { motion } from 'framer-motion'
import { User, Activity } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface ReportPatientInfoProps {
    patientInfo: any
    smartConnectData?: any
    reportOptions: any
    variants: any
}

export function ReportPatientInfo({ patientInfo, smartConnectData, reportOptions: opts, variants }: ReportPatientInfoProps) {
    const calculateBMI = (height?: number, weight?: number) => {
        if (!height || !weight) return null;
        const heightM = height / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    }

    return (
        <>
            {/* Patient Info */}
            {patientInfo && (opts.includePatientName || opts.includePatientAge || opts.includePatientGender || opts.includeBMI) && (
                <motion.div variants={variants}>
                    <GlassCard variant="elevated" intensity="medium" className="border-blue-100/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80">
                        <div className="pb-2 px-4 md:px-6 mb-2 border-b border-blue-200/30">
                            <div className="flex items-center gap-2 text-blue-900 text-base md:text-lg font-semibold">
                                <User className="h-5 w-5 text-blue-700" />
                                Patient Information
                            </div>
                        </div>
                        <div className="px-4 md:px-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {opts.includePatientName !== false && patientInfo.name && (
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">Name</p>
                                        <p className="text-blue-900 font-semibold">{patientInfo.name}</p>
                                    </div>
                                )}
                                {opts.includePatientAge !== false && patientInfo.age && (
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">Age</p>
                                        <p className="text-blue-900 font-semibold">{patientInfo.age} years</p>
                                    </div>
                                )}
                                {opts.includePatientGender !== false && patientInfo.gender && (
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">Gender</p>
                                        <p className="text-blue-900 font-semibold">{patientInfo.gender}</p>
                                    </div>
                                )}
                                {opts.includeBMI !== false && patientInfo.height && patientInfo.weight && (
                                    <>
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Height / Weight</p>
                                            <p className="text-blue-900 font-semibold">{patientInfo.height}cm / {patientInfo.weight}kg</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">BMI</p>
                                            <p className="text-blue-900 font-semibold">{calculateBMI(patientInfo.height, patientInfo.weight)}</p>
                                        </div>
                                    </>
                                )}
                                {opts.includePatientContact && patientInfo.contact && (
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-xs text-blue-600 font-medium">Contact</p>
                                        <p className="text-blue-900 font-semibold">{patientInfo.contact}</p>
                                    </div>
                                )}
                                {opts.includePatientAddress && patientInfo.address && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-blue-600 font-medium">Address</p>
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
                                <div className="mt-3 pt-3 border-t border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium">Chief Complaint</p>
                                    <p className="text-blue-800">{patientInfo.symptoms}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Smart Connect Data */}
            {smartConnectData && opts.includeSmartConnectData && Object.keys(smartConnectData).length > 0 && (
                <motion.div variants={variants}>
                    <GlassCard variant="elevated" intensity="medium" className="border-purple-100/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                        <div className="flex items-center gap-2 text-purple-900 text-base md:text-lg font-semibold mb-4 border-b border-purple-200/30 pb-2">
                            <Activity className="h-5 w-5" />
                            Smart Health Metrics
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {smartConnectData.pulseRate && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">Pulse Rate</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.pulseRate} <span className="text-sm font-normal">BPM</span></p>
                                </div>
                            )}
                            {smartConnectData.bloodPressure && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">Blood Pressure</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.bloodPressure} <span className="text-sm font-normal">mmHg</span></p>
                                </div>
                            )}
                            {smartConnectData.bloodOxygen && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">Blood Oxygen</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.bloodOxygen}<span className="text-sm font-normal">%</span></p>
                                </div>
                            )}
                            {smartConnectData.bodyTemp && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">Body Temperature</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.bodyTemp}<span className="text-sm font-normal">°C</span></p>
                                </div>
                            )}
                            {smartConnectData.hrv && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">HRV</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.hrv} <span className="text-sm font-normal">ms</span></p>
                                </div>
                            )}
                            {smartConnectData.stressLevel && (
                                <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 font-medium">Stress Level</p>
                                    <p className="text-xl font-bold text-purple-900">{smartConnectData.stressLevel}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            )}
        </>
    )
}
