'use client'

import { useState, useRef, useEffect } from 'react'
import { FlaskConical, Check, Eraser, RotateCcw } from 'lucide-react'

/**
 * TEST PAGE: Test/Clear Button Toggle
 * 
 * This page allows testing the Test/Clear toggle button in isolation.
 * Access at: http://localhost:3000/test-button-toggle
 * 
 * VERIFICATION CHECKLIST:
 * ✅ Initial state shows "Test" button (amber color, Flask icon)
 * ✅ Clicking "Test" shows "Filled!" feedback (emerald, Check icon, bounce)
 * ✅ After 1.5s, button changes to "Clear" (rose color, Eraser icon)
 * ✅ Clicking "Clear" shows "Cleared!" feedback (emerald, Check icon, bounce)
 * ✅ After 1.5s, button returns to "Test" state
 * ✅ Button is disabled during transition states (no rapid clicking)
 * ✅ Responsive: Icon-only on mobile, icon+text on desktop
 */

export default function TestButtonTogglePage() {
    type ButtonState = 'test' | 'filling' | 'clear' | 'clearing'
    const [buttonState, setButtonState] = useState<ButtonState>('test')
    const [eventLog, setEventLog] = useState<string[]>([])
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Listen for the custom events
    useEffect(() => {
        const handleFill = () => {
            setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📥 fill-test-data event received`])
        }
        const handleClear = () => {
            setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🗑️ clear-test-data event received`])
        }
        window.addEventListener('fill-test-data', handleFill)
        window.addEventListener('clear-test-data', handleClear)
        return () => {
            window.removeEventListener('fill-test-data', handleFill)
            window.removeEventListener('clear-test-data', handleClear)
        }
    }, [])

    const handleButtonClick = () => {
        if (buttonState === 'filling' || buttonState === 'clearing') return

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        if (buttonState === 'test') {
            setButtonState('filling')
            setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 State: test → filling`])
            window.dispatchEvent(new CustomEvent('fill-test-data'))
            timeoutRef.current = setTimeout(() => {
                setButtonState('clear')
                setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 State: filling → clear`])
            }, 1500)
        } else if (buttonState === 'clear') {
            setButtonState('clearing')
            setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 State: clear → clearing`])
            window.dispatchEvent(new CustomEvent('clear-test-data'))
            timeoutRef.current = setTimeout(() => {
                setButtonState('test')
                setEventLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 State: clearing → test`])
            }, 1500)
        }
    }

    const resetState = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setButtonState('test')
        setEventLog([`[${new Date().toLocaleTimeString()}] ♻️ State reset to 'test'`])
    }

    // State info for display
    const stateInfo = {
        test: { label: 'Test', color: 'bg-amber-500', icon: '🧪' },
        filling: { label: 'Filling (transition)', color: 'bg-emerald-500', icon: '✓' },
        clear: { label: 'Clear', color: 'bg-rose-500', icon: '🧹' },
        clearing: { label: 'Clearing (transition)', color: 'bg-emerald-500', icon: '✓' }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-emerald-400">🧪 Test: Button Toggle State Machine</h1>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h2 className="font-semibold text-lg mb-2">📝 Instructions</h2>
                    <ul className="text-slate-300 text-sm space-y-2">
                        <li>1. Click the button below to cycle through states</li>
                        <li>2. Watch the state indicator and event log</li>
                        <li>3. Try rapid clicking during transitions (should be blocked)</li>
                        <li>4. On mobile: resize browser to see icon-only mode</li>
                    </ul>
                </div>

                {/* Current State Display */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h2 className="font-semibold text-lg mb-3 text-emerald-400">Current State</h2>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg ${stateInfo[buttonState].color} text-white font-medium`}>
                            {stateInfo[buttonState].icon} {stateInfo[buttonState].label}
                        </div>
                        {(buttonState === 'filling' || buttonState === 'clearing') && (
                            <span className="text-amber-400 animate-pulse">⏳ Transitioning...</span>
                        )}
                    </div>
                </div>

                {/* The Actual Button */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h2 className="font-semibold text-lg mb-4 text-emerald-400">Test Button (Same as Header)</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleButtonClick}
                            disabled={buttonState === 'filling' || buttonState === 'clearing'}
                            className={`flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl
                                ${buttonState === 'test'
                                    ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 hover:scale-105'
                                    : buttonState === 'filling' || buttonState === 'clearing'
                                        ? 'bg-emerald-500 text-white scale-95 ring-4 ring-emerald-300/50'
                                        : 'bg-rose-500 hover:bg-rose-400 text-white hover:scale-105'
                                }
                                ${(buttonState === 'filling' || buttonState === 'clearing') ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {buttonState === 'test' ? (
                                <FlaskConical className="w-4 h-4" />
                            ) : buttonState === 'filling' || buttonState === 'clearing' ? (
                                <Check className="w-4 h-4 animate-bounce" />
                            ) : (
                                <Eraser className="w-4 h-4" />
                            )}
                            <span className={`${buttonState === 'filling' || buttonState === 'clearing' ? 'inline' : 'hidden lg:inline'}`}>
                                {buttonState === 'test'
                                    ? 'Test'
                                    : buttonState === 'filling'
                                        ? 'Filled!'
                                        : buttonState === 'clearing'
                                            ? 'Cleared!'
                                            : 'Clear'
                                }
                            </span>
                        </button>

                        <button
                            onClick={resetState}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Event Log */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-lg text-emerald-400">📋 Event Log</h2>
                        <button
                            onClick={() => setEventLog([])}
                            className="text-xs text-slate-500 hover:text-slate-300"
                        >
                            Clear Log
                        </button>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs">
                        {eventLog.length === 0 ? (
                            <span className="text-slate-500">No events yet. Click the button to start...</span>
                        ) : (
                            eventLog.map((log, i) => (
                                <div key={i} className="text-slate-300">{log}</div>
                            ))
                        )}
                    </div>
                </div>

                {/* Verification Checklist */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h2 className="font-semibold text-lg mb-3 text-emerald-400">✅ Verification Checklist</h2>
                    <div className="grid gap-2 text-sm">
                        {[
                            'Initial state: Amber button with Flask icon',
                            'Click Test → Shows "Filled!" with Check icon (bouncing)',
                            'After 1.5s → Changes to Rose button with Eraser icon',
                            'Click Clear → Shows "Cleared!" with Check icon (bouncing)',
                            'After 1.5s → Returns to Amber "Test" button',
                            'Rapid clicking during transitions is blocked',
                            'Mobile: Icon-only, Desktop: Icon + Text',
                        ].map((item, i) => (
                            <label key={i} className="flex items-center gap-2 text-slate-300">
                                <input type="checkbox" className="w-4 h-4 rounded accent-emerald-500" />
                                {item}
                            </label>
                        ))}
                    </div>
                </div>

                {/* State Machine Diagram */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h2 className="font-semibold text-lg mb-3 text-emerald-400">🔄 State Machine Flow</h2>
                    <div className="text-center font-mono text-sm text-slate-300">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">test</span>
                            <span>→</span>
                            <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">filling</span>
                            <span>→</span>
                            <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/50">clear</span>
                            <span>→</span>
                            <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">clearing</span>
                            <span>→</span>
                            <span className="text-slate-500">(back to test)</span>
                        </div>
                    </div>
                </div>

                <div className="text-center text-slate-500 text-sm pb-4">
                    Test page for verifying Test/Clear button toggle functionality
                </div>
            </div>
        </div>
    )
}
