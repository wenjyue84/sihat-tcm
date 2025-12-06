'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRef, useState, useEffect } from 'react'
import { Camera, Upload, RotateCcw, Check, SkipForward } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ShowPromptButton } from './ShowPromptButton'

interface CameraCaptureProps {
    onComplete: (data: any) => void;
    title?: string;
    instruction?: string;
    required?: boolean;
}

export function CameraCapture({
    onComplete,
    title,
    instruction,
    required = false
}: CameraCaptureProps) {
    const { t } = useLanguage()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)

    // Use provided title/instruction or fall back to defaults from translations
    const displayTitle = title || t.camera.takePhoto
    const displayInstruction = instruction || t.camera.preparingCamera

    useEffect(() => {
        if (!capturedImage) {
            startCamera()
        }
        return () => stopCamera()
    }, [capturedImage])

    const startCamera = async () => {
        try {
            setError(null)
            // Use environment camera (rear) by default for better photo quality
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError(t.camera.cameraError)
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
            const video = videoRef.current
            const canvas = canvasRef.current
            // Use actual video dimensions for better quality
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
            const context = canvas.getContext('2d')
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                const imageData = canvas.toDataURL('image/jpeg', 0.8)
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
        <Card className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="text-center md:text-left">
                    <h2 className="text-xl font-semibold text-emerald-800">{displayTitle}</h2>
                    <p className="text-stone-600 text-sm mt-1">{displayInstruction}</p>
                </div>
                <ShowPromptButton promptType="image" />
            </div>

            {/* Camera preview - taller on mobile for better framing */}
            <div className="relative h-72 md:h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain bg-black" />
                ) : (
                    !error ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            {!stream && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                                        <span>{t.camera.initializingCamera}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-4">
                            <div className="text-red-500 font-medium text-sm">{error}</div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p>1. {t.camera.checkPermissions}</p>
                                <p>2. {t.camera.useUploadInstead}</p>
                            </div>
                            <Button onClick={startCamera} variant="outline" size="sm">{t.camera.retryCamera}</Button>
                        </div>
                    )
                )}
            </div>

            <div className="flex flex-col gap-3">
                {capturedImage ? (
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRetake}
                            variant="outline"
                            className="flex-1 h-12 text-base"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {t.camera.retake}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {t.camera.confirm}
                        </Button>
                    </div>
                ) : (
                    <>
                        <Button
                            onClick={captureImage}
                            disabled={!stream}
                            className="w-full h-14 text-base bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            {t.camera.capturePhoto}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">{t.camera.or}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {/* Hidden file input with capture attribute for mobile */}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                className="flex-1 h-12 text-base"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {t.camera.uploadPhoto}
                            </Button>

                            {/* Show skip if NOT required, OR if in dev mode */}
                            {(!required || process.env.NODE_ENV === 'development') && (
                                <Button
                                    variant="ghost"
                                    className="h-12 px-6"
                                    onClick={handleSkip}
                                >
                                    <SkipForward className="w-4 h-4 mr-1" />
                                    {t.camera.skip}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Card>
    )
}

