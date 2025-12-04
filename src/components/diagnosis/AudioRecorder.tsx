'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef } from 'react'

export function AudioRecorder({ onComplete }: { onComplete: (data: any) => void }) {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        setIsRecording(true)
    }

    const stopRecording = () => {
        setIsRecording(false)
        onComplete({ audio: 'mock_audio_data' })
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Wen (Listening)</h2>
            <p>Please say "Ahhh" and describe how you feel.</p>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                {isRecording ? (
                    <div className="animate-pulse text-red-500 font-bold">Recording...</div>
                ) : (
                    <div className="text-gray-400">Ready to record</div>
                )}
            </div>
            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "default"}>
                {isRecording ? "Stop & Continue" : "Start Recording"}
            </Button>
        </Card>
    )
}
