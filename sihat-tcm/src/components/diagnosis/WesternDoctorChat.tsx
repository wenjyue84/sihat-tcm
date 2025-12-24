'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Send, X, Maximize2, Minimize2, Mic, MicOff, AlertTriangle, Stethoscope, Eye, EyeOff } from 'lucide-react'
import { useDoctorLevel } from '@/contexts/DoctorContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { WESTERN_DOCTOR_PROMPT } from '@/lib/systemPrompts'
import { ThinkingAnimation } from './ThinkingAnimation'
import { supabase } from '@/lib/supabase/client'

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
    const match = content.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/)
    if (match) {
        const optionsStr = match[1]
        const cleanContent = content.replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/, '').trim()
        const options = optionsStr.split(',').map(o => o.trim()).filter(o => o)
        return { cleanContent, options }
    }
    return { cleanContent: content, options: [] as string[] }
}

interface WesternDoctorChatProps {
    isOpen: boolean
    onClose: () => void
    tcmReportData: any
    patientInfo?: any
    onComplete?: (chatHistory: Message[], westernReport: any) => void
}

export function WesternDoctorChat({
    isOpen,
    onClose,
    tcmReportData,
    patientInfo,
    onComplete
}: WesternDoctorChatProps) {
    const { getDoctorInfo } = useDoctorLevel()
    const { t, language } = useLanguage()
    const doctorInfo = getDoctorInfo()
    const [messages, setMessages] = useState<Message[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)
    const [customPrompt, setCustomPrompt] = useState<string | null>(null)
    const hasRequestedInitialQuestion = useRef(false)
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

    // Fetch custom prompt from database
    useEffect(() => {
        const fetchCustomPrompt = async () => {
            try {
                const { data } = await supabase
                    .from('system_prompts')
                    .select('prompt_text')
                    .eq('role', 'doctor_western')
                    .single()

                if (data?.prompt_text) {
                    setCustomPrompt(data.prompt_text)
                }
            } catch (error) {
                console.log('Using default Western Doctor prompt')
            }
        }
        fetchCustomPrompt()
    }, [])

    // Get the active prompt (custom or default)
    const activePrompt = customPrompt || WESTERN_DOCTOR_PROMPT

    // Build context from TCM report
    const buildTCMContext = () => {
        const diagnosis = typeof tcmReportData?.diagnosis === 'string'
            ? tcmReportData.diagnosis
            : tcmReportData?.diagnosis?.primary_pattern || 'Not available'

        const constitution = typeof tcmReportData?.constitution === 'string'
            ? tcmReportData.constitution
            : tcmReportData?.constitution?.type || 'Not available'

        const analysis = typeof tcmReportData?.analysis === 'string'
            ? tcmReportData.analysis
            : tcmReportData?.analysis?.summary || 'Not available'

        return `
=== TCM DIAGNOSIS REPORT SUMMARY ===
TCM Diagnosis: ${diagnosis}
Constitution Type: ${constitution}
Analysis: ${analysis}

=== PATIENT INFORMATION ===
Name: ${patientInfo?.name || 'Not provided'}
Age: ${patientInfo?.age || 'Not provided'}
Gender: ${patientInfo?.gender || 'Not provided'}
Height: ${patientInfo?.height || 'Not provided'} cm
Weight: ${patientInfo?.weight || 'Not provided'} kg
Chief Complaint: ${patientInfo?.symptoms || 'Not provided'}
`
    }

    // Construct the system message
    const systemMessage = `${activePrompt}

${buildTCMContext()}`

    // Send message to API with manual streaming  
    // Uses /api/western-chat which is specifically designed for Western Doctor second opinion
    const sendMessage = useCallback(async (userMessage: string, isInitialPrompt = false) => {
        setIsLoading(true)

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage
        }

        setMessages(prev => [...prev, userMsg])

        // Build messages array without system message - we pass it separately
        const chatMessages = isInitialPrompt
            ? [userMsg]
            : [...messages, userMsg]

        try {
            const response = await fetch('/api/western-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
                    systemPrompt: systemMessage,
                    tcmReportData: tcmReportData,
                    patientInfo: patientInfo,
                    model: doctorInfo.model,
                    language: language
                })
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            const assistantMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    fullText += chunk

                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId ? { ...m, content: fullText } : m
                    ))
                }
            }
        } catch (err: any) {
            console.error('[WesternDoctorChat] Error:', err)
            const errorMessages: Record<string, string> = {
                en: 'Sorry, I encountered an error. Please try again.',
                zh: '抱歉，发生了错误。请重试。',
                ms: 'Maaf, terdapat ralat. Sila cuba lagi.',
            }
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessages[language] || errorMessages.en
            }])
        } finally {
            setIsLoading(false)
        }
    }, [messages, systemMessage, tcmReportData, patientInfo, doctorInfo.model, language])

    // Trigger the first question when chat opens
    useEffect(() => {
        if (isOpen && !hasRequestedInitialQuestion.current && messages.length === 0) {
            hasRequestedInitialQuestion.current = true

            const initialPrompts: Record<string, string> = {
                en: `I've completed my TCM consultation and would like your Western medicine perspective. Please review my TCM diagnosis and ask any relevant questions.`,
                zh: `我已完成中医诊断，希望能获得您的西医观点。请查看我的中医诊断报告，并提出相关问题。`,
                ms: `Saya telah menyelesaikan konsultasi TCM dan ingin mendapatkan perspektif perubatan Barat. Sila semak diagnosis TCM saya dan tanya soalan yang berkaitan.`,
            }

            sendMessage(initialPrompts[language] || initialPrompts.en, true)
        }
    }, [isOpen, messages.length, language, sendMessage])

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            hasRequestedInitialQuestion.current = false
            setMessages([])
            setLocalInput('')
        }
    }, [isOpen])

    // Auto-scroll
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!localInput.trim() || isLoading) return
        const userInput = localInput
        setLocalInput('')
        await sendMessage(userInput)
        inputRef.current?.focus()
    }

    // Voice recognition
    const startVoiceRecognition = useCallback(() => {
        if (!isSpeechSupported) return

        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognitionClass()

        recognition.lang = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US'
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => setIsRecording(true)
        recognition.onend = () => {
            setIsRecording(false)
            recognitionRef.current = null
        }
        recognition.onerror = () => setIsRecording(false)
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                }
            }
            if (finalTranscript) {
                setLocalInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript)
            }
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
        } else {
            startVoiceRecognition()
        }
    }

    // Filter messages for display
    const displayMessages = messages.filter(m =>
        m.role !== 'system' &&
        !m.content.includes('completed my TCM consultation') &&
        !m.content.includes('完成中医诊断') &&
        !m.content.includes('menyelesaikan konsultasi TCM')
    )

    const translations = {
        en: {
            title: 'Western Medicine Second Opinion',
            subtitle: 'Evidence-based complementary perspective',
            inputPlaceholder: 'Type your answer...',
            generating: 'Generating Report...',
            complete: 'Generate Western Report',
            showPrompt: 'Show Prompt',
            hidePrompt: 'Hide Prompt'
        },
        zh: {
            title: '西医第二意见',
            subtitle: '循证医学的补充观点',
            inputPlaceholder: '输入您的回答...',
            generating: '生成报告中...',
            complete: '生成西医报告',
            showPrompt: '显示提示词',
            hidePrompt: '隐藏提示词'
        },
        ms: {
            title: 'Pendapat Kedua Perubatan Barat',
            subtitle: 'Perspektif pelengkap berasaskan bukti',
            inputPlaceholder: 'Taip jawapan anda...',
            generating: 'Menjana Laporan...',
            complete: 'Jana Laporan Barat',
            showPrompt: 'Tunjuk Prompt',
            hidePrompt: 'Sembunyikan Prompt'
        }
    }

    const currentTranslations = translations[language as keyof typeof translations] || translations.en

    if (!isOpen) return null

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMaximized ? '' : 'p-4'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Chat Window */}
            <Card className={`relative flex flex-col bg-white shadow-2xl transition-all duration-300 ${isMaximized
                ? 'w-full h-full rounded-none'
                : 'w-full max-w-2xl h-[80vh] max-h-[700px] rounded-xl'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-cyan-800">{currentTranslations.title}</h2>
                            <p className="text-xs text-cyan-600">{currentTranslations.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Show Prompt Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPrompt(!showPrompt)}
                            className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100"
                            title={showPrompt ? currentTranslations.hidePrompt : currentTranslations.showPrompt}
                        >
                            {showPrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="text-stone-500 hover:text-stone-700"
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-stone-500 hover:text-stone-700"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Prompt Display */}
                {showPrompt && (
                    <div className="p-4 bg-stone-50 border-b max-h-48 overflow-y-auto">
                        <p className="text-xs font-medium text-stone-500 mb-2">System Prompt:</p>
                        <pre className="text-xs text-stone-600 whitespace-pre-wrap font-mono">
                            {activePrompt.substring(0, 1000)}...
                        </pre>
                    </div>
                )}

                {/* Chat Messages */}
                <div
                    ref={scrollAreaRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {displayMessages.map((m) => {
                        const { cleanContent, options } = extractOptions(m.content)
                        return (
                            <div key={m.id}>
                                <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg whitespace-pre-wrap text-sm ${m.role === 'user'
                                        ? 'bg-cyan-600 text-white rounded-br-none'
                                        : 'bg-stone-100 text-stone-800 rounded-bl-none'
                                        }`}>
                                        {cleanContent}
                                    </div>
                                </div>

                                {/* Quick reply options */}
                                {m.role === 'assistant' && options.length > 0 && !isLoading && m.id === displayMessages[displayMessages.length - 1]?.id && (
                                    <div className="flex flex-wrap gap-2 mt-2 pl-2">
                                        {options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(option)}
                                                className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%]">
                                <ThinkingAnimation basicInfo={patientInfo} variant="compact" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        {isSpeechSupported && (
                            <Button
                                type="button"
                                variant={isRecording ? "default" : "outline"}
                                size="icon"
                                className={`h-10 w-10 shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                                onClick={handleVoiceInput}
                            >
                                {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                            </Button>
                        )}
                        <Input
                            ref={inputRef}
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            placeholder={currentTranslations.inputPlaceholder}
                            className="flex-1 h-10"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !localInput?.trim()}
                            className="h-10 w-10 shrink-0 p-0 bg-cyan-600 hover:bg-cyan-700"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>

                    {displayMessages.length >= 4 && (
                        <Button
                            onClick={() => onComplete?.(messages, { chatHistory: messages })}
                            className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                            {currentTranslations.complete}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    )
}
