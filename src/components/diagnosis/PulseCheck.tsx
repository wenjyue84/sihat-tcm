'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState, useRef } from 'react'
import { Heart, Watch, Activity, Droplets, ThermometerSun, CheckCircle2, ChevronRight, Info, AlertCircle, Stethoscope, Wifi } from 'lucide-react'
import { ShowPromptButton } from './ShowPromptButton'
import { IoTConnectionWizard, IoTDeviceType } from './IoTConnectionWizard'

// TCM Pulse Quality Types (脉象类型)
const tcmPulseQualities = [
    { id: 'hua', nameZh: '滑脉', nameEn: 'Slippery (Hua)', description: '脉来流利圆滑', descriptionEn: 'Smooth and flowing' },
    { id: 'se', nameZh: '涩脉', nameEn: 'Rough (Se)', description: '脉来艰涩不畅', descriptionEn: 'Unsmooth and hesitant' },
    { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)', description: '脉来端直如弦', descriptionEn: 'Taut like a bowstring' },
    { id: 'jin', nameZh: '紧脉', nameEn: 'Tight (Jin)', description: '脉来紧张有力', descriptionEn: 'Tight and forceful' },
    { id: 'xi', nameZh: '细脉', nameEn: 'Thin (Xi)', description: '脉来细如丝线', descriptionEn: 'Fine like a thread' },
    { id: 'hong', nameZh: '洪脉', nameEn: 'Surging (Hong)', description: '脉来洪大有力', descriptionEn: 'Large and forceful' },
    { id: 'ruo', nameZh: '弱脉', nameEn: 'Weak (Ruo)', description: '脉来软弱无力', descriptionEn: 'Soft and weak' },
    { id: 'chen', nameZh: '沉脉', nameEn: 'Deep (Chen)', description: '脉位深沉', descriptionEn: 'Deep, felt only with pressure' },
    { id: 'fu', nameZh: '浮脉', nameEn: 'Floating (Fu)', description: '脉位表浅', descriptionEn: 'Superficial, felt with light touch' },
    { id: 'chi', nameZh: '迟脉', nameEn: 'Slow (Chi)', description: '脉来迟缓', descriptionEn: 'Slow rate' },
    { id: 'shuo', nameZh: '数脉', nameEn: 'Rapid (Shuo)', description: '脉来急促', descriptionEn: 'Fast rate' },
    { id: 'normal', nameZh: '平脉', nameEn: 'Normal (Ping)', description: '脉来平和有力', descriptionEn: 'Normal and balanced' },
]

