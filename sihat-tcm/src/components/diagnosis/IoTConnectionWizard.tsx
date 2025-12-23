'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Wifi, Activity, Heart, Thermometer, Droplets, Watch, Smartphone, Bluetooth, RefreshCw, Info, X } from 'lucide-react'

export type IoTDeviceType = 'pulse' | 'bp' | 'oxygen' | 'temp' | 'hrv' | 'stress'

interface IoTConnectionWizardProps {
    isOpen: boolean
    onClose: () => void
    deviceType: IoTDeviceType
    onDataReceived: (value: any) => void
}

const deviceConfig = {
    pulse: {
        name: 'Smart Heart Rate Monitor',
        icon: Heart,
        color: 'text-rose-500',
        unit: 'BPM',
        range: [65, 95],
        label: 'Pulse Rate',
        description: 'Heart rate is the speed of the heartbeat measured by the number of contractions (beats) of the heart per minute (bpm).',
        normalRangeText: '60 - 100 BPM'
    },
    bp: {
        name: 'Digital Blood Pressure Cuff',
        icon: Activity,
        color: 'text-blue-500',
        unit: 'mmHg',
        range: [110, 130], // Systolic range, will calc diastolic
        label: 'Blood Pressure',
        description: 'Blood pressure is the pressure of circulating blood against the walls of blood vessels.',
        normalRangeText: '90/60 - 120/80 mmHg'
    },
    oxygen: {
        name: 'Pulse Oximeter',
        icon: Droplets,
        color: 'text-cyan-500',
        unit: '%',
        range: [96, 99],
        label: 'Blood Oxygen',
        description: 'Blood oxygen level is a measure of how much oxygen your red blood cells are carrying.',
        normalRangeText: '95% - 100%'
    },
    temp: {
        name: 'Smart Thermometer',
        icon: Thermometer,
        color: 'text-amber-500',
        unit: '°C',
        range: [36.3, 37.1],
        label: 'Body Temperature',
        description: "Body temperature is a measure of your body's ability to generate and get rid of heat.",
        normalRangeText: '36.1°C - 37.2°C'
    },
    hrv: {
        name: 'HRV Tracker',
        icon: Activity,
        color: 'text-purple-500',
        unit: 'ms',
        range: [30, 80],
        label: 'Heart Rate Variability',
        description: 'Heart rate variability is the physiological phenomenon of variation in the time interval between heartbeats.',
        normalRangeText: '20 - 70 ms'
    },
    stress: {
        name: 'Stress Monitor',
        icon: Activity,
        color: 'text-orange-500',
        unit: 'Score',
        range: [15, 45],
        label: 'Stress Level',
        description: 'Stress level is estimated based on your heart rate variability and other physiological data.',
        normalRangeText: '10 - 40'
    }
}

