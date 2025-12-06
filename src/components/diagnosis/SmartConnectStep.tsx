'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Wifi, Heart, Activity, Droplets, Thermometer, Brain, Zap, Check, Settings, Smartphone, Footprints, Moon } from 'lucide-react'
import { IoTConnectionWizard, IoTDeviceType } from './IoTConnectionWizard'
import { HealthDataImportWizard, ImportedHealthData } from './HealthDataImportWizard'
import { useLanguage } from '@/contexts/LanguageContext'

export interface SmartConnectData {
    pulseRate?: number | string
    bloodPressure?: string
    bloodOxygen?: number | string
    bodyTemp?: number | string
    hrv?: number | string
    stressLevel?: number | string
    healthData?: ImportedHealthData
}

interface SmartConnectStepProps {
    onComplete: (data: SmartConnectData) => void
    onBack: () => void
    initialData?: SmartConnectData
}

const healthMetrics = [
    {
        id: 'pulse',
        key: 'pulseRate',
        labelKey: 'pulseRate',
        icon: Heart,
        color: 'from-rose-500 to-pink-600',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        textColor: 'text-rose-500',
        unit: 'BPM'
    },
    {
        id: 'bp',
        key: 'bloodPressure',
        labelKey: 'bloodPressure',
        icon: Activity,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-500',
        unit: 'mmHg'
    },
    {
        id: 'oxygen',
        key: 'bloodOxygen',
        labelKey: 'bloodOxygen',
        icon: Droplets,
        color: 'from-cyan-500 to-teal-600',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        textColor: 'text-cyan-500',
        unit: '%'
    },
    {
        id: 'temp',
        key: 'bodyTemp',
        labelKey: 'temperature',
        icon: Thermometer,
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-500',
        unit: '°C'
    },
    {
        id: 'hrv',
        key: 'hrv',
        labelKey: 'hrv',
        icon: Activity,
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-500',
        unit: 'ms'
    },
    {
        id: 'stress',
        key: 'stressLevel',
        labelKey: 'stressLevel',
        icon: Brain,
        color: 'from-orange-500 to-red-600',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-500',
        unit: 'Score'
    }
]