export function PulseCheck({ onComplete, onBack }: { onComplete: (data: any) => void, onBack?: () => void }) {
    const [taps, setTaps] = useState<number[]>([])
    const [bpm, setBpm] = useState<number | null>(null)
    const [manualBpm, setManualBpm] = useState<string>('')
    const [showGuide, setShowGuide] = useState(false) // Hide guide by default
    const [currentStep, setCurrentStep] = useState(0)
    const [inputMode, setInputMode] = useState<'tap' | 'manual'>('manual') // Default to manual
    const [selectedPulseQualities, setSelectedPulseQualities] = useState<string[]>([])
    const [wizardOpen, setWizardOpen] = useState(false)
    const [selectedDevice, setSelectedDevice] = useState<IoTDeviceType>('pulse')
    const [syncedData, setSyncedData] = useState<Record<string, any>>({})

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

    const togglePulseQuality = (id: string) => {
        setSelectedPulseQualities(prev =>
            prev.includes(id)
                ? prev.filter(q => q !== id)
                : [...prev, id]
        )
    }

    const finish = () => {
        const finalBpm = inputMode === 'manual' ? parseInt(manualBpm) || 70 : bpm || 70
        const selectedQualities = selectedPulseQualities.map(id => {
            const quality = tcmPulseQualities.find(q => q.id === id)
            return quality ? { id, nameZh: quality.nameZh, nameEn: quality.nameEn } : null
        }).filter(Boolean)

        onComplete({
            bpm: finalBpm,
            pulseQualities: selectedQualities
        })
    }

    const isComplete = inputMode === 'manual' ? manualBpm !== '' : bpm !== null

    const bpmInputRef = useRef<HTMLInputElement>(null)

    const handleComplete = () => {
        if (isComplete) {
            finish()
        } else {
            setInputMode('manual')
            setTimeout(() => {
                bpmInputRef.current?.focus()
            }, 0)
        }
    }

    return (
        <Card className="p-6 space-y-6 pb-24 md:pb-6">
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
                <div className="flex items-center gap-2">
                    <ShowPromptButton promptType="final" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGuide(!showGuide)}
                        className="text-emerald-600 hover:text-emerald-700"
                    >
                        {showGuide ? 'Hide Guide' : 'Show Guide'}
                    </Button>
                </div>
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
                                    ref={bpmInputRef}
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

            {/* TCM Pulse Quality Section - 中医脉象 */}
            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                {/* Professional TCM Practitioner Notice */}
                <div className="flex items-start gap-3 mb-4 p-3 bg-amber-100/70 rounded-lg border border-amber-300">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">
                            ⚕️ 专业中医师诊断 | TCM Practitioner Required
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                            以下脉象判断需由专业中医师通过切诊确认和输入。普通用户可跳过此部分。
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            The pulse qualities below require assessment by a qualified TCM practitioner. General users may skip this section.
                        </p>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Stethoscope className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">中医脉象 | TCM Pulse Qualities</h3>
                    <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">可选 Optional</span>
                </div>

                {/* Pulse Quality Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {tcmPulseQualities.map((quality) => (
                        <button
                            key={quality.id}
                            onClick={() => togglePulseQuality(quality.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${selectedPulseQualities.includes(quality.id)
                                ? 'border-amber-500 bg-amber-100 shadow-md'
                                : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-amber-800">{quality.nameZh}</span>
                                {selectedPulseQualities.includes(quality.id) && (
                                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                )}
                            </div>
                            <p className="text-xs text-amber-700">{quality.nameEn}</p>
                            <p className="text-xs text-amber-600 mt-1 opacity-75">{quality.description}</p>
                        </button>
                    ))}
                </div>

                {/* Selected Qualities Display */}
                {selectedPulseQualities.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800">
                            <span className="font-semibold">已选脉象 Selected: </span>
                            {selectedPulseQualities.map(id => {
                                const quality = tcmPulseQualities.find(q => q.id === id)
                                return quality?.nameZh
                            }).join('、')}
                        </p>
                    </div>
                )}
            </div>

            {/* Smart IoT Device Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
                    <img
                        src="/future-iot-device.png"
                        alt="Future IoT Device"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Smart Connect</span>
                            </div>
                            <h3 className="text-xl font-bold">IoT Health Monitor</h3>
                            <p className="text-sm text-slate-300">
                                Connect your smart devices to sync health metrics instantly.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                                <Watch className="w-4 h-4 mr-2" />
                                Manage Devices
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { id: 'pulse', label: 'Pulse Rate', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                            { id: 'bp', label: 'Blood Pressure', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                            { id: 'oxygen', label: 'Blood Oxygen', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                            { id: 'temp', label: 'Temperature', icon: ThermometerSun, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                            { id: 'hrv', label: 'HRV', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                            { id: 'stress', label: 'Stress Level', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                        ].map((device) => (
                            <button
                                key={device.id}
                                onClick={() => {
                                    setSelectedDevice(device.id as any)
                                    setWizardOpen(true)
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 ${device.bg} ${syncedData[device.id] ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900' : ''
                                    }`}
                            >
                                <div className={`p-2 rounded-full bg-white/5 ${device.color}`}>
                                    <device.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-200">{device.label}</span>
                                {syncedData[device.id] ? (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {syncedData[device.id]}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-500">Connect</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <IoTConnectionWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                deviceType={selectedDevice}
                onDataReceived={(data) => {
                    setSyncedData(prev => ({ ...prev, [selectedDevice]: data }))
                    if (selectedDevice === 'pulse') {
                        // If it's pulse, also update the main BPM state
                        setBpm(Number(data))
                        setInputMode('tap') // Switch to tap/display mode to show the result
                    }
                }}
            />

            {/* Complete Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                {onBack && (
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="h-12 w-12 p-0 flex-shrink-0 border-stone-300 text-stone-600 hover:bg-stone-100 md:hidden"
                    >
                        <span className="text-xl">←</span>
                    </Button>
                )}
                <Button
                    onClick={handleComplete}
                    className="flex-1 h-12 text-lg font-semibold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                >
                    <span className="flex items-center gap-2">
                        Complete Pulse Check
                        <ChevronRight className="w-5 h-5" />
                    </span>
                </Button>
            </div>
        </Card>
    )
}
