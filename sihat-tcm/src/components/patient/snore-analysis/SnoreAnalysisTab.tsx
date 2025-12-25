'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Moon,
    Mic,
    MicOff,
    Play,
    Pause,
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Info,
    RefreshCw,
    Volume2,
    VolumeX,
    Clock,
    Activity,
    Lightbulb,
    Sparkles,
    Wind,
    Droplets,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateConstitution } from '@/lib/translations'
import { extractConstitutionType } from '@/lib/tcm-utils'

interface SnoreAnalysisResult {
    snoring_detected: boolean
    severity: 'none' | 'mild' | 'moderate' | 'severe'
    frequency: number
    average_duration_ms: number
    characteristics: string[]
    apnea_risk_indicators: string[]
    tcm_analysis: {
        pattern: string
        explanation: string
        meridians_affected: string[]
        fatigue_correlation: string
    }
    tcm_recommendations: Array<{
        type: 'acupressure' | 'dietary' | 'lifestyle' | 'herbal'
        suggestion: string
        benefit: string
    }>
    confidence: number
    raw_observations: string
}

interface SnoreAnalysisTabProps {
    sessions?: any[]
}

export function SnoreAnalysisTab({ sessions = [] }: SnoreAnalysisTabProps) {
    const { t } = useLanguage()
    const snoreT = t?.patientDashboard?.snoreAnalysis

    // Extract TCM context for the AI
    const latestSession = sessions[0]
    const tcmContext = latestSession ? {
        constitution: latestSession.constitution || latestSession.analysis_results?.constitution,
        symptoms: latestSession.symptoms || [],
        primary_diagnosis: latestSession.primary_diagnosis,
        has_fatigue: latestSession.symptoms?.some((s: string) => s.toLowerCase().includes('fatigue') || s.toLowerCase().includes('tired'))
            || latestSession.primary_diagnosis?.toLowerCase().includes('fatigue')
    } : null

    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<SnoreAnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!snoreT) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Loading snore analysis content...</p>
            </div>
        )
    }

    // Format duration as MM:SS
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Get supported MIME type
    const getSupportedMimeType = (): string => {
        const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type
            }
        }
        return 'audio/webm'
    }

    // Start recording
    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mimeType = getSupportedMimeType()
            const mediaRecorder = new MediaRecorder(stream, { mimeType })

            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
                setAudioBlob(audioBlob)
                const url = URL.createObjectURL(audioBlob)
                setAudioUrl(url)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(1000)
            setIsRecording(true)
            setRecordingDuration(0)

            intervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error('Error starting recording:', err)
            setError(snoreT.errors.microphoneDenied)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setAudioBlob(file)
            const url = URL.createObjectURL(file)
            setAudioUrl(url)
            setAnalysisResult(null)
            setError(null)
        }
    }

    const analyzeAudio = async () => {
        if (!audioBlob) return

        try {
            setIsAnalyzing(true)
            setError(null)

            const reader = new FileReader()
            reader.readAsDataURL(audioBlob)

            reader.onloadend = async () => {
                const base64Audio = reader.result as string
                const base64Data = base64Audio.split(',')[1]

                const response = await fetch('/api/analyze-snore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audio: base64Data,
                        duration: recordingDuration,
                        tcmContext
                    })
                })

                if (!response.ok) {
                    throw new Error('Analysis failed')
                }

                const result = await response.json()
                setAnalysisResult(result)
                setIsAnalyzing(false)
            }
        } catch (err) {
            console.error('Analysis error:', err)
            setError(snoreT.errors.analysisFailed)
            setIsAnalyzing(false)
        }
    }

    const resetRecording = () => {
        setAudioBlob(null)
        setAudioUrl(null)
        setAnalysisResult(null)
        setRecordingDuration(0)
        setError(null)
    }

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'none': return 'text-emerald-600 bg-emerald-100'
            case 'mild': return 'text-yellow-600 bg-yellow-100'
            case 'moderate': return 'text-orange-600 bg-orange-100'
            case 'severe': return 'text-red-600 bg-red-100'
            default: return 'text-slate-600 bg-slate-100'
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            {/* Redesigned Header with TCM Theme */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden group">
                        <Moon className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-900">
                            {snoreT.title}
                        </h2>
                        <p className="text-slate-500 font-medium">{snoreT.subtitle}</p>
                    </div>
                </div>

                {tcmContext?.constitution && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">
                            Current Constitution: {translateConstitution(extractConstitutionType(tcmContext.constitution), t)}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Interaction Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-100 pb-8">
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                                {isRecording ? "Capturing Vital Sounds..." : "Sleep Sound Analysis"}
                            </CardTitle>
                            <CardDescription className="text-slate-500 max-w-lg">
                                Using advanced sound patterns to identify TCM disharmonies and sleep quality.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-10">
                            <AnimatePresence mode="wait">
                                {/* Recording Stage */}
                                {!audioBlob && !analysisResult && (
                                    <motion.div
                                        key="record"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="text-center space-y-8"
                                    >
                                        <div className="relative inline-block">
                                            {isRecording ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="relative mb-8">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                            className="absolute inset-0 bg-red-100 rounded-full -m-4"
                                                        />
                                                        <div className="relative text-6xl font-mono font-black text-slate-800 tracking-tighter">
                                                            {formatDuration(recordingDuration)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={stopRecording}
                                                        size="lg"
                                                        className="bg-red-500 hover:bg-red-600 text-white rounded-full h-20 w-20 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                                                    >
                                                        <MicOff className="w-8 h-8" />
                                                    </Button>
                                                    <p className="mt-4 text-red-500 font-bold animate-pulse flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                                                        {snoreT.recording}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Button
                                                        onClick={startRecording}
                                                        className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full h-32 w-32 flex flex-col items-center justify-center shadow-2xl hover:scale-105 transition-all group"
                                                    >
                                                        <Mic className="w-10 h-10 mb-2 group-hover:animate-bounce" />
                                                        <span className="font-bold text-xs uppercase tracking-widest">Start</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {!isRecording && (
                                            <div className="flex flex-col items-center pt-4">
                                                <div className="h-px w-32 bg-slate-200 mb-6" />
                                                <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} className="hidden" />
                                                <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    {snoreT.uploadAudio}
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Ready for Analysis Stage */}
                                {audioBlob && !analysisResult && !isAnalyzing && (
                                    <motion.div
                                        key="ready"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center space-y-8"
                                    >
                                        <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Volume2 className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-800">Sound Captured</h3>
                                            <p className="text-slate-500">Captured {formatDuration(recordingDuration)} of audio. Ready for AI-TCM analysis.</p>
                                        </div>

                                        {audioUrl && (
                                            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="w-full h-10" controls />
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <Button
                                                onClick={analyzeAudio}
                                                size="lg"
                                                className="w-full sm:w-auto px-8 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 h-14 rounded-2xl shadow-lg font-bold text-lg"
                                            >
                                                <Zap className="w-5 h-5 mr-2" />
                                                Analyze with TCM AI
                                            </Button>
                                            <Button variant="outline" onClick={resetRecording} className="h-14 px-8 border-slate-200 rounded-2xl text-slate-600">
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Re-record
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Analyzing Stage */}
                                {isAnalyzing && (
                                    <motion.div
                                        key="analyzing"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-10 space-y-8"
                                    >
                                        <div className="relative h-2w w-24 mx-auto">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-500 rounded-full"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-bold text-slate-800">Decrypting Vital Patterns</h3>
                                            <p className="text-slate-500 animate-pulse">Our AI is correlating sound frequencies with TCM disharmonies...</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Result Stage */}
                                {analysisResult && (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8"
                                    >
                                        {/* Severity & Basic Findings */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className={`p-6 rounded-3xl flex flex-col justify-between border ${analysisResult.snoring_detected ? 'bg-orange-50/50 border-orange-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    {analysisResult.snoring_detected ? <AlertCircle className="w-6 h-6 text-orange-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                                    <span className="font-bold text-slate-800">{analysisResult.snoring_detected ? "Significant Snoring" : "Quiet Breathing"}</span>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Severity</span>
                                                    <span className={`px-4 py-1 rounded-full text-sm font-bold ${getSeverityColor(analysisResult.severity)}`}>
                                                        {snoreT.severityLevels[analysisResult.severity]}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                                <div className="flex items-center gap-3 mb-4 text-slate-400">
                                                    <Clock className="w-6 h-6" />
                                                    <span className="font-bold text-slate-800">Frequency Analysis</span>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Episodes</span>
                                                    <span className="text-2xl font-black text-slate-800">{analysisResult.frequency}<small className="text-xs ml-1 text-slate-400 uppercase font-bold">/min</small></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TCM PERSPECTIVE - HIGHLIGHTED */}
                                        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Activity className="w-32 h-32" />
                                            </div>

                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                                                        <Activity className="w-6 h-6 text-emerald-400" />
                                                    </div>
                                                    <h4 className="text-xl font-bold tracking-tight">TCM Pattern: {analysisResult.tcm_analysis.pattern}</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Mechanism</div>
                                                            <p className="text-emerald-50/80 leading-relaxed">{analysisResult.tcm_analysis.explanation}</p>
                                                        </div>
                                                        <div>
                                                            <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 text-red-300">Fatigue Link</div>
                                                            <p className="text-red-50/90 leading-relaxed font-medium">{analysisResult.tcm_analysis.fatigue_correlation}</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 rounded-2xl p-5 backdrop-blur-md border border-white/10">
                                                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Meridians Involved</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {analysisResult.tcm_analysis.meridians_affected.map((m, idx) => (
                                                                <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">{m}</span>
                                                            ))}
                                                        </div>

                                                        <div className="mt-6">
                                                            <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">TCM Insights</div>
                                                            <div className="text-sm italic text-emerald-50/60">
                                                                In TCM, the sound of snoring is a "listening diagnosis" (闻诊) that reveals the state of Qi and Phlegm in the body.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recommendations Grid */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-2">
                                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                                Path to Balance
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {analysisResult.tcm_recommendations.map((rec, i) => (
                                                    <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-emerald-200 hover:shadow-md transition-all group">
                                                        <div className="flex gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                                                                ${rec.type === 'acupressure' ? 'bg-purple-50 text-purple-600' :
                                                                    rec.type === 'dietary' ? 'bg-emerald-50 text-emerald-600' :
                                                                        rec.type === 'lifestyle' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {rec.type === 'acupressure' ? <Activity className="w-6 h-6" /> :
                                                                    rec.type === 'dietary' ? <Sparkles className="w-6 h-6" /> :
                                                                        rec.type === 'lifestyle' ? <Wind className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{rec.type}</div>
                                                                <h5 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors uppercase text-sm">{rec.suggestion}</h5>
                                                                <p className="text-sm text-slate-500 leading-snug">{rec.benefit}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100">
                                            <Button onClick={resetRecording} className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg">
                                                <RefreshCw className="w-5 h-5 mr-3" />
                                                New Session
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="bg-amber-50/50 border-b border-amber-50">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                                <Lightbulb className="w-5 h-5 text-amber-600" />
                                {snoreT.tips.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ul className="space-y-4">
                                {snoreT.tips.items.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50/30 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900 font-bold">
                                <Info className="w-5 h-5" />
                                TCM Listening Diagnosis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                In Traditional Chinese Medicine (TCM), sleep sounds provide critical clues about the balance of internal organs. Snoring is often a result of "Phlegm and Qi struggling" in the throat.
                            </p>
                            <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl text-xs text-indigo-700/80 italic font-bold">
                                "The breath is the mirror of the soul, and sleep the measure of the Spleen."
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 max-w-md w-full"
                    >
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <p className="font-bold flex-1">{error}</p>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full">
                            &times;
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
