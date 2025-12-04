'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRef, useState, useEffect } from 'react'

export function CameraCapture({ onComplete }: { onComplete: (data: any) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)

    useEffect(() => {
        startCamera()
        return () => stopCamera()
    }, [])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const captureImage = () => {
        // Direct bypass for testing
        onComplete({ image: 'mock_image_data' })
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Wang (Inspection)</h2>
            <p>Please take a photo of your tongue.</p>
            <div className="relative h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} width={640} height={480} className="hidden" />
                {!stream && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Camera Unavailable (Using Mock)</div>}
            </div>
            <Button onClick={captureImage}>Capture & Continue</Button>
        </Card>
    )
}
