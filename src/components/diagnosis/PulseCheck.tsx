'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef } from 'react'

export function PulseCheck({ onComplete }: { onComplete: (data: any) => void }) {
    const [taps, setTaps] = useState<number[]>([])
    const [bpm, setBpm] = useState<number | null>(null)

    const handleTap = () => {
        const now = Date.now()
        setTaps(prev => {
            const newTaps = [...prev, now]
            if (newTaps.length > 2) {
                // Calculate BPM based on last few taps
                const intervals = []
                for (let i = 1; i < newTaps.length; i++) {
                    intervals.push(newTaps[i] - newTaps[i - 1])
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
                setBpm(Math.round(60000 / avgInterval))
            }
            return newTaps
        })
    }

    const finish = () => {
        onComplete({ bpm: bpm || 70 }) // Default to 70 if not enough taps
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Qie (Palpation)</h2>
            <p>Tap the button in rhythm with your pulse for 10-15 seconds.</p>
            <div className="h-32 flex flex-col items-center justify-center space-y-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full w-24 h-24 active:scale-95 transition-transform"
                    onClick={handleTap}
                >
                    Tap
                </Button>
                {bpm && <div className="text-2xl font-bold text-emerald-600">{bpm} BPM</div>}
            </div>
            <Button onClick={finish} disabled={!bpm}>Finish</Button>
        </Card>
    )
}
