'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { EcgAnimation } from '@/components/ui/EcgAnimation'

interface BpmInputProps {
    inputMode: 'tap' | 'manual';
    setInputMode: (mode: 'tap' | 'manual') => void;
    // Manual mode
    manualBpm: string;
    handleManualInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    bpmInputRef: React.RefObject<HTMLInputElement | null>;
    // Tap mode
    taps: number[];
    bpm: number | null;
    handleTap: () => void;
    resetTaps: () => void;
    // Translations
    t: any;
}

export function BpmInput({
    inputMode,
    setInputMode,
    manualBpm,
    handleManualInput,
    bpmInputRef,
    taps,
    bpm,
    handleTap,
    resetTaps,
    t
}: BpmInputProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Input Mode Selection */}
            <div className="flex gap-3">
                <Button
                    variant={inputMode === 'manual' ? 'default' : 'outline'}
                    className={`flex-1 ${inputMode === 'manual' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setInputMode('manual')}
                >
                    {t.pulse.enterBpmManually}
                </Button>
                <Button
                    variant={inputMode === 'tap' ? 'default' : 'outline'}
                    className={`flex-1 ${inputMode === 'tap' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => { setInputMode('tap'); resetTaps(); }}
                >
                    {t.pulse.tapToMeasure}
                </Button>
            </div>

            {/* Input Area */}
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl p-6">
                {inputMode === 'manual' ? (
                    <ManualBpmInput
                        manualBpm={manualBpm}
                        handleManualInput={handleManualInput}
                        bpmInputRef={bpmInputRef}
                        t={t}
                    />
                ) : (
                    <TapBpmInput
                        taps={taps}
                        bpm={bpm}
                        handleTap={handleTap}
                        resetTaps={resetTaps}
                        t={t}
                    />
                )}
            </div>
        </div>
    )
}

// Manual BPM Input Sub-component
function ManualBpmInput({
    manualBpm,
    handleManualInput,
    bpmInputRef,
    t
}: {
    manualBpm: string;
    handleManualInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    bpmInputRef: React.RefObject<HTMLInputElement | null>;
    t: any;
}) {
    const bpmValue = parseInt(manualBpm)
    const isAbnormal = manualBpm && (bpmValue < 60 || bpmValue > 100)

    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-slate-600 mb-4">
                    {t.pulse.afterCounting}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Input
                        ref={bpmInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={t.pulse.enterBpm}
                        value={manualBpm}
                        onChange={handleManualInput}
                        className="w-32 text-center text-2xl font-bold h-16 border-2 border-emerald-200 focus:border-emerald-500"
                    />
                    <span className="text-xl font-semibold text-slate-500">{t.pulse.bpm}</span>
                </div>

                {/* ECG Animation */}
                {manualBpm && bpmValue > 0 && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-gradient-to-r from-slate-900/5 via-slate-900/10 to-slate-900/5 border border-slate-200/50">
                        <EcgAnimation
                            bpm={bpmValue}
                            isActive={true}
                            height={80}
                            className="w-full"
                        />
                    </div>
                )}

                {manualBpm && (
                    <>
                        <div className={`mt-3 flex items-center justify-center gap-2 ${isAbnormal ? 'text-amber-600' : 'text-emerald-600'}`}>
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">
                                {bpmValue < 60 ? t.pulse.lowBpm :
                                    bpmValue > 100 ? t.pulse.highBpm :
                                        t.pulse.normalBpm}
                            </span>
                        </div>

                        {/* Abnormal BPM Tips Panel */}
                        {isAbnormal && (
                            <AbnormalBpmTips
                                bpmValue={bpmValue}
                                onRemeasure={() => handleManualInput({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                t={t}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// Tap BPM Input Sub-component
function TapBpmInput({
    taps,
    bpm,
    handleTap,
    resetTaps,
    t
}: {
    taps: number[];
    bpm: number | null;
    handleTap: () => void;
    resetTaps: () => void;
    t: any;
}) {
    return (
        <div className="text-center space-y-4">
            <p className="text-slate-600">
                {t.pulse.tapInRhythm}
            </p>
            <div className="flex flex-col items-center gap-4">
                {/* Large Tap Button - min 44px touch target for mobile */}
                <Button
                    variant="outline"
                    className={`rounded-full w-28 h-28 active:scale-90 transition-all duration-150 border-2 ${taps.length > 0
                        ? 'border-rose-400 bg-rose-50 hover:bg-rose-100'
                        : 'border-emerald-400 hover:bg-emerald-50'
                        }`}
                    onClick={handleTap}
                >
                    <Heart className={`w-10 h-10 ${taps.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                </Button>
                <div className="text-sm text-slate-500">
                    {t.pulse.taps}: {taps.length}
                </div>
                {bpm && (
                    <>
                        <div className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                            <Activity className="w-8 h-8" />
                            {bpm} BPM
                        </div>
                        {/* ECG Animation */}
                        <div className="w-full mt-2 rounded-xl overflow-hidden bg-gradient-to-r from-slate-900/5 via-slate-900/10 to-slate-900/5 border border-slate-200/50">
                            <EcgAnimation
                                bpm={bpm}
                                isActive={true}
                                height={80}
                                className="w-full"
                            />
                        </div>
                    </>
                )}
                {taps.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={resetTaps}>
                        {t.pulse.reset}
                    </Button>
                )}
            </div>
        </div>
    )
}

// Abnormal BPM Tips Panel
function AbnormalBpmTips({
    bpmValue,
    onRemeasure,
    t
}: {
    bpmValue: number;
    onRemeasure: () => void;
    t: any;
}) {
    const defaultTips = [
        { icon: '🏃', title: 'Avoid post-exercise', description: 'Rest 5-10 minutes after exercise' },
        { icon: '😌', title: 'Stay relaxed', description: 'Take deep breaths to calm down' },
        { icon: '🪑', title: 'Comfortable position', description: 'Sit comfortably' },
        { icon: '☕', title: 'Avoid stimulants', description: 'Coffee or tea affects heart rate' },
    ]
    const tips = t.pulse?.abnormalBpmTips?.tips || defaultTips

    return (
        <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-800">
                    {bpmValue > 100
                        ? (t.pulse?.abnormalBpmTips?.highBpmTitle || 'Your heart rate is high')
                        : (t.pulse?.abnormalBpmTips?.lowBpmTitle || 'Your heart rate is low')}
                </h4>
            </div>
            <p className="text-sm text-amber-700 mb-3">
                {t.pulse?.abnormalBpmTips?.subtitle || 'To ensure accurate measurement, please confirm the following:'}
            </p>
            {/* Responsive Grid: 1 col mobile, 2 col desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tips.map((tip: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-white/70 rounded-lg border border-amber-100">
                        <span className="text-xl flex-shrink-0">{tip.icon}</span>
                        <div>
                            <p className="text-xs font-medium text-amber-800">{tip.title}</p>
                            <p className="text-xs text-amber-600">{tip.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-3 text-xs text-amber-600 italic">
                {t.pulse?.abnormalBpmTips?.confirmMessage || 'If you have ruled out the above factors, you may continue.'}
            </p>
            <div className="mt-3 flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRemeasure}
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                    {t.pulse?.abnormalBpmTips?.remeasure || 'Remeasure'}
                </Button>
            </div>
        </div>
    )
}
