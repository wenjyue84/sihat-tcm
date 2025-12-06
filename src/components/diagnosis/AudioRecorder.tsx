'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef, useEffect } from 'react'

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

export function AudioRecorder({ onComplete }: { onComplete: (data: any) => void }) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [expandedSection, setExpandedSection] = useState<number | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>(undefined)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

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
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)

                // Convert to Base64
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    onComplete({ audio: base64data });
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
        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone. Please ensure you have granted permission.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return

        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        if (!canvasCtx) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const drawVisual = () => {
            animationFrameRef.current = requestAnimationFrame(drawVisual)

            if (!analyserRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)

            // Create gradient background
            const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0)
            gradient.addColorStop(0, '#f0fdf4')
            gradient.addColorStop(1, '#dcfce7')
            canvasCtx.fillStyle = gradient
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2

                // Green gradient for bars matching the TCM theme
                const hue = 140 + (barHeight / 128) * 20 // Varies from green to teal
                canvasCtx.fillStyle = `hsl(${hue}, 70%, ${40 + (barHeight / 256) * 20}%)`
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }

        drawVisual()
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recording Section */}
            <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-green-50/50 border-green-100">
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

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-gray-700 font-medium mb-2">Instructions:</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Please say <span className="font-semibold text-green-600">"Ahhh"</span> for 5-10 seconds, then describe how you feel, including any breathing difficulties or cough patterns.
                    </p>
                </div>

                <div className="h-36 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center overflow-hidden relative border border-green-100 shadow-inner">
                    {isRecording ? (
                        <>
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={144}
                                className="absolute inset-0 w-full h-full rounded-xl"
                            />
                            <div className="absolute top-3 right-3 animate-pulse flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full shadow-lg">
                                <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                                <span className="text-xs font-semibold text-white">Recording</span>
                            </div>
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

                <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className={`w-full h-12 text-base font-semibold transition-all shadow-md ${isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        }`}
                >
                    {isRecording ? (
                        <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                            Stop & Continue
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
