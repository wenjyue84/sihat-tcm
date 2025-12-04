'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CameraCapture } from './CameraCapture'
import { AudioRecorder } from './AudioRecorder'
import { AdaptiveChat } from './AdaptiveChat'
import { BasicInfoForm } from './BasicInfoForm'
import { PulseCheck } from './PulseCheck'
import { Card } from '@/components/ui/card'
import { useCompletion } from '@ai-sdk/react'

export type DiagnosisStep = 'basic_info' | 'wang' | 'wen_audio' | 'wen_chat' | 'qie' | 'processing' | 'report'

export default function DiagnosisWizard() {
    const [step, setStep] = useState<DiagnosisStep>('basic_info')
    const [data, setData] = useState<any>({
        basic_info: null,
        wang: null,
        wen_audio: null,
        wen_chat: [],
        qie: null
    })

    const { complete, completion, isLoading } = useCompletion({
        api: '/api/consult',
    })

    const nextStep = (current: DiagnosisStep) => {
        switch (current) {
            case 'basic_info': setStep('wang'); break;
            case 'wang': setStep('wen_audio'); break;
            case 'wen_audio': setStep('wen_chat'); break;
            case 'wen_chat': setStep('qie'); break;
            case 'qie':
                setStep('processing');
                // Use useEffect or ensure state is updated before calling submit
                // For now, we rely on the fact that qie data is set before this call in the component
                submitConsultation();
                break;
            default: break;
        }
    }

    const submitConsultation = () => {
        complete('', {
            body: {
                data: data
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <AnimatePresence mode="wait">
                {step === 'basic_info' && (
                    <motion.div key="basic_info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <BasicInfoForm onComplete={(result) => {
                            setData((prev: any) => ({ ...prev, basic_info: result }));
                            setTimeout(() => nextStep('basic_info'), 0)
                        }} />
                    </motion.div>
                )}
                {step === 'wang' && (
                    <motion.div key="wang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <CameraCapture onComplete={(result) => {
                            setData((prev: any) => ({ ...prev, wang: result }));
                            setTimeout(() => nextStep('wang'), 0)
                        }} />
                    </motion.div>
                )}
                {step === 'wen_audio' && (
                    <motion.div key="wen_audio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <AudioRecorder onComplete={(result) => {
                            setData((prev: any) => ({ ...prev, wen_audio: result }));
                            setTimeout(() => nextStep('wen_audio'), 0)
                        }} />
                    </motion.div>
                )}
                {step === 'wen_chat' && (
                    <motion.div key="wen_chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <AdaptiveChat onComplete={(result) => {
                            setData((prev: any) => ({ ...prev, wen_chat: result }));
                            setTimeout(() => nextStep('wen_chat'), 0)
                        }} />
                    </motion.div>
                )}
                {step === 'qie' && (
                    <motion.div key="qie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <PulseCheck onComplete={(result) => {
                            setData((prev: any) => {
                                const newData = { ...prev, qie: result };
                                // Trigger submission with the new data
                                complete('', { body: { data: newData } });
                                return newData;
                            });
                            setStep('processing');
                        }} />
                    </motion.div>
                )}
                {step === 'processing' && (
                    <Card className="p-6 text-center space-y-4">
                        <h2 className="text-2xl font-bold text-emerald-800">Analyzing your Qi...</h2>
                        {isLoading ? (
                            <div className="animate-pulse text-stone-500">Consulting the AI Practitioner...</div>
                        ) : (
                            <div className="text-left prose prose-stone max-w-none">
                                <pre className="whitespace-pre-wrap bg-stone-100 p-4 rounded-lg text-sm overflow-auto max-h-[500px]">
                                    {completion}
                                </pre>
                            </div>
                        )}
                    </Card>
                )}
            </AnimatePresence>
        </div>
    )
}
