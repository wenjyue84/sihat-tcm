
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/stores/useAppStore'
import { useDiagnosisProgress } from '@/stores/useAppStore'
import { BasicInfoData } from '../BasicInfoForm'
import { FileData } from '../UploadReportsStep'

// Hooks
import { useInquiryChat } from './useInquiryChat'
import { useVoiceInput } from './useVoiceInput'

// Components
import { ChatHeader, MasterAnalysisBanner } from './ChatHeader'
import { PatientInfoSummary } from './PatientInfoSummary'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { VoiceDisclaimerModal } from './VoiceDisclaimerModal'

interface InquiryChatStepProps {
    onComplete: (chatHistory: any[]) => void
    basicInfo?: BasicInfoData
    onBack?: () => void
    uploadedFiles?: FileData[]
    reportFiles?: FileData[]
    medicineFiles?: FileData[]
    diagnosisMode?: string
}

export function InquiryChatStep({
    onComplete,
    basicInfo,
    onBack,
    uploadedFiles = [],
    reportFiles = [],
    medicineFiles = [],
    diagnosisMode = 'simple'
}: InquiryChatStepProps) {
    const { t, language } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()

    // State
    const [isMaximized, setIsMaximized] = useState(false)
    const [localInput, setLocalInput] = useState('')

    // Hooks
    const { messages, isLoading, sendMessage, doctorInfo } = useInquiryChat(basicInfo)
    const {
        isRecording,
        handleVoiceToggle,
        showVoiceDisclaimer,
        setShowVoiceDisclaimer,
        acceptDisclaimer
    } = useVoiceInput((text) => setLocalInput(prev => prev ? `${prev} ${text}` : text))

    // Refs for "run once" logic
    const hasRequestedInitialQuestion = useRef(false)
    const hasInformedAboutFiles = useRef(false)

    // Initial Prompts
    const initialPrompts: Record<string, string> = {
        en: `I am ready for the consultation. Please review my information and start.`,
        zh: `我已经准备好进行问诊。请查看我的信息并开始。`,
        ms: `Saya bersedia untuk konsultasi. Sila semak maklumat saya dan mulakan.`,
    }

    // Effect: Initial Question
    useEffect(() => {
        if (!hasRequestedInitialQuestion.current && messages.length === 0) {
            hasRequestedInitialQuestion.current = true

            let prompt = basicInfo && basicInfo.symptoms
                ? initialPrompts[language] || initialPrompts.en
                : (language === 'zh' ? '请开始询问诊断问题。' : language === 'ms' ? 'Sila mulakan soalan diagnosis.' : 'Please start by asking your first diagnostic question.')

            // Inject file info if available
            if (uploadedFiles.length > 0 && !hasInformedAboutFiles.current) {
                hasInformedAboutFiles.current = true
                const fileSummary = uploadedFiles.map(f => `${f.name} (${f.type}): ${f.extractedText ? 'Text extracted' : 'Image only'}`).join(', ');
                const fileContext = language === 'zh'
                    ? `\n\n此外，我还上传了以下文件：${fileSummary}。请在诊断时参考这些信息。`
                    : `\n\nAdditionally, I have uploaded the following files: ${fileSummary}. Please consider this information during diagnosis.`
                prompt += fileContext
            }

            sendMessage(prompt, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, basicInfo, language, uploadedFiles])

    // Effect: Update Navigation State
    const displayMessagesCount = messages.filter(m => m.role !== 'system').length

    // Refs for navigation callbacks to prevent infinite loops
    const onCompleteRef = useRef(onComplete)
    const onBackRef = useRef(onBack)
    const messagesRef = useRef(messages)

    useEffect(() => {
        onCompleteRef.current = onComplete
        onBackRef.current = onBack
        messagesRef.current = messages
    }, [onComplete, onBack, messages])

    useEffect(() => {
        setNavigationState({
            onNext: () => onCompleteRef.current(messagesRef.current),
            onBack: onBack ? () => onBackRef.current?.() : undefined,
            showNext: true,
            canNext: displayMessagesCount >= 2,
            showBack: !!onBack,
            showSkip: false
        })
    }, [displayMessagesCount, setNavigationState, !!onBack])

    // Handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!localInput.trim() || isLoading) return
        const userInput = localInput
        setLocalInput('')
        await sendMessage(userInput)
    }

    const handleOptionSelect = (option: string) => {
        sendMessage(option)
    }

    return (
        <>
            <VoiceDisclaimerModal
                isOpen={showVoiceDisclaimer}
                onAccept={acceptDisclaimer}
                onClose={() => setShowVoiceDisclaimer(false)}
            />

            <Card className={`flex flex-col gap-3 md:gap-4 transition-all duration-300 ${isMaximized
                ? 'fixed inset-0 z-40 bg-white rounded-none p-4 pb-20 md:p-6 md:pb-6'
                : 'p-4 md:p-6 h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] md:mb-0 relative'
                }`}>

                <ChatHeader
                    doctorInfo={doctorInfo}
                    isMaximized={isMaximized}
                    onToggleMaximize={() => setIsMaximized(!isMaximized)}
                />

                <MasterAnalysisBanner doctorInfo={doctorInfo} />

                <PatientInfoSummary
                    basicInfo={basicInfo}
                    medicineFiles={medicineFiles}
                    reportFiles={reportFiles}
                />

                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    isMaximized={isMaximized}
                    basicInfo={basicInfo}
                    initialPrompts={Object.values(initialPrompts)}
                    onOptionSelect={handleOptionSelect}
                />

                <ChatInput
                    value={localInput}
                    onChange={setLocalInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    onVoiceToggle={handleVoiceToggle}
                    isMaximized={isMaximized}
                />

                {/* Desktop Navigation Buttons */}
                <div className="hidden md:flex gap-3 pt-4 border-t border-stone-100">
                    {onBack && (
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="flex-1 md:flex-none md:w-auto border-stone-300 text-stone-600 hover:bg-stone-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.common.back}
                        </Button>
                    )}
                    <Button
                        onClick={() => onComplete(messages)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={displayMessagesCount < 2}
                    >
                        {t.common.next}
                    </Button>
                </div>
            </Card>
        </>
    )
}
