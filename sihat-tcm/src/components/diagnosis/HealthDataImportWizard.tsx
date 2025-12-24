'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Activity, Heart, Moon, Footprints, Smartphone, ArrowRight, Watch } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export type HealthAppProvider = 'samsung' | 'apple' | 'google'

interface HealthDataImportWizardProps {
    isOpen: boolean
    onClose: () => void
    onDataImported: (data: ImportedHealthData) => void
}

export interface ImportedHealthData {
    provider: string
    steps: number
    sleepHours: number
    heartRate: number
    calories: number
    lastUpdated: string
}

const providers = {
    samsung: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    apple: { icon: Heart, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    google: { icon: Footprints, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
}

export function HealthDataImportWizard({ isOpen, onClose, onDataImported }: HealthDataImportWizardProps) {
    const { t } = useLanguage()
    const [step, setStep] = useState<'select' | 'connecting' | 'importing' | 'result'>('select')
    const [selectedProvider, setSelectedProvider] = useState<HealthAppProvider | null>(null)
    const [importedData, setImportedData] = useState<ImportedHealthData | null>(null)

    useEffect(() => {
        if (isOpen) {
            setStep('select')
            setSelectedProvider(null)
            setImportedData(null)
        }
    }, [isOpen])

    const handleConnect = (provider: HealthAppProvider) => {
        setSelectedProvider(provider)
        setStep('connecting')

        // Simulate connection delay
        setTimeout(() => {
            setStep('importing')

            // Simulate import delay
            setTimeout(() => {
                const mockData: ImportedHealthData = {
                    provider: t.healthDataImport.providers[provider],
                    steps: Math.floor(Math.random() * 5000) + 5000, // 5000-10000
                    sleepHours: Number((Math.random() * 2 + 6).toFixed(1)), // 6.0-8.0
                    heartRate: Math.floor(Math.random() * 20) + 60, // 60-80
                    calories: Math.floor(Math.random() * 500) + 1500, // 1500-2000
                    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                setImportedData(mockData)
                setStep('result')
            }, 2000)
        }, 1500)
    }

    const handleConfirm = () => {
        if (importedData) {
            onDataImported(importedData)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white text-stone-900 border-stone-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-700">
                        <Smartphone className="w-5 h-5" />
                        {t.healthDataImport.title}
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        {t.healthDataImport.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 min-h-[300px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 'select' && (
                            <motion.div
                                key="select"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-3"
                            >
                                <p className="text-sm font-medium text-stone-700 mb-2">{t.healthDataImport.selectProvider}</p>
                                {(Object.keys(providers) as HealthAppProvider[]).map((key) => {
                                    const p = providers[key]
                                    const Icon = p.icon
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleConnect(key)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${p.bg} ${p.border}`}
                                        >
                                            <div className={`p-2 rounded-full bg-white shadow-sm ${p.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className="font-semibold text-lg text-stone-800">{t.healthDataImport.providers[key]}</span>
                                            <ArrowRight className="ml-auto w-5 h-5 text-stone-400" />
                                        </button>
                                    )
                                })}
                            </motion.div>
                        )}

                        {step === 'connecting' && selectedProvider && (
                            <motion.div
                                key="connecting"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center flex-1 gap-6"
                            >
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${providers[selectedProvider].bg.replace('bg-', 'bg-')}`} />
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 bg-white ${providers[selectedProvider].border}`}>
                                        {(() => {
                                            const Icon = providers[selectedProvider].icon
                                            return <Icon className={`w-10 h-10 ${providers[selectedProvider].color} animate-pulse`} />
                                        })()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-stone-800">{t.healthDataImport.connecting.title}</h3>
                                    <p className="text-stone-500">{t.healthDataImport.connecting.description.replace('{provider}', t.healthDataImport.providers[selectedProvider])}</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'importing' && selectedProvider && (
                            <motion.div
                                key="importing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center flex-1 gap-6"
                            >
                                <div className="w-full max-w-[200px] space-y-4">
                                    <div className="flex items-center justify-between text-sm font-medium text-stone-600">
                                        <span>{t.healthDataImport.importing.syncing}</span>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-500"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 2, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>{t.healthDataImport.importing.activityHistory}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>{t.healthDataImport.importing.sleepPatterns}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>{t.healthDataImport.importing.heartRateVariability}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'result' && importedData && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-4 flex-1"
                            >
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-full">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-800">{t.healthDataImport.result.success}</h4>
                                        <p className="text-xs text-emerald-600">{t.healthDataImport.result.syncedFrom.replace('{provider}', importedData.provider)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                        <div className="flex items-center gap-2 mb-1 text-stone-500 text-xs uppercase font-bold tracking-wider">
                                            <Footprints className="w-3 h-3" /> {t.healthDataImport.result.steps}
                                        </div>
                                        <div className="text-xl font-bold text-stone-800">{importedData.steps.toLocaleString()}</div>
                                    </div>
                                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                        <div className="flex items-center gap-2 mb-1 text-stone-500 text-xs uppercase font-bold tracking-wider">
                                            <Moon className="w-3 h-3" /> {t.healthDataImport.result.sleep}
                                        </div>
                                        <div className="text-xl font-bold text-stone-800">{importedData.sleepHours}h</div>
                                    </div>
                                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                        <div className="flex items-center gap-2 mb-1 text-stone-500 text-xs uppercase font-bold tracking-wider">
                                            <Heart className="w-3 h-3" /> {t.healthDataImport.result.avgHr}
                                        </div>
                                        <div className="text-xl font-bold text-stone-800">{importedData.heartRate} <span className="text-xs font-normal text-stone-500">{t.healthDataImport.result.bpm}</span></div>
                                    </div>
                                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                        <div className="flex items-center gap-2 mb-1 text-stone-500 text-xs uppercase font-bold tracking-wider">
                                            <Activity className="w-3 h-3" /> {t.healthDataImport.result.calories}
                                        </div>
                                        <div className="text-xl font-bold text-stone-800">{importedData.calories}</div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4">
                                    <Button onClick={handleConfirm} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {t.healthDataImport.result.confirm}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
