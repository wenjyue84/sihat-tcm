'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef, useEffect } from 'react'

export function AudioRecorder({ onComplete }: { onComplete: (data: any) => void }) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
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

            canvasCtx.fillStyle = 'rgb(243, 244, 246)' // bg-gray-100
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2

                // Gradient or solid color for bars
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }

        drawVisual()
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Wen (Listening)</h2>
            <p>Please say "Ahhh" and describe how you feel.</p>

            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                {isRecording ? (
                    <>
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={128}
                            className="absolute inset-0 w-full h-full"
                        />
                        <div className="absolute top-2 right-2 animate-pulse flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs font-medium text-red-500">Recording</span>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                        <span>Ready to record</span>
                    </div>
                )}
            </div>

            <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
            >
                {isRecording ? "Stop & Continue" : "Start Recording"}
            </Button>
            {process.env.NODE_ENV === 'development' && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onComplete({ audio: 'data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' })}
                >
                    Debug: Skip
                </Button>
            )}
        </Card>
    )
}
