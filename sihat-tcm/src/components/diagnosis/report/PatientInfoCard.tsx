import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { calculateBMI } from './utils'

interface PatientInfoCardProps {
    patientInfo: any
    reportOptions: any
}

export function PatientInfoCard({ patientInfo, reportOptions }: PatientInfoCardProps) {
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    if (!patientInfo || (!reportOptions.includePatientName && !reportOptions.includePatientAge && !reportOptions.includePatientGender && !reportOptions.includeBMI)) {
        return null;
    }

    return (
        <motion.div variants={item}>
            <GlassCard variant="elevated" intensity="medium" className="border-blue-100/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80">
                <div className="pb-2 px-4 md:px-6 mb-2 border-b border-blue-200/30">
                    <div className="flex items-center gap-2 text-blue-900 text-base md:text-lg font-semibold">
                        <User className="h-5 w-5 text-blue-700" />
                        Patient Information
                    </div>
                </div>
                <div className="px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {reportOptions.includePatientName !== false && patientInfo.name && (
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Name</p>
                                <p className="text-blue-900 font-semibold">{patientInfo.name}</p>
                            </div>
                        )}
                        {reportOptions.includePatientAge !== false && patientInfo.age && (
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Age</p>
                                <p className="text-blue-900 font-semibold">{patientInfo.age} years</p>
                            </div>
                        )}
                        {reportOptions.includePatientGender !== false && patientInfo.gender && (
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Gender</p>
                                <p className="text-blue-900 font-semibold">{patientInfo.gender}</p>
                            </div>
                        )}
                        {reportOptions.includeBMI !== false && patientInfo.height && patientInfo.weight && (
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
                        {reportOptions.includePatientContact && patientInfo.contact && (
                            <div className="col-span-2 md:col-span-1">
                                <p className="text-xs text-blue-600 font-medium">Contact</p>
                                <p className="text-blue-900 font-semibold">{patientInfo.contact}</p>
                            </div>
                        )}
                        {reportOptions.includePatientAddress && patientInfo.address && (
                            <div className="col-span-2">
                                <p className="text-xs text-blue-600 font-medium">Address</p>
                                <p className="text-blue-900 font-semibold">{patientInfo.address}</p>
                            </div>
                        )}
                        {reportOptions.includeEmergencyContact && patientInfo.emergencyContact && (
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
    )
}
