'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Wifi, Activity, Heart, Thermometer, Droplets, Watch, Smartphone, Bluetooth, RefreshCw } from 'lucide-react'

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
        label: 'Pulse Rate'
    },
    bp: {
        name: 'Digital Blood Pressure Cuff',
        icon: Activity,
        color: 'text-blue-500',
        unit: 'mmHg',
        range: [110, 130], // Systolic range, will calc diastolic
        label: 'Blood Pressure'
    },
    oxygen: {
        name: 'Pulse Oximeter',
        icon: Droplets,
        color: 'text-cyan-500',
        unit: '%',
        range: [96, 99],
        label: 'Blood Oxygen'
    },
    temp: {
        name: 'Smart Thermometer',
        icon: Thermometer,
        color: 'text-amber-500',
        unit: '°C',
        range: [36.3, 37.1],
        label: 'Body Temperature'
    },
    hrv: {
        name: 'HRV Tracker',
        icon: Activity,
        color: 'text-purple-500',
        unit: 'ms',
        range: [30, 80],
        label: 'Heart Rate Variability'
    },
    stress: {
        name: 'Stress Monitor',
        icon: Activity,
        color: 'text-orange-500',
        unit: 'Score',
        range: [15, 45],
        label: 'Stress Level'
    }
}

export function IoTConnectionWizard({ isOpen, onClose, deviceType, onDataReceived }: IoTConnectionWizardProps) {
    const [step, setStep] = useState<'scanning' | 'connecting' | 'reading' | 'result'>('scanning')
    const [progress, setProgress] = useState(0)
    const [currentValue, setCurrentValue] = useState<string | number>('--')
    const [finalValue, setFinalValue] = useState<any>(null)

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
                        IoT Device Connection
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Connecting to {config.name}...
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center min-h-[300px]">
                    <AnimatePresence mode="wait">
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
                                    <Button variant="outline" onClick={() => setStep('reading')} className="flex-1 border-slate-700 hover:bg-slate-800 hover:text-white">
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
