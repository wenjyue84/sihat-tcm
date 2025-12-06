'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef, useEffect } from 'react'
import { ShowPromptButton } from './ShowPromptButton'
import { AudioAnalysisLoader } from './AudioAnalysisLoader'
import { AudioAnalysisResult } from './AudioAnalysisResult'
import { useLanguage } from '@/contexts/LanguageContext'

// TCM Educational content about Wen (Listening) diagnosis
const wenEducationalContent = {
    title: "Understanding Wen (聞診) - Listening & Smelling Diagnosis",
    introduction: "Wen diagnosis is one of the Four Pillars of TCM diagnosis. It involves the practitioner listening to sounds produced by the patient and, traditionally, noting any unusual body odors. This method provides valuable insights into the patient's internal health conditions.",
    sections: [
        {
            icon: "🔊",
            title: "Voice Quality Analysis",
            content: "A strong, clear voice typically indicates sufficient Qi and healthy Lung function. A weak or low voice may suggest Qi deficiency, while a hoarse voice could indicate Heat affecting the Lungs or Yin deficiency."
        },
        {
            icon: "💨",
            title: "Breathing Patterns",
            content: "The rhythm, depth, and sound of breathing reveal much about respiratory health. Rapid, shallow breathing may indicate Heat or anxiety, while slow, deep breathing suggests Cold patterns or Qi stagnation."
        },
        {
            icon: "🗣️",
            title: "Speech Patterns",
            content: "How a person speaks—whether fast or slow, loud or soft, clear or mumbled—reflects their mental state and Qi flow. Excessive talking may indicate Heart Fire, while reluctance to speak suggests Heart Qi deficiency."
        },
        {
            icon: "🫁",
            title: "Cough Sounds",
            content: "Different cough sounds indicate different conditions. A dry cough suggests Lung Yin deficiency or Heat, while a productive cough with white phlegm indicates Cold-Damp, and yellow phlegm points to Heat-Phlegm."
        }
    ],
    tips: [
        "Speak naturally and clearly",
        "Say 'Ahhh' for 5-10 seconds",
        "Describe any breathing difficulties",
        "Mention if you have a cough"
    ]
}

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

