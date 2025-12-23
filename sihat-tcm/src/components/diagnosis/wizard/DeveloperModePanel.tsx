'use client'

import { Minus, Maximize2 } from 'lucide-react'
import { useState } from 'react'

interface DeveloperModePanelProps {
    currentStep: string
    steps: Array<{ id: string; label: string }>
    onStepChange: (stepId: string) => void
    onOpenTestProfiles: () => void
    onFillAndViewMockReport: () => void
    onOpenTestRunner: () => void
}

/**
 * Developer Mode Panel - Fixed bottom-right control panel for development/testing
 * 
 * Features:
 * - Jump to any step in wizard
 * - Open test profiles modal
 * - Fill mock data and view report
 * - Open test runner
 * - Minimizable to save screen space
 */
export function DeveloperModePanel({
    currentStep,
    steps,
    onStepChange,
    onOpenTestProfiles,
    onFillAndViewMockReport,
    onOpenTestRunner
}: DeveloperModePanelProps) {
    const [isMinimized, setIsMinimized] = useState(false)

    return (
        <div className={`fixed bottom-4 right-4 z-50 bg-slate-800 text-white rounded-xl shadow-2xl border border-slate-700 transition-all duration-300 ${isMinimized ? 'w-auto p-3' : 'w-full max-w-xs p-4'} opacity-90 hover:opacity-100`}>
            <div className={`flex items-center justify-between ${isMinimized ? 'mb-0' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Developer Mode</h3>
                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Active</span>
                </div>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"
                >
                    {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                </button>
            </div>

            {!isMinimized && (
                <div className="space-y-2">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Jump to Step</label>
                        <select
                            value={currentStep}
                            onChange={(e) => onStepChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            {steps.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            <option value="summary">Summary</option>
                            <option value="processing">Processing</option>
                            <option value="report">Report</option>
                        </select>
                    </div>

                    <button
                        onClick={onOpenTestProfiles}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded transition-colors font-medium"
                    >
                        Test Scenarios (Fill Data)
                    </button>

                    <button
                        onClick={onFillAndViewMockReport}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded transition-colors font-medium mt-2"
                    >
                        Fill & View Mock Report
                    </button>

                    <button
                        onClick={onOpenTestRunner}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 rounded transition-colors font-medium mt-2"
                    >
                        Test modules with program
                    </button>

                    <div className="pt-2 border-t border-slate-700">
                        <p className="text-[10px] text-slate-500">Current Step: {currentStep}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
