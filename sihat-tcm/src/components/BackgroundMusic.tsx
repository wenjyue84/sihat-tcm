"use client"

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'


interface BackgroundMusicProps {
    enabled?: boolean
    url?: string
    initialVolume?: number
}

export function BackgroundMusic({ enabled = false, url, initialVolume = 0.5 }: BackgroundMusicProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(initialVolume)
    const [userInteracted, setUserInteracted] = useState(false)
    const [showControls, setShowControls] = useState(false)

    // Handle initial volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Handle play/pause based on enabled prop and user interaction
    useEffect(() => {
        if (!enabled || !url) {
            if (audioRef.current) {
                audioRef.current.pause()
                setIsPlaying(false)
            }
            return
        }

        const audio = audioRef.current
        if (!audio) return

        const playAudio = async () => {
            try {
                if (enabled && !isMuted) {
                    await audio.play()
                    setIsPlaying(true)
                }
            } catch (error) {
                console.log("Autoplay prevented:", error)
                setIsPlaying(false)
            }
        }

        if (userInteracted) {
            playAudio()
        }

        // Add event listener for first interaction
        const handleInteraction = () => {
            setUserInteracted(true)
            // Remove listeners
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }

        if (!userInteracted) {
            document.addEventListener('click', handleInteraction)
            document.addEventListener('keydown', handleInteraction)
        }

        return () => {
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }
    }, [enabled, url, isMuted, userInteracted])

    if (!enabled || !url) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 print:hidden">
            <audio
                ref={audioRef}
                src={url}
                loop
            />

            <div
                className={`bg-background/80 backdrop-blur-sm border rounded-full shadow-lg transition-all duration-300 flex items-center overflow-hidden ${showControls ? 'w-48 p-2 pl-3' : 'w-10 h-10 p-0 justify-center'}`}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {showControls ? (
                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <Slider
                            value={[volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setVolume(vals[0] / 100)}
                            className="w-24"
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-full h-full flex items-center justify-center text-primary transition-colors ${isPlaying ? 'animate-pulse hover:animate-none' : ''}`}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Music size={18} />}
                    </button>
                )}
            </div>
        </div>
    )
}