export function IoTConnectionWizard({ isOpen, onClose, deviceType, onDataReceived }: IoTConnectionWizardProps) {
    const [step, setStep] = useState<'scanning' | 'connecting' | 'reading' | 'result'>('scanning')
    const [progress, setProgress] = useState(0)
    const [currentValue, setCurrentValue] = useState<string | number>('--')
    const [finalValue, setFinalValue] = useState<any>(null)
    const [showExplanation, setShowExplanation] = useState(false)

    const config = deviceConfig[deviceType]
    const Icon = config.icon

    useEffect(() => {
        if (isOpen) {
            setStep('scanning')
            setProgress(0)
            setCurrentValue('--')
            setFinalValue(null)

            // Simulate scanning
            const scanTimer = setTimeout(() => {
                setStep('connecting')
            }, 2000)

            return () => clearTimeout(scanTimer)
        }
    }, [isOpen])

    useEffect(() => {
        if (step === 'connecting') {
            const connectTimer = setTimeout(() => {
                setStep('reading')
            }, 1500)
            return () => clearTimeout(connectTimer)
        }
    }, [step])

    useEffect(() => {
        if (step === 'reading') {
            let interval: NodeJS.Timeout
            let counter = 0

            // Simulate reading data fluctuations
            interval = setInterval(() => {
                counter++
                const randomVal = generateRandomValue(deviceType, true)
                setCurrentValue(randomVal)
                setProgress(prev => Math.min(prev + 5, 100))

                if (counter >= 20) { // 2 seconds of reading
                    clearInterval(interval)
                    const final = generateRandomValue(deviceType, false)
                    setFinalValue(final)
                    setCurrentValue(final)
                    setStep('result')
                }
            }, 100)

            return () => clearInterval(interval)
        }
    }, [step, deviceType])

    const generateRandomValue = (type: IoTDeviceType, isFluctuating: boolean) => {
        const conf = deviceConfig[type]
        if (type === 'bp') {
            const sys = Math.floor(Math.random() * (conf.range[1] - conf.range[0]) + conf.range[0])
            const dia = Math.floor(sys * 0.65 + (Math.random() * 10 - 5))
            return `${sys}/${dia}`
        } else if (type === 'temp') {
            return (Math.random() * (conf.range[1] - conf.range[0]) + conf.range[0]).toFixed(1)
        } else {
            return Math.floor(Math.random() * (conf.range[1] - conf.range[0]) + conf.range[0])
        }
    }

    const handleConfirm = () => {
        onDataReceived(finalValue)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-slate-950 text-white border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-400">
                        <Watch className="w-5 h-5" />
                        Device Connection
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Connecting to {config.name}...
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center min-h-[300px] relative">
                    <AnimatePresence mode="wait">
                        {showExplanation ? (
                            <motion.div
                                key="explanation"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col p-4 rounded-lg"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                        <Info className="w-5 h-5" />
                                        About {config.label}
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowExplanation(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4">
                                    <div className="rounded-lg overflow-hidden border border-slate-700">
                                        <img src="/health-metrics-explanation.png" alt="Explanation" className="w-full h-32 object-cover" />
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {config.description}
                                    </p>
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Normal Range</span>
                                        <span className="text-lg font-mono text-emerald-400">{config.normalRangeText}</span>
                                    </div>
                                </div>
                                <Button onClick={() => setShowExplanation(false)} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white">
                                    Got it
                                </Button>
                            </motion.div>
                        ) : null}

                        {step === 'scanning' && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                    <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-500/50 relative z-10">
                                        <Bluetooth className="w-10 h-10 text-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-lg font-medium animate-pulse text-emerald-400">Scanning for devices...</p>
                                <p className="text-sm text-slate-500">Make sure your device is turned on and nearby</p>
                            </motion.div>
                        )}

                        {step === 'connecting' && (
                            <motion.div
                                key="connecting"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-500 relative">
                                    <Icon className={`w-10 h-10 ${config.color}`} />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                                <p className="text-lg font-medium text-white">Connecting...</p>
                            </motion.div>
                        )}

                        {step === 'reading' && (
                            <motion.div
                                key="reading"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-6 w-full"
                            >
                                <div className="flex items-center gap-4">
                                    <Icon className={`w-8 h-8 ${config.color} animate-pulse`} />
                                    <span className="text-4xl font-mono font-bold text-white">{currentValue}</span>
                                    <span className="text-xl text-slate-500">{config.unit}</span>
                                </div>

                                <div className="w-full h-32 bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800">
                                    {/* Fake waveform animation */}
                                    <div className="absolute inset-0 flex items-center">
                                        <motion.div
                                            className="w-full h-1 bg-emerald-500/50"
                                            animate={{
                                                scaleY: [1, 5, 1, 3, 1],
                                                opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />
                                </div>

                                <p className="text-sm text-emerald-400 animate-pulse">Reading sensor data...</p>
                            </motion.div>
                        )}

                        {step === 'result' && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-slate-400 mb-1">{config.label}</p>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-bold text-white">{finalValue}</span>
                                        <span className="text-xl text-slate-500">{config.unit}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full mt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowExplanation(true)}
                                        className="flex-1 border border-slate-600 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    >
                                        <Info className="w-4 h-4 mr-2" />
                                        Explain
                                    </Button>
                                    <Button variant="outline" onClick={() => setStep('reading')} className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Retry
                                    </Button>
                                    <Button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        Use Data
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
