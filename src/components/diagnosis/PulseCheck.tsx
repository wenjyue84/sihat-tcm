'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Heart, Watch, Activity, Droplets, ThermometerSun, CheckCircle2, ChevronRight, Info } from 'lucide-react'

export function PulseCheck({ onComplete }: { onComplete: (data: any) => void }) {
    const [taps, setTaps] = useState<number[]>([])
    const [bpm, setBpm] = useState<number | null>(null)
    const [manualBpm, setManualBpm] = useState<string>('')
    const [showGuide, setShowGuide] = useState(true) // Show guide by default
    const [currentStep, setCurrentStep] = useState(0)
    const [inputMode, setInputMode] = useState<'tap' | 'manual'>('manual') // Default to manual

    const steps = [
        {
            title: "Find Your Pulse Point",
            description: "Turn your palm facing up. Place your index and middle fingers on your wrist, just below the base of your thumb.",
            tip: "Don't use your thumb - it has its own pulse!"
        },
        {
            title: "Feel the Beat",
            description: "Press gently until you feel the rhythmic pulsing of your radial artery. This is your pulse.",
            tip: "If you can't feel it, try moving your fingers slightly or pressing a bit harder."
        },
        {
            title: "Count for 60 Seconds",
            description: "Count how many beats you feel in 60 seconds. This number is your heart rate in BPM (beats per minute).",
            tip: "Alternatively, count for 15 seconds and multiply by 4 for a quick estimate."
        }
    ]

    const handleTap = () => {
        const now = Date.now()
        setTaps(prev => {
            const newTaps = [...prev, now]
            if (newTaps.length > 2) {
                const intervals = []
                for (let i = 1; i < newTaps.length; i++) {
                    intervals.push(newTaps[i] - newTaps[i - 1])
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
                setBpm(Math.round(60000 / avgInterval))
            }
            return newTaps
        })
    }

    const resetTaps = () => {
        setTaps([])
        setBpm(null)
    }

    const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 200)) {
            setManualBpm(value)
        }
    }

    const finish = () => {
        const finalBpm = inputMode === 'manual' ? parseInt(manualBpm) || 70 : bpm || 70
        onComplete({ bpm: finalBpm })
    }

    const isComplete = inputMode === 'manual' ? manualBpm !== '' : bpm !== null

    return (
        <Card className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl">
                        <Heart className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">切 Qie (Palpation)</h2>
                        <p className="text-sm text-slate-500">Pulse Diagnosis</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-emerald-600 hover:text-emerald-700"
                >
                    {showGuide ? 'Hide Guide' : 'Show Guide'}
                </Button>
            </div>

            {/* Step-by-Step Guide */}
            {showGuide && (
                <div className="space-y-4">
                    {/* Steps Image */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50">
                        <img
                            src="/pulse-check-steps.png"
                            alt="How to Check Your Pulse"
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {/* Step Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${currentStep === index
                                        ? 'border-emerald-400 bg-emerald-50 shadow-md'
                                        : 'border-slate-200 bg-white hover:border-emerald-200'
                                    }`}
                                onClick={() => setCurrentStep(index)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === index
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <h3 className="font-medium text-sm">{step.title}</h3>
                                </div>
                                <p className="text-xs text-slate-600 mb-2">{step.description}</p>
                                <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{step.tip}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Mode Selection */}
            <div className="flex gap-3">
                <Button
                    variant={inputMode === 'manual' ? 'default' : 'outline'}
                    className={`flex-1 ${inputMode === 'manual' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setInputMode('manual')}
                >
                    Enter BPM Manually
                </Button>
                <Button
                    variant={inputMode === 'tap' ? 'default' : 'outline'}
                    className={`flex-1 ${inputMode === 'tap' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => { setInputMode('tap'); resetTaps(); }}
                >
                    Tap to Measure
                </Button>
            </div>

            {/* Input Area */}
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl p-6">
                {inputMode === 'manual' ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-slate-600 mb-4">
                                After counting your pulse for 60 seconds, enter your heart rate below:
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Enter BPM"
                                    value={manualBpm}
                                    onChange={handleManualInput}
                                    className="w-32 text-center text-2xl font-bold h-16 border-2 border-emerald-200 focus:border-emerald-500"
                                />
                                <span className="text-xl font-semibold text-slate-500">BPM</span>
                            </div>
                            {manualBpm && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">
                                        {parseInt(manualBpm) < 60 ? 'Low (Bradycardia)' :
                                            parseInt(manualBpm) > 100 ? 'High (Tachycardia)' :
                                                'Normal Range'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <p className="text-slate-600">
                            Tap the button in rhythm with your pulse for 10-15 seconds:
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                variant="outline"
                                className={`rounded-full w-28 h-28 active:scale-90 transition-all duration-150 border-2 ${taps.length > 0
                                        ? 'border-rose-400 bg-rose-50 hover:bg-rose-100'
                                        : 'border-emerald-400 hover:bg-emerald-50'
                                    }`}
                                onClick={handleTap}
                            >
                                <Heart className={`w-10 h-10 ${taps.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                            </Button>
                            <div className="text-sm text-slate-500">
                                Taps: {taps.length}
                            </div>
                            {bpm && (
                                <div className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                                    <Activity className="w-8 h-8" />
                                    {bpm} BPM
                                </div>
                            )}
                            {taps.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={resetTaps}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Future IoT Device Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-teal-800 p-5 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                    <img
                        src="/future-iot-device.png"
                        alt="Future IoT Device"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Watch className="w-5 h-5 text-teal-300" />
                        <span className="text-sm font-semibold text-teal-300 uppercase tracking-wide">Coming Soon</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Smart TCM Health Monitor</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        In the future, our IoT wristband device will automatically detect and transmit your health data:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                            <Heart className="w-4 h-4 text-rose-400" />
                            <span className="text-xs">Pulse Rate</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                            <Activity className="w-4 h-4 text-blue-400" />
                            <span className="text-xs">血压 Blood Pressure</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                            <Droplets className="w-4 h-4 text-red-400" />
                            <span className="text-xs">Blood Oxygen</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                            <ThermometerSun className="w-4 h-4 text-amber-400" />
                            <span className="text-xs">Body Temperature</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Button */}
            <Button
                onClick={finish}
                disabled={!isComplete}
                className={`w-full h-12 text-lg font-semibold transition-all ${isComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg'
                        : 'bg-slate-300'
                    }`}
            >
                <span className="flex items-center gap-2">
                    Complete Pulse Check
                    <ChevronRight className="w-5 h-5" />
                </span>
            </Button>
        </Card>
    )
}
