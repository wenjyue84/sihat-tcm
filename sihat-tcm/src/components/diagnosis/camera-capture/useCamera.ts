import { useState, useCallback, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface UseCameraReturn {
    stream: MediaStream | null
    error: string | null
    isLoading: boolean
    startCamera: () => Promise<void>
    stopCamera: () => void
    toggleCamera: () => void
    facingMode: 'user' | 'environment'
}

export function useCamera(): UseCameraReturn {
    const { t } = useLanguage()

    // Use stable ref for translations
    const tRef = useRef(t)
    useEffect(() => { tRef.current = t }, [t])

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

    const streamRef = useRef<MediaStream | null>(null)
    const isStartingRef = useRef(false)

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
            setStream(null)
        }
        isStartingRef.current = false
    }, [])

    const startCamera = useCallback(async () => {
        // Mutex: Don't start if already starting or has stream
        if (isStartingRef.current || streamRef.current) {
            console.log('[Camera] Skipping start - already in progress or has stream')
            return
        }

        isStartingRef.current = true
        console.log('[Camera] Starting camera with facing mode:', facingMode)

        try {
            setIsLoading(true)
            setError(null)

            // Check if mediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isSecure = window.isSecureContext
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

                if (!isSecure && !isLocalhost) {
                    setError("Browser security restricts camera access on non-secure (HTTP) connections.")
                } else {
                    setError(tRef.current.camera.cameraError)
                }
                setIsLoading(false)
                isStartingRef.current = false
                return
            }

            // Progressive fallback constraints
            const constraints = [
                { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
                { video: true },
            ]

            let mediaStream: MediaStream | null = null
            let lastError: Error | null = null

            // Helper to fetch media with timeout
            const getMediaWithTimeout = async (constraint: MediaStreamConstraints) => {
                return Promise.race([
                    navigator.mediaDevices.getUserMedia(constraint),
                    new Promise<MediaStream>((_, reject) =>
                        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
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
                streamRef.current = mediaStream
                setStream(mediaStream)
                // Note: We don't set isLoading(false) here, the UI should handle that when video plays
            } else {
                console.error('[Camera] All constraints failed')
                const errorMsg = lastError ? `${lastError.name}: ${lastError.message}` : tRef.current.camera.cameraError
                setError(errorMsg)
                setIsLoading(false)
                isStartingRef.current = false
            }
        } catch (err: any) {
            console.error('[Camera] Error:', err)
            setError(tRef.current.camera.cameraError)
            setIsLoading(false)
            isStartingRef.current = false
        }
    }, [facingMode])

    const toggleCamera = useCallback(() => {
        stopCamera()
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }, [stopCamera])

    // Cleanup on unmount or facingMode change
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            isStartingRef.current = false
        }
    }, [])

    // Restart camera if facingMode changes and we were running? 
    // The original code uses `toggleCamera` which sets state, and the user has to click "Start" again usually, 
    // OR existing effect cleans up.
    // In original code: `toggleCamera` updates `facingMode`. Effect on `[facingMode]` cleans up.
    // The user then has to click start again or we auto-start? 
    // Original `startCamera` was called by button.
    // Let's stick to manual start for now unless refactoring implies improvement.

    return {
        stream,
        error,
        isLoading: isLoading && !stream, // Treat as loading until we have stream logic
        startCamera,
        stopCamera,
        toggleCamera,
        facingMode
    }
}