export function SmartConnectStep({ onComplete, onBack, initialData }: SmartConnectStepProps) {
    const { t } = useLanguage()
    const [data, setData] = useState<SmartConnectData>(initialData || {})
    const [activeWizard, setActiveWizard] = useState<IoTDeviceType | null>(null)
    const [showHealthWizard, setShowHealthWizard] = useState(false)

    const handleDeviceConnect = (metricId: string) => {
        setActiveWizard(metricId as IoTDeviceType)
    }

    const handleDataReceived = (metricKey: string, value: any) => {
        setData(prev => ({ ...prev, [metricKey]: value }))
        setActiveWizard(null)
    }

    const handleHealthDataImport = (healthData: ImportedHealthData) => {
        setData(prev => ({ ...prev, healthData }))
        setShowHealthWizard(false)
    }

    const handleSubmit = () => {
        onComplete(data)
    }

    // Count only IoT metrics for the counter (exclude healthData)
    const iotMetricCount = Object.entries(data).filter(([key, v]) =>
        key !== 'healthData' && v !== undefined && v !== null && v !== ''
    ).length

    // For the button text, consider both IoT metrics and health data
    const hasAnyData = iotMetricCount > 0 || data.healthData !== undefined

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-white/10">
            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                <div className="relative p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                                <Wifi className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {t.smartConnect.smartConnect}
                                </span>
                                <h2 className="text-2xl font-bold text-white">{t.smartConnect.smartHealthMonitor}</h2>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {t.smartConnect.manageDevices}
                        </Button>
                    </div>
                    <p className="text-slate-300 text-sm">
                        {t.smartConnect.description}
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="p-6 pb-28 md:pb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {healthMetrics.map((metric, index) => {
                        const Icon = metric.icon
                        const value = data[metric.key as keyof SmartConnectData]
                        const isConnected = value !== undefined && value !== null && value !== '' && typeof value !== 'object'

                        return (
                            <motion.div
                                key={metric.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <button
                                    onClick={() => handleDeviceConnect(metric.id)}
                                    className={`
                                        relative w-full p-4 rounded-xl border transition-all duration-300
                                        ${isConnected
                                            ? `${metric.bgColor} ${metric.borderColor} shadow-lg`
                                            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                        }
                                    `}
                                >
                                    {/* Connected indicator */}
                                    {isConnected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <Check className="w-3 h-3 text-white" />
                                        </motion.div>
                                    )}

                                    {/* Icon */}
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto
                                        ${isConnected
                                            ? `bg-gradient-to-br ${metric.color} shadow-lg`
                                            : 'bg-slate-700/50'
                                        }
                                    `}>
                                        <Icon className={`w-6 h-6 ${isConnected ? 'text-white' : metric.textColor}`} />
                                    </div>

                                    {/* Label */}
                                    <p className={`text-sm font-medium mb-1 ${isConnected ? metric.textColor : 'text-slate-300'}`}>
                                        {t.smartConnect[metric.labelKey as keyof typeof t.smartConnect]}
                                    </p>

                                    {/* Value or Connect button */}
                                    {isConnected ? (
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-xl font-bold text-white">{String(value)}</span>
                                            <span className="text-xs text-slate-400">{metric.unit}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-emerald-400 font-medium">
                                            {t.smartConnect.connect}
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Health Data Import Section */}
                <div className="mt-6 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">{t.smartConnect.healthAppData}</span>
                        <span className="text-xs text-slate-500">({t.smartConnect.optional})</span>
                    </div>

                    {!data.healthData ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowHealthWizard(true)}
                            className="w-full h-14 border-dashed border-2 border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-2 bg-transparent"
                        >
                            <Activity className="w-5 h-5" />
                            {t.smartConnect.importFromHealthApp}
                        </Button>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-full">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="font-semibold text-emerald-300">{t.smartConnect.importedFrom} {data.healthData.provider}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHealthWizard(true)}
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                >
                                    {t.smartConnect.update}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Footprints className="w-4 h-4 text-slate-500" />
                                    <span>{data.healthData.steps.toLocaleString()} {t.smartConnect.steps}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Moon className="w-4 h-4 text-slate-500" />
                                    <span>{data.healthData.sleepHours}h {t.smartConnect.sleep}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Heart className="w-4 h-4 text-slate-500" />
                                    <span>{data.healthData.heartRate} bpm</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Activity className="w-4 h-4 text-slate-500" />
                                    <span>{data.healthData.calories} kcal</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress indicator */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">{t.smartConnect.metricsConnected}</span>
                        <span className="text-sm font-semibold text-emerald-400">{iotMetricCount} / {healthMetrics.length}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(iotMetricCount / healthMetrics.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {iotMetricCount === 0 && !data.healthData
                            ? t.smartConnect.tapToConnect
                            : iotMetricCount === healthMetrics.length
                                ? t.smartConnect.allConnected
                                : t.smartConnect.continueConnecting
                        }
                    </p>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-30 md:static md:bg-transparent md:border-none md:shadow-none md:p-6 md:pt-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="h-12 px-6 border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    {t.common.back}
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1 h-12 text-lg font-semibold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                >
                    <span className="flex items-center gap-2">
                        {hasAnyData ? t.smartConnect.continueWithData : t.smartConnect.skipForNow}
                        <ChevronRight className="w-5 h-5" />
                    </span>
                </Button>
            </div>

            {/* IoT Connection Wizard */}
            {activeWizard && (
                <IoTConnectionWizard
                    isOpen={true}
                    onClose={() => setActiveWizard(null)}
                    deviceType={activeWizard}
                    onDataReceived={(value) => {
                        const metric = healthMetrics.find(m => m.id === activeWizard)
                        if (metric) {
                            handleDataReceived(metric.key, value)
                        }
                    }}
                />
            )}

            {/* Health Data Import Wizard */}
            <HealthDataImportWizard
                isOpen={showHealthWizard}
                onClose={() => setShowHealthWizard(false)}
                onDataImported={handleHealthDataImport}
            />
        </Card>
    )
}
