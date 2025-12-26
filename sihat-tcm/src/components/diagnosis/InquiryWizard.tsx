'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadReportsStep, FileData } from './UploadReportsStep'
import { UploadMedicineStep } from './UploadMedicineStep'
import { InquiryChatStep } from './InquiryChatStep'
import { InquirySummaryStep } from './InquirySummaryStep'
import { BasicInfoData } from './BasicInfoForm'

import { useAuth } from '@/stores/useAppStore'

// Doctor selection is now done in BasicInfoForm step 5/5, so removed from here
type InquiryStepType = 'upload_reports' | 'upload_medicine' | 'chat' | 'summary'

interface InquiryWizardProps {
    basicInfo?: BasicInfoData
    initialData?: {
        reportFiles?: FileData[]
        medicineFiles?: FileData[]
        chatHistory?: any[]
        summary?: string
    }
    onComplete: (result: { inquiryText: string, chatHistory: any[], files: FileData[], reportFiles?: FileData[], medicineFiles?: FileData[] }) => void
    onBack?: () => void
}

export function InquiryWizard({ basicInfo, initialData, onComplete, onBack }: InquiryWizardProps) {
    const { profile } = useAuth()
    const diagnosisMode = profile?.preferences?.diagnosisMode || 'simple'

    // Start directly with upload_reports since doctor is already selected in BasicInfoForm step 5/5
    const [step, setStep] = useState<InquiryStepType>('upload_reports')
    const [data, setData] = useState<{
        reportFiles: FileData[]
        medicineFiles: FileData[]
        chatHistory: any[]
        summary: string
    }>({
        reportFiles: initialData?.reportFiles || [],
        medicineFiles: initialData?.medicineFiles || [],
        chatHistory: initialData?.chatHistory || [],
        summary: initialData?.summary || ''
    })

    // Update state if initialData changes (e.g. when loading a test profile)
    useEffect(() => {
        if (initialData) {
            setData({
                reportFiles: initialData.reportFiles || [],
                medicineFiles: initialData.medicineFiles || [],
                chatHistory: initialData.chatHistory || [],
                summary: initialData.summary || ''
            })
        }
    }, [initialData])

    const nextStep = (next: InquiryStepType) => {
        setStep(next)
    }

    const prevStep = (prev: InquiryStepType) => {
        setStep(prev)
    }

    const handleReportsComplete = (files: FileData[]) => {
        setData(prev => ({ ...prev, reportFiles: files }))
        nextStep('upload_medicine')
    }

    const handleMedicineComplete = (files: FileData[]) => {
        setData(prev => ({ ...prev, medicineFiles: files }))
        nextStep('chat')
    }

    const handleChatComplete = (history: any[]) => {
        setData(prev => ({ ...prev, chatHistory: history }))

        if (diagnosisMode === 'simple') {
            // In Simple Mode, skip the summary review step
            onComplete({
                inquiryText: "Chat consultation completed (Analysis pending)",
                chatHistory: history,
                reportFiles: data.reportFiles,
                medicineFiles: data.medicineFiles,
                files: [...data.reportFiles, ...data.medicineFiles]
            })
        } else {
            nextStep('summary')
        }
    }

    const handleSummaryComplete = (summary: string) => {
        setData(prev => ({ ...prev, summary }))

        // Combine all data for the final result
        // We pass the summary as the "inquiryText" because that's what the main diagnosis engine expects for the "wen_inquiry" block usually
        // But we also pass the raw chat history if needed.
        // The API route for consult will look at `verified_summaries.wen_inquiry` if we set it in DiagnosisWizard.
        // Here we return the object structure expected by DiagnosisWizard's `wen_inquiry` state.

        onComplete({
            inquiryText: summary, // This will be used as the main text
            chatHistory: data.chatHistory,
            reportFiles: data.reportFiles,
            medicineFiles: data.medicineFiles,
            files: [...data.reportFiles, ...data.medicineFiles] // Keep this for backward compatibility if needed
        })
    }

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {step === 'upload_reports' && (
                    <motion.div key="upload_reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <UploadReportsStep
                            initialFiles={data.reportFiles}
                            onComplete={handleReportsComplete}
                            onSkip={() => nextStep('upload_medicine')}
                            onBack={onBack}
                        />
                    </motion.div>
                )}
                {step === 'upload_medicine' && (
                    <motion.div key="upload_medicine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <UploadMedicineStep
                            initialFiles={data.medicineFiles}
                            onComplete={handleMedicineComplete}
                            onSkip={() => nextStep('chat')}
                            onBack={() => prevStep('upload_reports')}
                        />
                    </motion.div>
                )}
                {step === 'chat' && (
                    <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <InquiryChatStep
                            basicInfo={basicInfo}
                            uploadedFiles={[...data.reportFiles, ...data.medicineFiles]}
                            reportFiles={data.reportFiles}
                            medicineFiles={data.medicineFiles}
                            onComplete={handleChatComplete}
                            onBack={() => prevStep('upload_medicine')}
                            diagnosisMode={diagnosisMode}
                        />
                    </motion.div>
                )}
                {step === 'summary' && (
                    <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <InquirySummaryStep
                            data={{
                                chatHistory: data.chatHistory,
                                reportFiles: data.reportFiles,
                                medicineFiles: data.medicineFiles,
                                basicInfo: basicInfo
                            }}
                            onComplete={handleSummaryComplete}
                            onBack={() => prevStep('chat')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
