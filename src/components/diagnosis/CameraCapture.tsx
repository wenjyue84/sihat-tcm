'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRef, useState, useEffect } from 'react'

interface CameraCaptureProps {
    onComplete: (data: any) => void;
    title?: string;
    instruction?: string;
}

export function CameraCapture({
    onComplete,
    title = "Wang (Inspection)",
    instruction = "Please take a photo."
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)

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
            setError(null)
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Could not access camera. Please ensure you have granted permission.")
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d')
            if (context) {
                context.drawImage(videoRef.current, 0, 0, 640, 480)
                const imageData = canvasRef.current.toDataURL('image/jpeg')
                onComplete({ image: imageData })
            }
        }
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p>{instruction}</p>
            <div className="relative h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} width={640} height={480} className="hidden" />
                {!stream && !error && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Initializing Camera...</div>}
                {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">{error}</div>}
            </div>
            <Button onClick={captureImage} disabled={!stream}>Capture & Continue</Button>
        </Card>
    )
}
