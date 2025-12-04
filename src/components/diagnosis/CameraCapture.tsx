'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRef, useState, useEffect } from 'react'

interface CameraCaptureProps {
    onComplete: (data: any) => void;
    title?: string;
    instruction?: string;
    required?: boolean;
}

export function CameraCapture({
    onComplete,
    title = "Wang (Inspection)",
    instruction = "Please take a photo.",
    required = false
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)

    useEffect(() => {
        if (!capturedImage) {
            startCamera()
        }
        return () => stopCamera()
    }, [capturedImage])

    const startCamera = async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
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
                setCapturedImage(imageData)
                stopCamera()
            }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setCapturedImage(reader.result as string)
                stopCamera()
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRetake = () => {
        setCapturedImage(null)
    }

    const handleConfirm = () => {
        if (capturedImage) {
            onComplete({ image: capturedImage })
        }
    }

    const handleSkip = () => {
        onComplete({ image: null })
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p>{instruction}</p>

            <div className="relative h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain bg-black" />
                ) : (
                    !error ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={canvasRef} width={640} height={480} className="hidden" />
                            {!stream && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Initializing Camera...</div>}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-4">
                            <div className="text-red-500 font-medium">{error}</div>
                            <div className="text-sm text-gray-600">
                                <p>1. Check your browser address bar for a camera icon.</p>
                                <p>2. Click it and select "Allow".</p>
                                <p>3. Refresh the page or click Retry.</p>
                            </div>
                            <Button onClick={startCamera} variant="outline" size="sm">Retry Camera</Button>
                        </div>
                    )
                )}
            </div>

            <div className="flex flex-col gap-3">
                {capturedImage ? (
                    <div className="flex gap-2">
                        <Button onClick={handleRetake} variant="outline" className="flex-1">Retake</Button>
                        <Button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Confirm & Continue</Button>
                    </div>
                ) : (
                    <>
                        <Button onClick={captureImage} disabled={!stream} className="w-full">Capture Photo</Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload Photo Instead
                            </Button>

                            {/* Show skip if NOT required, OR if in dev mode */}
                            {(!required || process.env.NODE_ENV === 'development') && (
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                >
                                    Skip
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Card>
    )
}