export function AudioRecorder({ onComplete, onBack }: { onComplete: (data: any) => void, onBack?: () => void }) {
    const { t } = useLanguage()
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioData, setAudioData] = useState<string | null>(null)
    const [expandedSection, setExpandedSection] = useState<number | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<AudioAnalysisData | null>(null)
    const [audioLevel, setAudioLevel] = useState(0)
    const [hasAudioSignal, setHasAudioSignal] = useState(false)
    const [micError, setMicError] = useState<string | null>(null)
    const [showTroubleshoot, setShowTroubleshoot] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>(undefined)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm',
            'audio/mp4',
            'audio/ogg',
            'audio/wav',
            'audio/aac'
        ]
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type
            }
        }
        return '' // Let browser pick default
    }

    const startRecording = async () => {
        setMicError(null)
        setShowTroubleshoot(false)
        setHasAudioSignal(false)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })
            streamRef.current = stream

            // Setup Audio Context for visualization
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioContext = new AudioContextClass()
            const analyser = audioContext.createAnalyser()
            const source = audioContext.createMediaStreamSource(stream)

            source.connect(analyser)
            analyser.fftSize = 256

            audioContextRef.current = audioContext
            analyserRef.current = analyser
            sourceRef.current = source

            // Setup MediaRecorder
            const mimeType = getSupportedMimeType()
            const options = mimeType ? { mimeType } : undefined
            const mediaRecorder = new MediaRecorder(stream, options)

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)

                // Convert to Base64
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    const base64data = reader.result as string
                    setAudioData(base64data)
                    // Start analysis automatically
                    analyzeAudio(base64data)
                }

                // Cleanup visualization
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            draw()
        } catch (err: any) {
            console.error("Error accessing microphone:", err)

            // Provide specific error messages based on error type
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setMicError('Microphone permission denied. Please allow microphone access to continue.')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setMicError('No microphone found. Please connect a microphone and try again.')
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setMicError('Microphone is in use by another application. Please close other apps and try again.')
            } else if (err.name === 'OverconstrainedError') {
                setMicError('Could not find a suitable microphone. Try using a different microphone.')
            } else {
                setMicError('Could not access microphone. Please check your settings and try again.')
            }
            setShowTroubleshoot(true)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Check if file is audio
        if (!file.type.startsWith('audio/')) {
            setMicError('Please upload a valid audio file.')
            return
        }

        setMicError(null)

        // Create object URL for playback
        const url = URL.createObjectURL(file)
        setAudioUrl(url)

        // Convert to base64 for analysis
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => {
            const base64data = reader.result as string
            setAudioData(base64data)
            analyzeAudio(base64data)
        }
    }

    const triggerFileUpload = () => {
        fileInputRef.current?.click()
    }

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
            setAnalysisResult(result)
        } catch (error) {
            console.error('[AudioRecorder] Analysis failed:', error)
            // Create a fallback result
            setAnalysisResult({
                overall_observation: 'Audio analysis is pending. Your recording has been saved and will be analyzed in the final report.',
                voice_quality_analysis: {
                    observation: 'Voice recording captured successfully',
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

    const handleSkipAnalysis = () => {
        setIsAnalyzing(false)
        setAnalysisResult(null)
        // Complete with just the audio data, analysis will be done later
        if (audioData) {
            onComplete({
                audio: audioData,
                analysisSkipped: true,
                note: 'Analysis skipped - will be processed with final diagnosis'
            })
        }
    }

    const handleRetake = () => {
        setAudioUrl(null)
        setAudioData(null)
        setAnalysisResult(null)
        setIsAnalyzing(false)
    }

    const handleContinue = () => {
        if (audioData) {
            onComplete({
                audio: audioData,
                analysis: analysisResult
            })
        }
    }

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return

        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        if (!canvasCtx) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        const timeDataArray = new Uint8Array(analyserRef.current.fftSize)

        const drawVisual = () => {
            animationFrameRef.current = requestAnimationFrame(drawVisual)

            if (!analyserRef.current) return

            // Get both frequency and time domain data
            analyserRef.current.getByteFrequencyData(dataArray)
            analyserRef.current.getByteTimeDomainData(timeDataArray)

            // Calculate average audio level
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i]
            }
            const avgLevel = sum / dataArray.length
            setAudioLevel(avgLevel)

            // Detect if there's actual audio signal (threshold of 5)
            if (avgLevel > 5) {
                setHasAudioSignal(true)
            }

            // Create gradient background
            const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0)
            gradient.addColorStop(0, '#f0fdf4')
            gradient.addColorStop(1, '#dcfce7')
            canvasCtx.fillStyle = gradient
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw center line
            canvasCtx.strokeStyle = '#86efac'
            canvasCtx.lineWidth = 1
            canvasCtx.beginPath()
            canvasCtx.moveTo(0, canvas.height / 2)
            canvasCtx.lineTo(canvas.width, canvas.height / 2)
            canvasCtx.stroke()

            // Draw symmetrical waveform (up and down)
            const centerY = canvas.height / 2
            const barWidth = Math.max(2, (canvas.width / bufferLength) * 1.5)
            const gap = 1

            for (let i = 0; i < bufferLength; i++) {
                // Calculate bar height from frequency data
                const barHeight = (dataArray[i] / 255) * (canvas.height / 2 - 10)

                // Color based on intensity - green to emerald
                const intensity = dataArray[i] / 255
                const hue = 140 + intensity * 20 // Green to teal
                const lightness = 40 + intensity * 15

                // Create gradient for each bar
                const barGradient = canvasCtx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight)
                barGradient.addColorStop(0, `hsl(${hue}, 75%, ${lightness}%)`)
                barGradient.addColorStop(0.5, `hsl(${hue}, 80%, ${lightness + 10}%)`)
                barGradient.addColorStop(1, `hsl(${hue}, 75%, ${lightness}%)`)

                canvasCtx.fillStyle = barGradient

                // Draw bar going up from center
                const x = i * (barWidth + gap)
                canvasCtx.fillRect(x, centerY - barHeight, barWidth, barHeight)

                // Draw bar going down from center (mirror)
                canvasCtx.fillRect(x, centerY, barWidth, barHeight)
            }

            // Add a subtle glow effect around active bars
            if (avgLevel > 10) {
                canvasCtx.shadowColor = 'rgba(34, 197, 94, 0.3)'
                canvasCtx.shadowBlur = 10
            } else {
                canvasCtx.shadowBlur = 0
            }
        }

        drawVisual()
    }

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
                onContinue={handleContinue}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recording Section */}
            <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-green-50/50 border-green-100 pb-24 md:pb-6">
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
                            <h2 className="text-xl font-bold text-gray-800">Wen 聞診</h2>
                            <p className="text-sm text-gray-500">Listening Diagnosis</p>
                        </div>
                    </div>
                    <ShowPromptButton promptType="audio" />
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-gray-700 font-medium mb-2">Instructions:</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Please say <span className="font-semibold text-green-600">"Ahhh"</span> for 5-10 seconds, then describe how you feel, including any breathing difficulties or cough patterns.
                    </p>
                </div>

                <div className="h-40 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center overflow-hidden relative border border-green-100 shadow-inner">
                    {isRecording ? (
                        <>
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={160}
                                className="absolute inset-0 w-full h-full rounded-xl"
                            />
                            {/* Recording indicator */}
                            <div className="absolute top-3 right-3 animate-pulse flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full shadow-lg">
                                <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                                <span className="text-xs font-semibold text-white">Recording</span>
                            </div>

                            {/* Audio level indicator */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-75 rounded-full ${audioLevel > 50 ? 'bg-green-500' : audioLevel > 20 ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}
                                        style={{ width: `${Math.min(100, audioLevel * 2)}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${hasAudioSignal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {hasAudioSignal ? '✓ Mic OK' : '⚠ No signal'}
                                </span>
                            </div>

                            {/* Warning if no audio signal after 3 seconds */}
                            {!hasAudioSignal && (
                                <div className="absolute top-3 left-3 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Check microphone
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-dashed border-green-200 transition-all hover:border-green-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" x2="12" y1="19" y2="22" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium">Ready to record your voice</span>
                        </div>
                    )}
                </div>

                {/* Microphone Error Message */}
                {micError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-800">{micError}</p>
                                <button
                                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                                    className="text-xs text-red-600 underline mt-1 hover:text-red-800"
                                >
                                    {showTroubleshoot ? 'Hide troubleshooting tips' : 'Show troubleshooting tips'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Microphone Troubleshooting Guide */}
                {showTroubleshoot && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-blue-800 text-sm">Microphone Troubleshooting</span>
                        </div>
                        <div className="space-y-2 text-sm text-blue-700">
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-500">1.</span>
                                <span><strong>Check browser permission:</strong> Click the lock/info icon in your browser's address bar and ensure microphone is set to "Allow"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-500">2.</span>
                                <span><strong>Check system settings:</strong> Go to your device settings → Privacy → Microphone and ensure access is enabled for your browser</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-500">3.</span>
                                <span><strong>Check physical connection:</strong> If using an external mic, ensure it's properly plugged in</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-500">4.</span>
                                <span><strong>Close other apps:</strong> Apps like Zoom, Teams, or other recording software may be using your microphone</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-500">5.</span>
                                <span><strong>Try a different browser:</strong> If issues persist, try Chrome, Firefox, or Edge</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button
                                onClick={startRecording}
                                variant="outline"
                                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </Button>
                            <Button
                                onClick={triggerFileUpload}
                                variant="outline"
                                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload File
                            </Button>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex flex-col gap-3">
                    <div className="flex gap-3">
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
                            onClick={isRecording ? stopRecording : startRecording}
                            variant={isRecording ? "destructive" : "default"}
                            className={`flex-1 h-12 text-base font-semibold transition-all shadow-md ${isRecording
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                }`}
                        >
                            {isRecording ? (
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="6" width="12" height="12" rx="2" />
                                    </svg>
                                    Stop & Analyze
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                                    </svg>
                                    Start Recording
                                </span>
                            )}
                        </Button>
                    </div>

                    {!isRecording && (
                        <div className="flex justify-center">
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
                                Or upload an audio file
                            </Button>
                        </div>
                    )}
                </div>

                {/* Recording Tips */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💡</span>
                        <span className="font-semibold text-amber-800 text-sm">Tips for Better Recording</span>
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1">
                        {wenEducationalContent.tips.map((tip, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <Button
                        variant="outline"
                        className="w-full opacity-60 hover:opacity-100"
                        onClick={() => onComplete({ audio: 'data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' })}
                    >
                        Debug: Skip
                    </Button>
                )}
            </Card>

            {/* Educational Content Section */}
            <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-slate-50 border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl">📖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Learn About Wen Diagnosis</h3>
                        <p className="text-sm text-gray-500">Traditional Chinese Medicine</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {wenEducationalContent.introduction}
                    </p>
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
                    {wenEducationalContent.sections.map((section, index) => (
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
                                        <p className="text-xs text-gray-500 mt-0.5">Click to learn more</p>
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
                        <span className="font-semibold text-purple-800 text-sm">Did You Know?</span>
                    </div>
                    <p className="text-sm text-purple-700 leading-relaxed">
                        Wen diagnosis has been practiced for over 2,000 years. Ancient TCM practitioners developed remarkable skills in diagnosing conditions simply by listening to a patient's voice, breathing, and even the sounds of their stomach!
                    </p>
                </div>
            </Card>
        </div>
    )
}
