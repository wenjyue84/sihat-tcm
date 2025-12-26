'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { AudioAnalysisLoader } from './AudioAnalysisLoader'
import { AudioAnalysisResult } from './AudioAnalysisResult'
import { useLanguage } from '@/stores/useAppStore'
import { useDiagnosisProgress } from '@/stores/useAppStore'

interface AudioAnalysisData {
    overall_observation: string
    voice_quality_analysis: any
    breathing_patterns: any
    speech_patterns: any
    cough_sounds: any
    pattern_suggestions?: string[]
    recommendations?: string[]
    confidence: string
    notes?: string
    status: string
}

// Recording states for clean UI
type RecordingState = 'idle' | 'initializing' | 'recording' | 'recorded' | 'playing'

export function AudioRecorder({ onComplete, onBack, initialData }: { onComplete: (data: any) => void, onBack?: () => void, initialData?: any }) {
    const { t, language } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()

    // Core recording state
    const [recordingState, setRecordingState] = useState<RecordingState>('idle')
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioData, setAudioData] = useState<string | null>(initialData?.audio || null)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [playbackProgress, setPlaybackProgress] = useState(0)

    // UI state
    const [expandedSection, setExpandedSection] = useState<number | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<AudioAnalysisData | null>(initialData?.analysis || null)
    const [micError, setMicError] = useState<string | null>(null)
    const [micErrorType, setMicErrorType] = useState<'permission_denied' | 'not_found' | 'busy' | 'https_required' | 'generic' | null>(null)
    const [showTroubleshoot, setShowTroubleshoot] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...')
    const [isSkipPromptOpen, setIsSkipPromptOpen] = useState(false)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Refs for navigation callbacks to avoid infinite loops
    // These refs always hold the latest values without triggering re-renders
    const onCompleteRef = useRef(onComplete)
    const onBackRef = useRef(onBack)
    const audioDataRef = useRef(audioData)
    const analysisResultRef = useRef(analysisResult)
    const recordingStateRef = useRef(recordingState)
    const isAnalyzingRef = useRef(isAnalyzing)

    // Keep refs up to date
    useEffect(() => {
        onCompleteRef.current = onComplete
        onBackRef.current = onBack
    }, [onComplete, onBack])

    useEffect(() => {
        audioDataRef.current = audioData
        analysisResultRef.current = analysisResult
        recordingStateRef.current = recordingState
        isAnalyzingRef.current = isAnalyzing
    }, [audioData, analysisResult, recordingState, isAnalyzing])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl])

    // Get supported MIME type for recording
    const getSupportedMimeType = (): string => {
        const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
        for (const type of types) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
                return type
            }
        }
        return ''
    }

    // Format duration as MM:SS
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Start recording
    const startRecording = async () => {
        setRecordingState('initializing')
        setConnectionStatus('Checking device...')
        setMicError(null)
        setMicErrorType(null)
        setShowTroubleshoot(false)
        setRecordingDuration(0)

        let permissionTimeout: NodeJS.Timeout | null = null;

        try {
            // Check if mediaDevices API is available (requires HTTPS or localhost)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("MediaDevices API not available. Make sure you're using HTTPS.")
                setMicError('Microphone access not available. Please use HTTPS or localhost.')
                setMicErrorType('https_required')
                setShowTroubleshoot(true)
                setRecordingState('idle') // Reset state on early return
                return
            }

            setConnectionStatus('Requesting access...')

            // Set a timeout to encourage user if the browser prompt is delayed or user is slow
            permissionTimeout = setTimeout(() => {
                setConnectionStatus('Please tap "Allow"...')
            }, 1000)

            // Request microphone access with basic constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })

            if (permissionTimeout) clearTimeout(permissionTimeout)
            setConnectionStatus('Starting audio...')

            streamRef.current = stream

            // Create MediaRecorder with supported format
            const mimeType = getSupportedMimeType()
            const options = mimeType ? { mimeType } : undefined
            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            // Collect data chunks
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            // Handle recording stop
            mediaRecorder.onstop = () => {
                // Stop duration timer
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current)
                }

                // Create blob and URL for playback
                const mimeTypeToUse = mimeType || 'audio/webm'
                const blob = new Blob(chunksRef.current, { type: mimeTypeToUse })
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)

                // Convert to base64 for storage/analysis
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    const base64data = reader.result as string
                    setAudioData(base64data)
                }

                // Clean up stream
                stream.getTracks().forEach(track => track.stop())
                setRecordingState('recorded')
            }

            // Start recording
            mediaRecorder.start(1000) // Collect data every second
            setRecordingState('recording')

            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)

        } catch (err: any) {
            if (permissionTimeout) clearTimeout(permissionTimeout)
            setRecordingState('idle')
            console.error('Error accessing microphone:', err)

            // Provide user-friendly error messages with error type for detailed UI
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setMicError('Microphone permission denied. Please allow microphone access.')
                setMicErrorType('permission_denied')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setMicError('No microphone found. Please connect a microphone.')
                setMicErrorType('not_found')
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setMicError('Microphone is busy. Please close other apps using it.')
                setMicErrorType('busy')
            } else {
                setMicError('Could not access microphone. Please check your settings.')
                setMicErrorType('generic')
            }
            setShowTroubleshoot(true)
        }
    }

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop()
        }
    }

    // Play recorded audio
    const playAudio = () => {
        if (!audioUrl) return

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl)
            audioRef.current.onended = () => {
                setRecordingState('recorded')
                setPlaybackProgress(0)
            }
            audioRef.current.ontimeupdate = () => {
                if (audioRef.current) {
                    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
                    setPlaybackProgress(isNaN(progress) ? 0 : progress)
                }
            }
        }

        audioRef.current.play()
        setRecordingState('playing')
    }

    // Pause audio playback
    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setRecordingState('recorded')
        }
    }

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('audio/')) {
            setMicError('Please upload a valid audio file.')
            return
        }

        setMicError(null)
        setMicErrorType(null)
        setShowTroubleshoot(false)

        // Create URL for playback
        const url = URL.createObjectURL(file)
        setAudioUrl(url)

        // Convert to base64
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => {
            const base64data = reader.result as string
            setAudioData(base64data)
            setRecordingState('recorded')
        }
    }

    const triggerFileUpload = () => {
        fileInputRef.current?.click()
    }

    // Retake recording
    const handleRetake = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
        setAudioData(null)
        setRecordingState('idle')
        setRecordingDuration(0)
        setPlaybackProgress(0)
        setAnalysisResult(null)
        setIsAnalyzing(false)
        // Clear any error states
        setMicError(null)
        setMicErrorType(null)
        setShowTroubleshoot(false)
    }

    // Analyze audio
    const analyzeAudio = async (base64Audio: string) => {
        setIsAnalyzing(true)
        setAnalysisResult(null)

        try {
            const response = await fetch('/api/analyze-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64Audio })
            })

            const result = await response.json()
            console.log('[AudioRecorder] Analysis result:', result)

            if (result.status === 'silence') {
                setAnalysisResult({
                    overall_observation: 'No clear audio detected.',
                    voice_quality_analysis: {
                        observation: 'No voice detected',
                        severity: 'warning',
                        tcm_indicators: ['Silent recording'],
                        clinical_significance: 'Please check your microphone settings'
                    },
                    breathing_patterns: null,
                    speech_patterns: null,
                    cough_sounds: null,
                    confidence: 'low',
                    notes: 'The recording appears to be silent. Please check your microphone and try again.',
                    status: 'error'
                })
                return
            }

            setAnalysisResult(result)
        } catch (error) {
            console.error('[AudioRecorder] Analysis failed:', error)
            setAnalysisResult({
                overall_observation: 'Audio analysis is unavailable.',
                voice_quality_analysis: {
                    observation: 'Recording saved but analysis failed',
                    severity: 'normal',
                    tcm_indicators: ['Recording saved'],
                    clinical_significance: 'Will be analyzed with comprehensive diagnosis'
                },
                breathing_patterns: null,
                speech_patterns: null,
                cough_sounds: null,
                confidence: 'low',
                notes: 'Real-time analysis unavailable. Recording saved for later processing.',
                status: 'pending'
            })
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Stable navigation handler for skip - uses refs to avoid recreating
    const handleSkipAnalysis = useCallback(() => {
        setIsAnalyzing(false)
        setAnalysisResult(null)
        // Allow skipping even if no audio is recorded
        onCompleteRef.current({
            audio: audioDataRef.current || null,
            analysisSkipped: true,
            skipCelebration: true,
            note: audioDataRef.current ? 'Analysis skipped - will be processed with final diagnosis' : 'Voice analysis skipped'
        })
    }, [])

    // Continue with current recording - starts analysis (uses refs)
    const handleContinue = useCallback(() => {
        if (audioDataRef.current) {
            analyzeAudio(audioDataRef.current)
        }
    }, [])

    // Continue after analysis result (uses refs)
    const handleContinueWithResult = useCallback((overriddenAnalysis?: AudioAnalysisData) => {
        if (audioDataRef.current) {
            onCompleteRef.current({
                audio: audioDataRef.current,
                analysis: overriddenAnalysis || analysisResultRef.current
            })
        }
    }, [])

    // Stable next handler - uses refs to always access latest state
    const handleNext = useCallback(() => {
        if (analysisResultRef.current) {
            handleContinueWithResult()
        } else if (audioDataRef.current || recordingStateRef.current === 'recorded') {
            handleContinue()
        } else {
            // Show skip prompt dialog instead of just setting error
            setIsSkipPromptOpen(true)
        }
    }, [handleContinueWithResult, handleContinue])

    // Stable back handler
    const handleBack = useCallback(() => {
        onBackRef.current?.()
    }, [])

    // Update global navigation state - now with stable handlers
    useEffect(() => {
        setNavigationState({
            onNext: handleNext,
            onBack: onBack ? handleBack : undefined,
            onSkip: handleSkipAnalysis,
            showNext: true,
            showBack: !!onBack,
            showSkip: true,
            canNext: !isAnalyzing
        })
    }, [setNavigationState, handleNext, handleBack, handleSkipAnalysis, !!onBack, isAnalyzing])

    // Show analysis loader while analyzing
    if (isAnalyzing) {
        return <AudioAnalysisLoader onSkip={handleSkipAnalysis} />
    }

    // Show analysis result after analysis is complete
    if (analysisResult) {
        return (
            <AudioAnalysisResult
                analysisData={analysisResult}
                onRetake={handleRetake}
                onUpload={triggerFileUpload}
                onContinue={handleContinueWithResult}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recording Section */}
            <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-green-50/50 border-green-100 pb-36 md:pb-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{t.audio.title}</h2>
                            <p className="text-sm text-gray-500">{t.audio.listeningDiagnosis}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-gray-700 font-medium mb-2">{t.audio.instructionsShort}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {t.audio.sayAhhh}
                    </p>
                </div>

                {/* Recording Area - Different states */}
                <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex flex-col items-center justify-center overflow-hidden relative border border-green-100 shadow-inner">

                    {/* Idle State - Ready to record */}
                    {(recordingState === 'idle' || recordingState === 'initializing') && (
                        <div
                            className={`text-gray-400 flex flex-col items-center gap-3 cursor-pointer group ${recordingState === 'initializing' ? 'pointer-events-none' : ''}`}
                            onClick={recordingState === 'idle' ? startRecording : undefined}
                        >
                            {recordingState === 'initializing' ? (
                                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-green-200">
                                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-dashed border-green-200 transition-all group-hover:border-green-400 group-hover:shadow-lg group-hover:scale-105">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 group-hover:text-green-500 transition-colors">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" x2="12" y1="19" y2="22" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-sm font-medium group-hover:text-green-600 transition-colors">
                                {recordingState === 'initializing' ? connectionStatus : t.audio.readyToRecord}
                            </span>
                        </div>
                    )}

                    {/* Recording State */}
                    {recordingState === 'recording' && (
                        <div className="flex flex-col items-center gap-4">
                            {/* Animated recording indicator */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    </svg>
                                </div>
                                {/* Pulsing rings */}
                                <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50"></div>
                            </div>

                            <div className="text-center">
                                <p className="text-2xl font-mono font-bold text-red-600">{formatDuration(recordingDuration)}</p>
                                <p className="text-sm text-gray-500">Recording...</p>
                            </div>

                            {/* Recording indicator badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-white">REC</span>
                            </div>
                        </div>
                    )}

                    {/* Recorded State - Ready to play */}
                    {(recordingState === 'recorded' || recordingState === 'playing') && (
                        <div className="flex flex-col items-center gap-4 w-full px-6">
                            {/* Playback controls */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={recordingState === 'playing' ? pauseAudio : playAudio}
                                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-all hover:scale-105"
                                >
                                    {recordingState === 'playing' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                            <rect x="6" y="4" width="4" height="16" rx="1" />
                                            <rect x="14" y="4" width="4" height="16" rx="1" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-100"
                                        style={{ width: `${playbackProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500">{formatDuration(recordingDuration)}</span>
                                    <span className="text-xs text-green-600 font-medium">✓ Recording complete</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Microphone Error Card - Enhanced for mobile with clear actions */}
                {micError && micErrorType && (
                    <div id="mic-error-message" className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 space-y-4">
                        {/* Error Header */}
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-red-800">
                                    {micErrorType === 'permission_denied' && t.audio.errors?.permissionDenied}
                                    {micErrorType === 'not_found' && t.audio.errors?.notFound}
                                    {micErrorType === 'busy' && t.audio.errors?.busy}
                                    {micErrorType === 'https_required' && t.audio.errors?.httpsRequired}
                                    {micErrorType === 'generic' && t.audio.errors?.generic}
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    {micErrorType === 'permission_denied' && t.audio.errors?.permissionDeniedDesc}
                                    {micErrorType === 'not_found' && t.audio.errors?.notFoundDesc}
                                    {micErrorType === 'busy' && t.audio.errors?.busyDesc}
                                    {micErrorType === 'https_required' && t.audio.errors?.httpsRequiredDesc}
                                    {micErrorType === 'generic' && t.audio.errors?.genericDesc}
                                </p>
                            </div>
                        </div>

                        {/* Tip Box */}
                        <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                            <div className="flex items-start gap-2">
                                <span className="text-amber-500 text-lg">💡</span>
                                <p className="text-sm text-gray-700">
                                    {micErrorType === 'permission_denied' && t.audio.errors?.permissionDeniedTip}
                                    {micErrorType === 'not_found' && t.audio.errors?.notFoundTip}
                                    {micErrorType === 'busy' && t.audio.errors?.busyTip}
                                    {micErrorType === 'https_required' && t.audio.errors?.httpsRequiredTip}
                                    {micErrorType === 'generic' && t.audio.errors?.genericTip}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                {micErrorType !== 'https_required' && (
                                    <Button
                                        onClick={() => {
                                            setMicError(null)
                                            setMicErrorType(null)
                                            startRecording()
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {t.audio.errors?.tryAgain || 'Try Again'}
                                    </Button>
                                )}
                                <Button
                                    onClick={triggerFileUpload}
                                    variant="outline"
                                    className="flex-1 border-green-600 text-green-700 hover:bg-green-50"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {t.audio.errors?.uploadInstead || 'Upload Audio'}
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSkipAnalysis}
                                    variant="ghost"
                                    className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    {t.audio.errors?.skipVoiceAnalysis || 'Skip Voice Analysis'}
                                </Button>
                                {onBack && (
                                    <Button
                                        onClick={handleBack}
                                        variant="ghost"
                                        className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        {t.audio.errors?.goBack || 'Go Back'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons - Fixed at bottom on mobile, normal flow on desktop */}
                {/* Desktop: Normal flow buttons */}
                <div className="hidden md:flex mt-6 flex-col gap-3">
                    <div className="flex gap-3">
                        {/* Different button based on state */}
                        {(recordingState === 'idle' || recordingState === 'initializing') && (
                            <Button
                                onClick={startRecording}
                                disabled={recordingState === 'initializing'}
                                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md disabled:opacity-80"
                            >
                                {recordingState === 'initializing' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {connectionStatus}
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                                        </svg>
                                        {t.audio.startRecording}
                                    </>
                                )}
                            </Button>
                        )}

                        {recordingState === 'recording' && (
                            <Button
                                onClick={stopRecording}
                                variant="destructive"
                                className="flex-1 h-12 text-base font-semibold bg-red-500 hover:bg-red-600 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                                {t.audio.stopAndContinue}
                            </Button>
                        )}

                        {(recordingState === 'recorded' || recordingState === 'playing') && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleRetake}
                                    className="h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100"
                                >
                                    Retake
                                </Button>
                                <Button
                                    onClick={handleContinue}
                                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
                                >
                                    Continue →
                                </Button>
                            </>
                        )}
                    </div>

                    {recordingState === 'idle' && (
                        <div className="flex justify-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="audio/*"
                                className="hidden"
                            />
                            <Button
                                variant="ghost"
                                onClick={triggerFileUpload}
                                className="text-sm text-gray-500 hover:text-green-600 hover:bg-green-50"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {t.camera.or} {t.camera.uploadAudio}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onComplete({
                                    audio: 'data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
                                    skipCelebration: true
                                })}
                                className="text-sm text-gray-500 hover:text-green-600 hover:bg-green-50"
                            >
                                {t.audio.debugSkip}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile: Fixed buttons above bottom navigation */}
                <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm px-4 py-3">
                    <div className="flex gap-3">
                        {/* Different button based on state */}
                        {(recordingState === 'idle' || recordingState === 'initializing') && (
                            <>
                                <Button
                                    onClick={startRecording}
                                    disabled={recordingState === 'initializing'}
                                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md disabled:opacity-80"
                                >
                                    {recordingState === 'initializing' ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            {connectionStatus}
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                                                <circle cx="12" cy="12" r="10" />
                                                <circle cx="12" cy="12" r="4" fill="currentColor" />
                                            </svg>
                                            {t.audio.startRecording}
                                        </>
                                    )}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="audio/*"
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={triggerFileUpload}
                                    disabled={recordingState === 'initializing'}
                                    className="h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {t.camera.uploadAudio}
                                </Button>
                            </>
                        )}

                        {recordingState === 'recording' && (
                            <Button
                                onClick={stopRecording}
                                variant="destructive"
                                className="flex-1 h-12 text-base font-semibold bg-red-500 hover:bg-red-600 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                                {t.audio.stopAndContinue}
                            </Button>
                        )}

                        {(recordingState === 'recorded' || recordingState === 'playing') && (
                            <Button
                                variant="outline"
                                onClick={handleRetake}
                                className="flex-1 h-12 px-4 border-stone-300 text-stone-600 hover:bg-stone-100"
                            >
                                {t.audio.recordAgain}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Recording Tips */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💡</span>
                        <span className="font-semibold text-amber-800 text-sm">{t.audio.tipsForBetterRecording}</span>
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1">
                        {t.audio.tips.map((tip: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>

            {/* Educational Content Section */}
            <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-slate-50 border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl">📖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{t.audio.learnAboutWen}</h3>
                        <p className="text-sm text-gray-500">{t.audio.traditionalChineseMedicine}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {t.audio.educationalIntro}
                    </p>
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
                    {t.audio.sections.map((section: { icon: string; title: string; content: string }, index: number) => (
                        <div
                            key={index}
                            className={`rounded-xl border transition-all duration-300 cursor-pointer ${expandedSection === index
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm'
                                : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
                                }`}
                            onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                        >
                            <div className="p-4 flex items-center gap-3">
                                <span className="text-2xl">{section.icon}</span>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">{section.title}</h4>
                                    {expandedSection !== index && (
                                        <p className="text-xs text-gray-500 mt-0.5">{t.audio.clickToLearnMore}</p>
                                    )}
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSection === index ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {expandedSection === index && (
                                <div className="px-4 pb-4 pt-0">
                                    <div className="h-px bg-green-100 mb-3"></div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick Facts */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">✨</span>
                        <span className="font-semibold text-purple-800 text-sm">{t.audio.didYouKnow}</span>
                    </div>
                    <p className="text-sm text-purple-700 leading-relaxed">
                        {t.audio.didYouKnowContent}
                    </p>
                </div>
            </Card>

            {/* Skip Prompt Dialog */}
            <Dialog open={isSkipPromptOpen} onOpenChange={setIsSkipPromptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {language === 'zh' ? '未提供语音录音' : language === 'ms' ? 'Tiada Rakaman Suara' : 'No Voice Recording'}
                        </DialogTitle>
                        <DialogDescription>
                            {language === 'zh'
                                ? '您尚未录制语音。语音分析有助于更准确的诊断。您确定要跳过吗？'
                                : language === 'ms'
                                    ? 'Anda belum merakam suara anda. Analisis suara membantu diagnosis yang lebih tepat. Adakah anda pasti mahu melangkau?'
                                    : 'You haven\'t recorded your voice. Voice analysis helps with more accurate diagnosis. Do you want to record or skip?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setIsSkipPromptOpen(false)}
                        >
                            {language === 'zh' ? '录制语音' : language === 'ms' ? 'Rakam Suara' : 'Record Voice'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsSkipPromptOpen(false)
                                handleSkipAnalysis()
                            }}
                        >
                            {language === 'zh' ? '跳过' : language === 'ms' ? 'Langkau' : 'Skip'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
