'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BasicInfoData } from './BasicInfoForm'
import { Loader2, Send, ArrowLeft, Pill, FileText, ChevronDown, ChevronUp, Maximize2, Minimize2, Mic, MicOff, AlertTriangle } from 'lucide-react'
import { useDoctorLevel } from '@/contexts/DoctorContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'

import { INTERACTIVE_CHAT_PROMPT } from '@/lib/systemPrompts'
import { ThinkingAnimation } from './ThinkingAnimation'
import { FileData } from './UploadReportsStep'

// Type declaration for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
}

// Helper to extract options from message content
const extractOptions = (content: string) => {
    // Regex to match <OPTIONS>...</OPTIONS> content using [\s\S] for cross-version compatibility
    const match = content.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/)
    if (match) {
        const optionsStr = match[1]
        const cleanContent = content.replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/, '').trim()
        const options = optionsStr.split(',').map(o => o.trim()).filter(o => o)
        return { cleanContent: cleanContent, options }
    }
    return { cleanContent: content, options: [] as string[] }
}

export function InquiryChatStep({
    onComplete,
    basicInfo,
    onBack,
    uploadedFiles = [],
    reportFiles = [],
    medicineFiles = []
}: {
    onComplete: (chatHistory: any[]) => void,
    basicInfo?: BasicInfoData,
    onBack?: () => void,
    uploadedFiles?: FileData[],
    reportFiles?: FileData[],
    medicineFiles?: FileData[]
}) {
    const { getDoctorInfo } = useDoctorLevel()
    const { t, language } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()
    const doctorInfo = getDoctorInfo()
    const [messages, setMessages] = useState<Message[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [showVoiceDisclaimer, setShowVoiceDisclaimer] = useState(false)
    const hasRequestedInitialQuestion = useRef(false)
    const hasInformedAboutFiles = useRef(false)
    const hasSeenVoiceDisclaimer = useRef(false)
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Check if Web Speech API is supported (defer to useEffect to avoid hydration mismatch)
    const [isSpeechSupported, setIsSpeechSupported] = useState(false)

    useEffect(() => {
        setIsSpeechSupported(
            typeof window !== 'undefined' &&
            ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
        )
    }, [])

    // Initial prompts in different languages
    const initialPrompts: Record<string, string> = {
        en: `I am ready for the consultation. Please review my information and start.`,
        zh: `我已经准备好进行问诊。请查看我的信息并开始。`,
        ms: `Saya bersedia untuk konsultasi. Sila semak maklumat saya dan mulakan.`,
    }

    // Construct the initial system message based on basic info
    const systemMessage = basicInfo
        ? `${INTERACTIVE_CHAT_PROMPT}

=== PATIENT DATA ===
Name: ${basicInfo.name}
Age: ${basicInfo.age}
Gender: ${basicInfo.gender}
Weight: ${basicInfo.weight} kg
Height: ${basicInfo.height} cm
Chief Complaint: "${basicInfo.symptoms}"
Duration: ${basicInfo.symptomDuration}
`
        : INTERACTIVE_CHAT_PROMPT

    // Send message to API with manual streaming
    const sendMessage = useCallback(async (userMessage: string, isInitialPrompt = false, isSystemInjection = false) => {
        setIsLoading(true)

        // Add user message to state (unless it's a hidden system injection)
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage
        }

        if (!isSystemInjection) {
            setMessages(prev => [...prev, userMsg])
        }

        // Prepare messages for API
        // If it's system injection, we send it as user role but don't show it in UI
        // or we can append it to the history for the API context
        const currentMessages = isInitialPrompt
            ? [{ role: 'system', content: systemMessage }, userMsg]
            : [...messages, userMsg]

        // If this is a system injection (like file info), we append it to the last message or as a new context
        // For simplicity, we treat it as a user message for the API but filter it out in UI if needed, 
        // but here we want the AI to respond to it if it's the initial prompt.
        // If it's just context injection (files), we might want to just add it to history without triggering a visible response?
        // Actually, for files, we want the AI to acknowledge them.

        try {
            console.log('[InquiryChatStep] Sending message to /api/chat with language:', language)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
                    basicInfo,
                    model: doctorInfo.model,
                    language: language // Pass the selected language
                })
            })

            if (!response.ok) {
                // Try to parse error response for specific error codes
                try {
                    const errorData = await response.json()
                    console.error('[InquiryChatStep] API Error:', errorData)
                    throw new Error(JSON.stringify(errorData))
                } catch {
                    throw new Error(`API error: ${response.status}`)
                }
            }

            // Read streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            // Create placeholder for assistant message
            const assistantMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

            if (reader) {
                console.log('[InquiryChatStep] Starting to read stream...')
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        console.log('[InquiryChatStep] Stream complete!')
                        break
                    }
                    const chunk = decoder.decode(value, { stream: true })
                    fullText += chunk

                    // Update assistant message in real-time
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId ? { ...m, content: fullText } : m
                    ))
                }
            }

            console.log('[InquiryChatStep] Final response length:', fullText.length)
        } catch (err: any) {
            console.error('[InquiryChatStep] Error:', err)

            // Try to parse structured error
            let errorMessage = ''
            try {
                const errorData = JSON.parse(err.message)
                if (errorData.code === 'API_KEY_LEAKED') {
                    errorMessage = language === 'zh'
                        ? '⚠️ API密钥已泄露！请到Google AI Studio生成新密钥并更新.env.local文件。'
                        : language === 'ms'
                            ? '⚠️ Kunci API telah bocor! Sila jana kunci baharu dari Google AI Studio dan kemas kini fail .env.local.'
                            : '⚠️ API key has been flagged as leaked! Please generate a new key from Google AI Studio and update your .env.local file.'
                } else if (errorData.code === 'API_KEY_INVALID') {
                    errorMessage = language === 'zh'
                        ? '⚠️ API密钥无效。请检查.env.local文件中的GOOGLE_GENERATIVE_AI_API_KEY设置。'
                        : language === 'ms'
                            ? '⚠️ Kunci API tidak sah. Sila semak tetapan GOOGLE_GENERATIVE_AI_API_KEY dalam fail .env.local.'
                            : '⚠️ Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env.local file.'
                } else if (errorData.code === 'API_QUOTA_EXCEEDED') {
                    errorMessage = language === 'zh'
                        ? '⚠️ API配额已用完。请稍等片刻或检查Google AI Studio的账单设置。'
                        : language === 'ms'
                            ? '⚠️ Kuota API telah melebihi. Sila tunggu sebentar atau semak bil Google AI Studio anda.'
                            : '⚠️ API quota exceeded. Please wait a moment or check your Google AI Studio billing.'
                } else {
                    errorMessage = errorData.error || (language === 'zh' ? '抱歉，发生了错误。请重试。' : language === 'ms' ? 'Maaf, terdapat ralat. Sila cuba lagi.' : 'Sorry, I encountered an error. Please try again.')
                }
            } catch {
                // Fallback to generic error message
                const errorMessages: Record<string, string> = {
                    en: 'Sorry, I encountered an error. Please try again.',
                    zh: '抱歉，发生了错误。请重试。',
                    ms: 'Maaf, terdapat ralat. Sila cuba lagi.',
                }
                errorMessage = errorMessages[language] || errorMessages.en
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage
            }])
        } finally {
            setIsLoading(false)
        }
    }, [messages, systemMessage, basicInfo, doctorInfo.model, language])

    // Trigger the first question from AI doctor when component mounts
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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages, isMaximized]) // Also scroll when maximizing

    // Keep focus on input field
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isLoading, messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!localInput.trim() || isLoading) return
        const userInput = localInput
        setLocalInput('')
        await sendMessage(userInput)
        inputRef.current?.focus()
    }

    // Voice recognition functions
    const startVoiceRecognition = useCallback(() => {
        if (!isSpeechSupported) {
            alert(language === 'zh'
                ? '您的浏览器不支持语音识别。请使用Chrome或Edge浏览器。'
                : language === 'ms'
                    ? 'Pelayar anda tidak menyokong pengecaman suara. Sila gunakan Chrome atau Edge.'
                    : 'Your browser does not support voice recognition. Please use Chrome or Edge.')
            return
        }

        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognitionClass()

        // Set language based on app language
        recognition.lang = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US'
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => {
            setIsRecording(true)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interimTranscript += transcript
                }
            }

            // Append to existing input (allows multiple recordings)
            if (finalTranscript) {
                setLocalInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error)
            setIsRecording(false)

            if (event.error === 'no-speech') {
                // Silent fail for no speech detected
                return
            }

            const errorMessages: Record<string, Record<string, string>> = {
                'not-allowed': {
                    en: 'Microphone access denied. Please allow microphone access in your browser settings.',
                    zh: '麦克风访问被拒绝。请在浏览器设置中允许麦克风访问。',
                    ms: 'Akses mikrofon ditolak. Sila benarkan akses mikrofon dalam tetapan pelayar anda.'
                },
                'audio-capture': {
                    en: 'No microphone found. Please connect a microphone.',
                    zh: '未找到麦克风。请连接麦克风。',
                    ms: 'Tiada mikrofon dijumpai. Sila sambungkan mikrofon.'
                },
                'network': {
                    en: 'Network error. Please check your internet connection.',
                    zh: '网络错误。请检查您的网络连接。',
                    ms: 'Ralat rangkaian. Sila semak sambungan internet anda.'
                }
            }

            const errorKey = event.error as string
            const msg = errorMessages[errorKey]?.[language] || errorMessages[errorKey]?.en ||
                (language === 'zh' ? '语音识别错误，请重试' : language === 'ms' ? 'Ralat pengecaman suara, sila cuba lagi' : 'Voice recognition error, please try again')
            alert(msg)
        }

        recognition.onend = () => {
            setIsRecording(false)
            recognitionRef.current = null
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [isSpeechSupported, language])

    const stopVoiceRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsRecording(false)
        }
    }, [])

    const handleVoiceInput = () => {
        if (isRecording) {
            stopVoiceRecognition()
            return
        }

        // Show disclaimer on first use
        if (!hasSeenVoiceDisclaimer.current) {
            setShowVoiceDisclaimer(true)
            return
        }

        startVoiceRecognition()
    }

    const handleDisclaimerAccept = () => {
        hasSeenVoiceDisclaimer.current = true
        setShowVoiceDisclaimer(false)
        startVoiceRecognition()
    }

    const handleDisclaimerClose = () => {
        setShowVoiceDisclaimer(false)
    }

    const calculateBMI = (weight: number, height: number) => {
        const heightInMeters = height / 100
        return weight / (heightInMeters * heightInMeters)
    }

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { category: language === 'zh' ? '偏瘦' : language === 'ms' ? 'Kurang berat' : 'Underweight', color: 'bg-blue-50 border-blue-300 text-blue-800' }
        if (bmi < 25) return { category: language === 'zh' ? '正常' : language === 'ms' ? 'Normal' : 'Normal', color: 'bg-green-50 border-green-300 text-green-800' }
        if (bmi < 30) return { category: language === 'zh' ? '超重' : language === 'ms' ? 'Berlebihan berat' : 'Overweight', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' }
        return { category: language === 'zh' ? '肥胖' : language === 'ms' ? 'Obes' : 'Obese', color: 'bg-red-50 border-red-300 text-red-800' }
    }

    const handleComplete = () => {
        onComplete(messages)
    }

    // Filter messages for display
    const displayMessages = messages.filter(m =>
        m.role !== 'system' &&
        !m.content.startsWith('The patient mentioned') &&
        m.content !== 'Please start the consultation.' &&
        !Object.values(initialPrompts).some(p => m.content.includes(p)) &&
        !m.content.includes('uploaded the following files') // Hide the file injection message if it looks technical
    )

    // Sync with global navigation
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
            canNext: displayMessages.length >= 2,
            showBack: !!onBack,
            showSkip: false
        })
    }, [displayMessages.length, setNavigationState, !!onBack])

    return (
        <>
            {/* Voice Dictation Disclaimer Modal */}
            {showVoiceDisclaimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-stone-800">
                                    {language === 'zh' ? '语音输入 (原型版)' : language === 'ms' ? 'Input Suara (Prototaip)' : 'Voice Input (Prototype)'}
                                </h3>
                                <p className="text-sm text-stone-500">
                                    {language === 'zh' ? '实验性功能' : language === 'ms' ? 'Ciri Eksperimen' : 'Experimental Feature'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-amber-800 leading-relaxed">
                                {language === 'zh'
                                    ? '此语音识别功能目前处于原型阶段，识别准确率可能不高。建议在使用后检查并修正识别结果。未来版本将采用更先进的语音技术以提供更好的体验。'
                                    : language === 'ms'
                                        ? 'Ciri pengecaman suara ini masih dalam fasa prototaip dan ketepatannya mungkin tidak tinggi. Sila semak dan betulkan hasil selepas menggunakan. Versi akan datang akan menggunakan teknologi suara yang lebih maju.'
                                        : 'This voice recognition feature is currently in prototype stage and accuracy may be limited. Please review and correct the results after use. Future versions will use more advanced speech technology for better accuracy.'}
                            </p>
                        </div>

                        <ul className="text-sm text-stone-600 space-y-2 mb-6">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                {language === 'zh' ? '支持中文、英语和马来语' : language === 'ms' ? 'Menyokong Mandarin, Inggeris dan Melayu' : 'Supports Chinese, English and Malay'}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                {language === 'zh' ? '点击麦克风开始，再次点击停止' : language === 'ms' ? 'Ketik mikrofon untuk mula, ketik lagi untuk berhenti' : 'Tap mic to start, tap again to stop'}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-amber-500">⚠</span>
                                {language === 'zh' ? '需要Chrome或Edge浏览器' : language === 'ms' ? 'Memerlukan pelayar Chrome atau Edge' : 'Requires Chrome or Edge browser'}
                            </li>
                        </ul>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDisclaimerClose}
                                className="flex-1"
                            >
                                {language === 'zh' ? '取消' : language === 'ms' ? 'Batal' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleDisclaimerAccept}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                                {language === 'zh' ? '我知道了，开始' : language === 'ms' ? 'Saya faham, mula' : 'I Understand, Start'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card className={`flex flex-col gap-3 md:gap-4 transition-all duration-300 ${isMaximized
                ? 'fixed inset-0 z-40 bg-white rounded-none p-4 pb-20 md:p-6 md:pb-6'
                : 'p-4 md:p-6 h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] md:mb-0 relative'
                }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3 md:pb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-semibold text-emerald-800">{t.inquiry.title}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}>
                                {doctorInfo.icon} {language === 'zh' ? doctorInfo.nameZh : doctorInfo.name}
                            </span>
                        </div>
                        <p className="text-stone-600 text-xs md:text-sm">{t.inquiry.chatDescription}</p>
                    </div>
                    <div className="flex gap-2 items-center absolute right-4 top-4 md:static">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="h-8 w-8 p-0 md:h-10 md:w-10"
                            title={isMaximized ? "Minimize" : "Maximize"}
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                        </Button>
                    </div>
                </div>

                {doctorInfo.id === 'master' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-sm text-amber-800">
                        <span className="text-xl">⏳</span>
                        <div>
                            <p className="font-medium">{language === 'zh' ? '大师级别分析' : language === 'ms' ? 'Analisis Tahap Pakar' : 'Master Level Analysis'}</p>
                            <p className="text-amber-700/80 text-xs mt-0.5">
                                {language === 'zh'
                                    ? '大师级医师会进行深度推理和分析。回复可能需要较长时间，因为需要考虑多种中医理论。'
                                    : language === 'ms'
                                        ? 'Pakar melakukan penaakulan dan analisis mendalam. Respons mungkin mengambil sedikit masa.'
                                        : 'The Master physician performs deep reasoning and analysis. Responses may take slightly longer to generate.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Basic Information Summary with BMI */}
                {basicInfo && basicInfo.weight && basicInfo.height && (
                    <details className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 md:p-4 rounded-lg border border-emerald-200 group">
                        <summary className="font-semibold text-emerald-800 text-sm cursor-pointer flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                            {t.report.patientInfo}
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                                <span className="group-open:hidden">{language === 'zh' ? '点击展开' : language === 'ms' ? 'Ketik untuk kembang' : 'Tap to expand'}</span>
                                <span className="hidden group-open:inline">{language === 'zh' ? '点击收起' : language === 'ms' ? 'Ketik untuk tutup' : 'Tap to collapse'}</span>
                                <ChevronDown className="w-4 h-4 group-open:hidden" />
                                <ChevronUp className="w-4 h-4 hidden group-open:block" />
                            </div>
                        </summary>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
                            {/* ... existing basic info details ... */}
                            <div>
                                <span className="text-stone-500 text-xs">{t.report.name}:</span>
                                <p className="font-medium text-stone-800 text-sm">{basicInfo.name}</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-xs">{t.report.age}:</span>
                                <p className="font-medium text-stone-800 text-sm">{basicInfo.age} {language === 'zh' ? '岁' : language === 'ms' ? 'tahun' : 'years'}</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-xs">{t.report.gender}:</span>
                                <p className="font-medium text-stone-800 text-sm capitalize">{basicInfo.gender}</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-xs">{t.report.weight}:</span>
                                <p className="font-medium text-stone-800 text-sm">{basicInfo.weight} kg</p>
                            </div>
                            <div>
                                <span className="text-stone-500 text-xs">{t.report.height}:</span>
                                <p className="font-medium text-stone-800 text-sm">{basicInfo.height} cm</p>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                {(() => {
                                    const weight = parseFloat(basicInfo.weight)
                                    const height = parseFloat(basicInfo.height)
                                    if (weight > 0 && height > 0) {
                                        const bmi = calculateBMI(weight, height)
                                        const bmiInfo = getBMICategory(bmi)
                                        return (
                                            <div>
                                                <span className="text-stone-500 text-xs">{t.report.bmi}:</span>
                                                <div className={`inline-flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full border text-xs ${bmiInfo.color}`}>
                                                    <span className="font-bold">{bmi.toFixed(1)}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold">{bmiInfo.category}</span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                })()}
                            </div>
                        </div>

                        {/* Medicine List Section */}
                        {medicineFiles.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-emerald-200/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Pill className="w-4 h-4 text-amber-600" />
                                    <span className="font-medium text-stone-700 text-sm">
                                        {language === 'zh' ? '当前用药' : language === 'ms' ? 'Ubat Semasa' : 'Current Medications'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {medicineFiles.map((file, index) => (
                                        <div key={index} className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs text-amber-800">
                                            {file.extractedText ? (
                                                <span>{file.extractedText.split('\n').filter(line => line.trim()).slice(0, 3).join(', ')}{file.extractedText.split('\n').filter(line => line.trim()).length > 3 ? '...' : ''}</span>
                                            ) : (
                                                <span>{file.name}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Medical Reports Summary Section */}
                        {reportFiles.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-emerald-200/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-stone-700 text-sm">
                                        {language === 'zh' ? '医疗报告摘要' : language === 'ms' ? 'Ringkasan Laporan Perubatan' : 'Medical Report Summary'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {reportFiles.map((file, index) => (
                                        <div key={index} className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-xs text-blue-800">
                                            <div className="font-medium mb-1">{file.name}</div>
                                            {file.extractedText && (
                                                <p className="text-blue-700/80 line-clamp-2">
                                                    {file.extractedText.substring(0, 150)}{file.extractedText.length > 150 ? '...' : ''}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </details>
                )}

                {/* Chat Messages Area */}
                <div
                    ref={scrollAreaRef}
                    className={`flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-stone-100 ${isMaximized ? 'mb-20 md:mb-0' : ''}`}
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#6ee7b7 #f5f5f4'
                    }}
                >
                    <div className="space-y-4 p-2 pb-24 md:pb-2">
                        {displayMessages.filter(m => m.content || m.role === 'user').map((m) => {
                            const { cleanContent } = extractOptions(m.content)
                            return (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] md:max-w-[80%] p-3 rounded-lg whitespace-pre-wrap text-sm md:text-base ${m.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-br-none'
                                        : 'bg-stone-100 text-stone-800 rounded-bl-none'
                                        }`}>
                                        {cleanContent}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Suggested Options */}
                        {!isLoading && displayMessages.length > 0 && displayMessages[displayMessages.length - 1].role === 'assistant' && (
                            (() => {
                                const { options } = extractOptions(displayMessages[displayMessages.length - 1].content)
                                if (options.length === 0) return null
                                return (
                                    <div className="flex flex-wrap gap-2 justify-start pl-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(option)}
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm active:scale-95"
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )
                            })()
                        )}
                        {isLoading && displayMessages.length === 0 && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%]">
                                    <ThinkingAnimation basicInfo={basicInfo} variant="compact" />
                                </div>
                            </div>
                        )}
                        {isLoading && displayMessages.length > 0 && !displayMessages[displayMessages.length - 1]?.content && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%]">
                                    <ThinkingAnimation basicInfo={basicInfo} variant="compact" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area - Sticky on mobile above nav */}
                <div className={`flex gap-2 pt-2 md:pt-2 md:border-t ${isMaximized ? 'fixed bottom-16 md:bottom-2 left-0 right-0 p-4 bg-white z-50 md:relative md:p-0 md:bg-transparent md:z-auto' : 'fixed bottom-16 left-0 right-0 p-4 bg-white z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-t-0 md:z-auto'
                    }`}>
                    <form onSubmit={handleSubmit} className="flex-1 flex gap-2 w-full md:max-w-4xl md:mx-auto">
                        <Button
                            type="button"
                            variant={isRecording ? "default" : "outline"}
                            size="icon"
                            className={`h-12 w-12 shrink-0 transition-all duration-200 ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 border-red-500 animate-pulse'
                                : ''
                                }`}
                            onClick={handleVoiceInput}
                            title={isRecording
                                ? (language === 'zh' ? '点击停止录音' : language === 'ms' ? 'Ketik untuk berhenti' : 'Click to stop')
                                : (language === 'zh' ? '语音输入' : language === 'ms' ? 'Input suara' : 'Voice input')
                            }
                        >
                            {isRecording
                                ? <MicOff className="w-5 h-5 text-white" />
                                : <Mic className="w-5 h-5 text-stone-600" />
                            }
                        </Button>
                        <Input
                            ref={inputRef}
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            placeholder={t.inquiry.inputPlaceholder}
                            className="flex-1 h-12 text-base"
                            autoFocus={!isMaximized} // Disable autofocus on mobile maximize to prevent keyboard jumpiness initially
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !localInput?.trim()} className="h-12 w-12 shrink-0 p-0">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </form>
                </div>

                {/* Navigation Buttons - Hidden on mobile as handled by BottomNavigation */}
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
                        onClick={handleComplete}
                        className="flex-1 h-12 bg-emerald-800 hover:bg-emerald-900 text-base"
                        disabled={displayMessages.length < 2}
                    >
                        {language === 'zh' ? '生成总结' : language === 'ms' ? 'Jana Ringkasan' : 'Generate Summary'}
                    </Button>
                </div>
            </Card>
        </>
    )
}
