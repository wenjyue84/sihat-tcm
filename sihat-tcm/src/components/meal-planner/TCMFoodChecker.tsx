'use client'

import { useState, useRef } from 'react'
import { checkFoodSuitability } from '@/app/actions/meal-planner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Camera, Search, ArrowLeft, Thermometer, Droplets, CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, Image as ImageIcon, UtensilsCrossed } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/stores/useAppStore'

interface TCMFoodCheckerProps {
    latestDiagnosis?: any
    onBack?: () => void
}

export function TCMFoodChecker({ latestDiagnosis, onBack }: TCMFoodCheckerProps) {
    const { t } = useLanguage()
    const strings = t.patientDashboard.mealPlanner.foodChecker

    const [foodInput, setFoodInput] = useState('')
    const [imageBase64, setImageBase64] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'text' | 'image'>('text')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleCheck = async () => {
        if (!foodInput && !imageBase64) return

        if (!latestDiagnosis) {
            setError(strings.noDiagnosisWarning)
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await checkFoodSuitability({
                foodInput,
                diagnosisReport: latestDiagnosis,
                imageBase64: imageBase64 || undefined
            })

            if (response.success) {
                setResult(response.data)
            } else {
                setError(response.error || 'Failed to check food')
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImageBase64(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearInput = () => {
        setFoodInput('')
        setImageBase64(null)
        setResult(null)
        setError(null)
    }

    const getSuitabilityIcon = (suitability: string) => {
        switch (suitability) {
            case 'suitable': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            case 'moderate': return <AlertTriangle className="w-8 h-8 text-amber-500" />
            case 'avoid': return <XCircle className="w-8 h-8 text-red-500" />
            default: return null
        }
    }

    const getSuitabilityColor = (suitability: string) => {
        switch (suitability) {
            case 'suitable': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
            case 'moderate': return 'text-amber-700 bg-amber-50 border-amber-200'
            case 'avoid': return 'text-red-700 bg-red-50 border-red-200'
            default: return 'text-slate-700 bg-slate-50 border-slate-200'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{strings.title}</h2>
                    <p className="text-slate-600">{strings.subtitle}</p>
                </div>
            </div>

            <Card className="p-6 overflow-hidden relative border-amber-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Input Section */}
                    <div className="flex-1 space-y-4">
                        <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
                            <button
                                onClick={() => setMode('text')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Search className="w-4 h-4 inline-block mr-2" />
                                {strings.inputModeText}
                            </button>
                            <button
                                onClick={() => setMode('image')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'image' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Camera className="w-4 h-4 inline-block mr-2" />
                                {strings.inputModeImage}
                            </button>
                        </div>

                        {mode === 'text' ? (
                            <div className="relative">
                                <Input
                                    value={foodInput}
                                    onChange={(e) => setFoodInput(e.target.value)}
                                    placeholder={strings.inputPlaceholder}
                                    className="pr-12 h-14 text-lg border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Sparkles className="w-6 h-6 text-amber-500 opacity-50" />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                />
                                {imageBase64 ? (
                                    <div className="relative group/img">
                                        <img src={imageBase64} alt="Food thumbnail" className="h-48 w-full object-cover rounded-lg shadow-md" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <p className="text-white text-sm font-medium">Click to Change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <p className="text-slate-600 font-medium">{strings.takePhoto}</p>
                                        <p className="text-xs text-slate-400">{strings.dropZoneText}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleCheck}
                            disabled={loading || (!foodInput && !imageBase64)}
                            className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {strings.checking}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    {strings.checkButton}
                                </>
                            )}
                        </Button>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section / Result Placeholder */}
                    {!result && !loading && (
                        <div className="hidden md:flex flex-1 flex-col justify-center items-center p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                            <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                            <div className="text-center">
                                <p className="text-slate-500 text-sm font-medium">TCM Health Wisdom</p>
                                <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
                                    Learn if particular ingredients harmonize with your current internal state.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading Animation */}
                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl p-8 space-y-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-2xl">🥣</div>
                            </div>
                            <p className="text-amber-800 font-medium animate-pulse">{strings.checking}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <Card className={`overflow-hidden border-2 ${getSuitabilityColor(result.suitability)}`}>
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center text-center space-y-2">
                                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        {getSuitabilityIcon(result.suitability)}
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl font-black uppercase tracking-wider">{result.suitability === 'suitable' ? strings.suitable : result.suitability === 'moderate' ? strings.moderate : strings.avoid}</div>
                                        <div className="text-sm font-medium opacity-80">{strings.resultScore}: {result.score}%</div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-1">{strings.recommendation}</h3>
                                        <p className="text-lg font-semibold leading-snug">{result.recommendation}</p>
                                    </div>
                                    <div className="p-4 bg-white/50 rounded-lg border border-current opacity-90">
                                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            {strings.explanation}
                                        </h3>
                                        <p className="text-sm leading-relaxed">{result.explanation}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-5 border-slate-100 bg-white shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-orange-500" />
                                    {strings.tcmProperties}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span className="text-sm text-slate-500">{strings.nature}</span>
                                        <span className="text-sm font-bold text-slate-800 bg-orange-50 px-3 py-1 rounded-full">{result.tcm_nature}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">{strings.flavor}</span>
                                        <span className="text-sm font-bold text-slate-800 bg-blue-50 px-3 py-1 rounded-full">{result.tcm_flavor}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 border-slate-100 bg-white shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Droplets className="w-4 h-4 text-emerald-500" />
                                    {strings.betterAlternatives}
                                </h3>
                                <ul className="space-y-2">
                                    {result.alternatives.map((alt: string, i: number) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {alt}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>

                        <div className="flex justify-center">
                            <Button variant="outline" onClick={clearInput} className="rounded-full px-8 py-6 text-slate-600 hover:text-amber-600 hover:border-amber-200">
                                < RefreshCw className="w-4 h-4 mr-2" />
                                {strings.tryAnother}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function RefreshCw({ className, ...props }: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
