'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CameraCapture } from './CameraCapture'
import { AudioRecorder } from './AudioRecorder'
import { AdaptiveChat } from './AdaptiveChat'
import { BasicInfoForm } from './BasicInfoForm'
import { PulseCheck } from './PulseCheck'
import { InquiryStep, InquiryData } from './InquiryStep'
import { Card } from '@/components/ui/card'
import { useCompletion } from '@ai-sdk/react'
import { DiagnosisReport } from './DiagnosisReport'

export type DiagnosisStep = 'basic_info' | 'wen_inquiry' | 'wang_tongue' | 'wang_face' | 'wang_part' | 'wen_audio' | 'wen_chat' | 'qie' | 'processing' | 'report'

export default function DiagnosisWizard() {
    const [step, setStep] = useState<DiagnosisStep>('basic_info')
    const [data, setData] = useState<any>({
        basic_info: null,
        wen_inquiry: null,
        wang_tongue: null,
        wang_face: null,
        wang_part: null,
        wen_audio: null,
        wen_chat: [],
        qie: null
    })

    const { complete, completion, isLoading } = useCompletion({
        api: '/api/consult',
    })

    const nextStep = (current: DiagnosisStep) => {
        switch (current) {
            case 'basic_info': setStep('wen_inquiry'); break;
            case 'wen_inquiry': setStep('wang_tongue'); break;
            case 'wang_tongue': setStep('wang_face'); break;
            case 'wang_face': setStep('wang_part'); break;
            case 'wang_part': setStep('wen_audio'); break;
            case 'wen_audio': setStep('wen_chat'); break;
            case 'wen_chat': setStep('qie'); break;
            case 'qie':
                setStep('processing');
                submitConsultation();
                break;
            default: break;
        }
    }

    const prevStep = (current: DiagnosisStep) => {
        switch (current) {
            case 'wen_inquiry': setStep('basic_info'); break;
            case 'wang_tongue': setStep('wen_inquiry'); break;
            case 'wang_face': setStep('wang_tongue'); break;
            case 'wang_part': setStep('wang_face'); break;
            case 'wen_audio': setStep('wang_part'); break;
            case 'wen_chat': setStep('wen_audio'); break;
            case 'qie': setStep('wen_chat'); break;
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
            {step !== 'basic_info' && step !== 'processing' && step !== 'report' && (
                <button
                    onClick={() => prevStep(step)}
                    className="mb-4 px-3 py-1 text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Back
                </button>
            )}
            <AnimatePresence mode="wait">
                {step === 'basic_info' && (
                    <motion.div key="basic_info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <BasicInfoForm
                            initialData={data.basic_info}
                            onComplete={(result) => {
                                setData((prev: any) => ({ ...prev, basic_info: result }));
                                setTimeout(() => nextStep('basic_info'), 0)
                            }} />
                    </motion.div>
                )}
                {step === 'wen_inquiry' && (
                    <motion.div key="wen_inquiry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <InquiryStep
                            initialData={data.wen_inquiry}
                            onComplete={(result) => {
                                setData((prev: any) => ({ ...prev, wen_inquiry: result }));
                                setTimeout(() => nextStep('wen_inquiry'), 0)
                                setData((prev: any) => ({ ...prev, wen_audio: result }));
                                setTimeout(() => nextStep('wen_audio'), 0)
                            }} />
                    </motion.div>
                )}
                {step === 'wen_chat' && (
                    <motion.div key="wen_chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <AdaptiveChat
                            basicInfo={data.basic_info}
                            initialMessages={data.wen_chat}
                            onComplete={(result) => {
                                setData((prev: any) => ({ ...prev, wen_chat: result.chat }));
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
                    <Card className="p-6 text-center space-y-4 border-none shadow-none bg-transparent">
                        {isLoading ? (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-emerald-800 animate-pulse">Analyzing your Qi...</h2>
                                <div className="h-2 bg-emerald-100 rounded-full max-w-md mx-auto overflow-hidden">
                                    <div className="h-full bg-emerald-500 animate-progress origin-left" style={{ width: '100%' }} />
                                </div>
                                <p className="text-stone-500">Consulting the AI Practitioner...</p>
                            </div>
                        ) : (
                            <div className="text-left w-full">
                                {(() => {
                                    try {
                                        // Attempt to parse the completion as JSON
                                        // Handle potential markdown code blocks
                                        const cleanJson = completion
                                            .replace(/```json\n?|\n?```/g, '')
                                            .trim();

                                        if (!cleanJson) return null;

                                        const resultData = JSON.parse(cleanJson);

                                        // Dynamically import or render the report component
                                        // We'll use the imported component
                                        return (
                                            <DiagnosisReport
                                                data={resultData}
                                                onRestart={() => {
                                                    setData({
                                                        basic_info: null,
                                                        wen_inquiry: null,
                                                        wang_tongue: null,
                                                        wang_face: null,
                                                        wang_part: null,
                                                        wen_audio: null,
                                                        wen_chat: [],
                                                        qie: null
                                                    });
                                                    setStep('basic_info');
                                                }}
                                            />
                                        );
                                    } catch (e) {
                                        console.error("Failed to parse diagnosis result:", e);
                                        return (
                                            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
                                                <h3 className="font-bold mb-2">Analysis Error</h3>
                                                <p>We encountered an issue processing your diagnosis. Please try again.</p>
                                                <pre className="mt-4 text-xs overflow-auto max-h-40 bg-white p-2 rounded border border-red-100">
                                                    {completion}
                                                </pre>
                                                <button
                                                    onClick={() => setStep('basic_info')}
                                                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
                                                >
                                                    Restart Diagnosis
                                                </button>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        )}
                    </Card>
                )}
            </AnimatePresence>
        </div>
    )
}
