
import { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraPreviewProps {
    stream: MediaStream | null
    error: string | null
    isLoading: boolean
    onRetry: () => void
    onVideoReady: (video: HTMLVideoElement) => void
    t: any
}

function forceRepaint(element: HTMLElement): void {
    void element.offsetHeight
    const originalTransform = element.style.transform
    element.style.transform = 'translateZ(0)'
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            element.style.transform = originalTransform
        })
    })
}

export function CameraPreview({
    stream,
    error,
    isLoading,
    onRetry,
    onVideoReady,
    t
}: CameraPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [videoPlaying, setVideoPlaying] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video || !stream) return

        video.srcObject = stream

        const handleReady = () => {
            setVideoPlaying(true)
            forceRepaint(video)
            onVideoReady(video)
        }

        video.addEventListener('playing', handleReady)
        video.addEventListener('loadeddata', handleReady)

        video.play().catch(console.warn)

        return () => {
            video.removeEventListener('playing', handleReady)
            video.removeEventListener('loadeddata', handleReady)
            setVideoPlaying(false)
        }
    }, [stream, onVideoReady])

    if (error) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-50">
                <div className="text-center text-gray-400 mb-4">
                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-red-500 mb-4 opacity-90 max-w-xs mx-auto">{error}</p>
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry Camera
                    </Button>
                </div>
                <p className="text-sm text-gray-500 font-medium bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full shadow-sm">
                    {t.camera.useButtonsHint}
                </p>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
            {stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-[1]"
                />
            )}

            {(isLoading || !videoPlaying) && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[2]">
                    <div className="text-center text-gray-400">
                        <div className="w-12 h-12 mx-auto mb-3 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-sm font-medium text-emerald-600">
                            {t.camera.initializing}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
