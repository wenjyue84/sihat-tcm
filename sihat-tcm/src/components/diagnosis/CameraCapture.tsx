import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, Upload, RotateCcw, Check, SkipForward, SwitchCamera } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'
import { ScientificResearchModal } from './ScientificResearchModal'

interface CameraCaptureProps {
    onComplete: (data: any) => void;
    title?: string;
    instruction?: string;
    required?: boolean;
    mode?: 'tongue' | 'face' | 'body';
}

export function CameraCapture({
    onComplete,
    title,
    instruction,
    required = false,
    mode = 'face',
    onBack
}: CameraCaptureProps & { onBack?: () => void }) {
    const { t, language } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    // capturedImage state removed to skip preview
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
    const [showError, setShowError] = useState(false)
    const [isSkipPromptOpen, setIsSkipPromptOpen] = useState(false)

    // Use provided title/instruction or fall back to defaults from translations
    const displayTitle = title || t.camera.takePhoto
    const displayInstruction = instruction || t.camera.preparingCamera


    // Use refs to track state without causing re-renders
    const streamRef = useRef<MediaStream | null>(null)
    const isStartingRef = useRef(false) // Mutex to prevent concurrent starts
    const [isLoading, setIsLoading] = useState(false)
    const [videoPlaying, setVideoPlaying] = useState(false)
    const [hasStarted, setHasStarted] = useState(false) // Require manual start

    // Store translations in ref to avoid dependency issues
    const tRef = useRef(t)
    useEffect(() => { tRef.current = t }, [t])

    // Stable stop function using ref
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
            setStream(null)
            setVideoPlaying(false)
        }
        isStartingRef.current = false
    }, [])

    // Stable start function - uses refs to avoid dependency issues
    const startCamera = useCallback(async (targetFacingMode: 'user' | 'environment') => {
        // Mutex: Don't start if already starting or has stream
        if (isStartingRef.current || streamRef.current) {
            console.log('[Camera] Skipping start - already in progress or has stream')
            return
        }

        isStartingRef.current = true
        console.log('[Camera] Starting camera with facing mode:', targetFacingMode)

        try {
            setIsLoading(true)
            setError(null)
            setVideoPlaying(false)

            // Check if mediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isSecure = window.isSecureContext
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

                if (!isSecure && !isLocalhost) {
                    setError("Browser security restricts camera access on non-secure (HTTP) connections.")
                    setShowError(true)
                } else {
                    setError(tRef.current.camera.cameraError)
                }
                setIsLoading(false)
                isStartingRef.current = false
                return
            }

            // Progressive fallback constraints
            const constraints = [
                { video: { facingMode: { ideal: targetFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
                // Fallback immediately to simplest constraint if high-res fails
                { video: true },
            ]

            let mediaStream: MediaStream | null = null
            let lastError: Error | null = null

            // Helper to fetch media with timeout
            const getMediaWithTimeout = async (constraint: MediaStreamConstraints) => {
                return Promise.race([
                    navigator.mediaDevices.getUserMedia(constraint),
                    new Promise<MediaStream>((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), 10000) // Increased to 10s for permission prompt
                    )
                ])
            }

            for (const constraint of constraints) {
                try {
                    console.log('[Camera] Requesting stream with:', JSON.stringify(constraint))
                    mediaStream = await getMediaWithTimeout(constraint)
                    console.log('[Camera] Got stream successfully')
                    break
                } catch (err: any) {
                    console.warn('[Camera] Constraint failed:', JSON.stringify(constraint), err.message || err)
                    lastError = err
                }
            }

            // Check if we were stopped while waiting for camera
            if (!isStartingRef.current) {
                console.log('[Camera] Was stopped while waiting, cleaning up')
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop())
                }
                setIsLoading(false)
                return
            }

            if (mediaStream) {
                // Just set the stream state - let the useEffect handle the DOM attachment
                streamRef.current = mediaStream
                setStream(mediaStream)
                // We DON'T set isLoading(false) here yet - we wait for the video to play
            } else {
                console.error('[Camera] All constraints failed')
                const errorMsg = lastError ? `${lastError.name}: ${lastError.message}` : tRef.current.camera.cameraError
                setError(errorMsg)
                setIsLoading(false)
                isStartingRef.current = false
            }
        } catch (err) {
            console.error('[Camera] Error:', err)
            setError(tRef.current.camera.cameraError)
            setIsLoading(false)
            isStartingRef.current = false
        }
    }, []) // NO DEPENDENCIES - uses refs for everything

    // EFFECT: Attach stream to video element when stream state changes
    useEffect(() => {
        if (!stream || !videoRef.current) return

        const video = videoRef.current
        console.log('[Camera] Attaching stream to video element via effect')

        video.srcObject = stream

        const handleVideoReady = () => {
            console.log('[Camera] Video playing (event)')
            setVideoPlaying(true)
            setIsLoading(false)
            isStartingRef.current = false
        }

        video.addEventListener('playing', handleVideoReady)
        video.addEventListener('loadeddata', handleVideoReady)

        video.play().catch(e => {
            if (e.name !== 'AbortError') {
                console.warn('[Camera] Auto-play blocked in effect:', e)
                // If autoplay fails, we still consider it "ready" enough to show controls
                handleVideoReady()
            }
        })

        return () => {
            video.removeEventListener('playing', handleVideoReady)
            video.removeEventListener('loadeddata', handleVideoReady)
        }
    }, [stream]) // Runs whenever we get a new stream (or new video ref due to key change)

    // STABILITY: Cleanup camera on page unload/navigation
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            handleBeforeUnload()
        }
    }, [])

    // STABILITY: Handle visibility change (tab switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && streamRef.current && videoRef.current) {
                if (!videoRef.current.srcObject) {
                    videoRef.current.srcObject = streamRef.current
                }
                videoRef.current.play().catch(() => { })
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    // Camera initialization effect - ONLY cleanup logic
    useEffect(() => {
        // Cleanup on unmount or facingMode change
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            isStartingRef.current = false
            setVideoPlaying(false)
            setHasStarted(false)
        }
    }, [facingMode])

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
            const context = canvas.getContext('2d')
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                const imageData = canvas.toDataURL('image/jpeg', 0.9)
                stopCamera()
                onCompleteRef.current({ image: imageData })
            }
        }
    }, [stopCamera])

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                stopCamera()
                onCompleteRef.current({ image: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }, [stopCamera])

    // Stable refs for callbacks to prevent infinite re-renders
    const onCompleteRef = useRef(onComplete)
    const onBackRef = useRef(onBack)

    // Keep refs up to date
    useEffect(() => {
        onCompleteRef.current = onComplete
        onBackRef.current = onBack
    }, [onComplete, onBack])

    const handleSkip = useCallback(() => {
        onCompleteRef.current({ image: null })
    }, [])

    const toggleCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }, [])

    // Validation/Next Handler - memoized to prevent infinite loops
    const handleNext = useCallback(() => {
        // Since we auto-complete on capture, handleNext is only for "Skip" or error cases when no image is captured yet
        const canSkip = !required || process.env.NODE_ENV === 'development'
        if (canSkip) {
            setIsSkipPromptOpen(true)
        } else {
            // If nothing captured and required, prompt user or show error
            setError("Please capture or upload a photo first")
            setShowError(true)
        }
    }, [required])

    // Stable back handler
    const handleBack = useCallback(() => {
        onBackRef.current?.()
    }, [])

    // Update global navigation state
    useEffect(() => {
        const canSkip = !required || process.env.NODE_ENV === 'development'

        setNavigationState({
            onNext: handleNext,
            onBack: onBackRef.current ? handleBack : undefined,
            onSkip: canSkip ? handleSkip : undefined,
            showNext: true,
            showBack: !!onBackRef.current,
            showSkip: canSkip,
            canNext: true // Logic handling inside handleNext
        })
    }, [required, handleNext, handleBack, handleSkip, setNavigationState])

    const getPlaceholder = () => {
        const guideImages = {
            tongue: '/tongue-guide.png',
            face: '/face-guide.png',
            body: '/body-guide.png'
        }

        const guideLabels = {
            tongue: language === 'zh' ? '请按此方式拍摄舌头' : language === 'ms' ? 'Ikut gaya ini untuk foto lidah' : 'Position your tongue like this',
            face: language === 'zh' ? '请按此方式拍摄面部' : language === 'ms' ? 'Ikut gaya ini untuk foto wajah' : 'Position your face like this',
            body: language === 'zh' ? '请按此方式拍摄身体部位' : language === 'ms' ? 'Ikut gaya ini untuk foto bahagian badan' : 'Position the body part like this'
        }

        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden border-2 border-emerald-200/50 shadow-lg">
                    <img
                        src={guideImages[mode]}
                        alt={`${mode} positioning guide`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <p className="text-sm text-emerald-700 font-medium text-center px-4 py-1 bg-emerald-50 rounded-full">
                    {guideLabels[mode]}
                </p>
            </div>
        )
    }


    return (
        <Card className="p-4 md:p-6 space-y-4 pb-36 md:pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-xl font-semibold text-emerald-800">{displayTitle}</h2>
                    <p className="text-stone-600 text-sm mt-1">{displayInstruction}</p>
                </div>
                {/* Scientific Research Button - Only show for tongue analysis */}
                {mode === 'tongue' && (
                    <div className="self-center md:self-auto">
                        <ScientificResearchModal />
                    </div>
                )}
            </div>

            {/* PC: Side-by-side layout with guide and camera */}
            <div className="hidden md:flex gap-4">
                {/* Guide Reference Panel - PC Only */}
                <div className="w-1/3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
                    <p className="text-xs text-emerald-600 font-medium mb-3 uppercase tracking-wide">
                        {language === 'zh' ? '参考指南' : language === 'ms' ? 'Panduan Rujukan' : 'Reference Guide'}
                    </p>
                    {getPlaceholder()}
                </div>

                {/* Camera Preview - PC */}
                <div className="flex-1 relative h-96 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                    {!error ? (
                        !hasStarted ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
                                <Button
                                    onClick={() => {
                                        setHasStarted(true)
                                        startCamera(facingMode)
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <Camera className="w-6 h-6 mr-2" />
                                    Start Camera
                                </Button>
                                <p className="mt-4 text-sm text-stone-500">Camera access permission required</p>
                            </div>
                        ) : (
                            <>
                                <video
                                    key={stream ? stream.id : 'novideo'}
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-[1]"
                                    onPlaying={() => setVideoPlaying(true)}
                                    onLoadedData={() => setVideoPlaying(true)}
                                    onCanPlay={() => setVideoPlaying(true)}
                                    onPause={() => setVideoPlaying(false)}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10"
                                    onClick={toggleCamera}
                                >
                                    <SwitchCamera className="w-5 h-5" />
                                </Button>
                                <canvas ref={canvasRef} className="hidden" />
                                {/* Only show loading overlay when camera is initializing - COMPLETELY REMOVE when playing */}
                                {!videoPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[2]">
                                        <div className="text-center text-gray-400">
                                            <div className="w-12 h-12 mx-auto mb-3 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-emerald-600">
                                                {isLoading ? 'Starting camera...' : 'Initializing...'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-50">
                            <div className="text-center text-gray-400 mb-4">
                                <Camera className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                <p className="text-sm text-red-500 mb-4 opacity-90 max-w-xs mx-auto">{error}</p>
                                <Button
                                    onClick={() => startCamera(facingMode)}
                                    variant="outline"
                                    className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retry Camera
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 font-medium bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full shadow-sm">
                                Use buttons below to capture or upload
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile: Stacked layout */}
            <div className="md:hidden relative h-72 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                {!error ? (
                    !hasStarted ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
                            <Button
                                onClick={() => {
                                    setHasStarted(true)
                                    startCamera(facingMode)
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-4 shadow-lg"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Top to Start Camera
                            </Button>
                        </div>
                    ) : (
                        <>
                            <video
                                key={stream ? stream.id : 'novideo-mobile'}
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-[1]"
                                onPlaying={() => setVideoPlaying(true)}
                                onLoadedData={() => setVideoPlaying(true)}
                                onCanPlay={() => setVideoPlaying(true)}
                                onPause={() => setVideoPlaying(false)}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 z-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10"
                                onClick={toggleCamera}
                            >
                                <SwitchCamera className="w-5 h-5" />
                            </Button>
                            <canvas ref={canvasRef} className="hidden" />
                            {/* Only show overlay when video not yet playing - COMPLETELY REMOVE when playing */}
                            {!videoPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[2]">
                                    {isLoading ? (
                                        <div className="text-center">
                                            <div className="w-12 h-12 mx-auto mb-3 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-emerald-600">Starting camera...</p>
                                        </div>
                                    ) : (
                                        getPlaceholder()
                                    )}
                                </div>
                            )}
                        </>
                    )
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-50">
                        {/* Placeholder Graphic */}
                        <div className="mb-4">
                            {getPlaceholder()}
                        </div>

                        {/* Instruction Hint */}
                        <div className="absolute bottom-12 left-0 right-0 px-4">
                            <p className="text-sm text-gray-500 font-medium bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full inline-block shadow-sm">
                                Use buttons below to capture or upload
                            </p>
                        </div>

                        {/* Error Toggle Bar */}
                        <div className="absolute top-2 right-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowError(!showError)}
                                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full w-8 h-8 p-0"
                            >
                                <span className="sr-only">Show Error</span>
                                <span className="text-lg font-bold">i</span>
                            </Button>
                        </div>

                        {/* Collapsible Error Message */}
                        {showError && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 z-20 animate-in fade-in duration-200">
                                <div className="flex flex-col items-center space-y-4 max-w-xs">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <span className="text-red-500 font-bold text-xl">!</span>
                                    </div>
                                    <div className="text-red-600 font-medium text-sm">{error}</div>
                                    <Button
                                        onClick={() => startCamera(facingMode)}
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-2" />
                                        Retry Camera
                                    </Button>
                                    <div className="text-xs text-stone-500 space-y-1 text-left w-full pl-2 border-l-2 border-stone-200">
                                        <p>1. Check browser permissions</p>
                                        <p>2. Try using chrome/edge</p>
                                        <p className="font-semibold text-emerald-600">3. Use the Upload button below</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowError(false)}
                                        className="mt-2"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Action Buttons - Fixed above bottom navigation */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3">
                <div className="flex gap-3">
                    <Button
                        onClick={() => {
                            // If stream is available, use live capture, otherwise use camera input
                            if (stream) {
                                captureImage()
                            } else {
                                cameraInputRef.current?.click()
                            }
                        }}
                        className="flex-1 h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        {t.camera.capturePhoto}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 h-12 text-base border-stone-300 text-stone-600 hover:bg-stone-50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        {t.camera.uploadPhoto}
                    </Button>
                </div>
            </div>

            {/* Hidden file input for mobile - Upload (no capture = file picker) */}
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />

            {/* Hidden file input for mobile - Capture (with capture = camera) */}
            <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleFileUpload}
            />

            {/* Footer Buttons - Desktop only */}
            <div className="hidden md:flex justify-end mt-4 gap-3">
                <>
                    <div className="flex gap-2">
                        <Button
                            onClick={captureImage}
                            disabled={!stream}
                            className="flex-1 h-14 text-base bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            {t.camera.capturePhoto}
                        </Button>

                        {/* Hidden file input for desktop */}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />

                        <Button
                            variant="outline"
                            className="flex-1 h-14 text-base border-stone-300 text-stone-600 hover:bg-stone-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            {t.camera.uploadPhoto}
                        </Button>
                    </div>

                    {/* Skip button */}

                </>
            </div>
            <Dialog open={isSkipPromptOpen} onOpenChange={setIsSkipPromptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'tongue'
                                ? (language === 'zh' ? '未提供舌象照片' : language === 'ms' ? 'Tiada Foto Lidah' : 'No Tongue Photo')
                                : mode === 'face'
                                    ? (language === 'zh' ? '未提供面部照片' : language === 'ms' ? 'Tiada Foto Wajah' : 'No Face Photo')
                                    : (language === 'zh' ? '未提供照片' : language === 'ms' ? 'Tiada Foto' : 'No Photo Provided')
                            }
                        </DialogTitle>
                        <DialogDescription>
                            {language === 'zh'
                                ? '您尚未提供照片。提供照片有助于更准确的诊断。您确定要跳过吗？'
                                : language === 'ms'
                                    ? 'Anda belum memberikan foto. Foto membantu diagnosis yang lebih tepat. Adakah anda pasti mahu melangkau?'
                                    : 'You haven\'t provided a photo. Providing one ensures better diagnosis accuracy. Do you want to provide one or skip?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setIsSkipPromptOpen(false)}
                        >
                            {language === 'zh' ? '提供照片' : language === 'ms' ? 'Berikan Foto' : 'Provide Photo'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsSkipPromptOpen(false)
                                handleSkip()
                            }}
                        >
                            {language === 'zh' ? '跳过' : language === 'ms' ? 'Langkau' : 'Skip'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card >
    )
}

