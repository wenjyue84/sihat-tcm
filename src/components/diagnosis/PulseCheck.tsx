'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef } from 'react'

export function PulseCheck({ onComplete }: { onComplete: (data: any) => void }) {
    const [taps, setTaps] = useState<number[]>([])
    const [bpm, setBpm] = useState<number | null>(null)
    const [showGuide, setShowGuide] = useState(false)

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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Qie (Palpation)</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)}>
                    {showGuide ? 'Hide Guide' : 'How to use?'}
                </Button>
            </div>

            {showGuide && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-2">
                            <h3 className="font-medium">How to measure:</h3>
                            <ol className="list-decimal list-inside space-y-1 text-slate-600">
                                <li>Place index & middle fingers on wrist artery</li>
                                <li>Feel your pulse rhythm</li>
                                <li>Tap the button in sync with each beat</li>
                                <li>Continue for 10-15 seconds</li>
                            </ol>
                        </div>
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                            <img
                                src="/pulse-check-instruction.png"
                                alt="Pulse Check Method"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 border-t pt-2">
                        <strong>Principle:</strong> The system calculates your heart rate (BPM) by measuring the time intervals between your manual taps.
                    </div>
                </div>
            )}

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
