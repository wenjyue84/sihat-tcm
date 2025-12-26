import { useState, useRef, useCallback, useEffect } from 'react'
import { useLanguage } from '@/stores/useAppStore'

// Type declaration for Web Speech API
interface WebSpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface WebSpeechRecognitionErrorEvent extends Event {
    error: string
    message?: string
}

interface WebSpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: WebSpeechRecognitionEvent) => void) | null
    onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}



export function useVoiceInput(onTranscript: (text: string) => void) {
    const { language } = useLanguage()
    const [isRecording, setIsRecording] = useState(false)
    const [isSpeechSupported, setIsSpeechSupported] = useState(false)
    const [showVoiceDisclaimer, setShowVoiceDisclaimer] = useState(false)
    const hasSeenVoiceDisclaimer = useRef(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        setIsSpeechSupported(
            typeof window !== 'undefined' &&
            ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
        )
    }, [])

    const startVoiceRecognition = useCallback(() => {
        if (!isSpeechSupported) {
            alert(language === 'zh'
                ? '您的浏览器不支持语音识别。请使用Chrome或Edge浏览器。'
                : language === 'ms'
                    ? 'Pelayar anda tidak menyokong pengecaman suara. Sila gunakan Chrome atau Edge.'
                    : 'Your browser does not support voice recognition. Please use Chrome or Edge.')
            return
        }

        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognitionClass()

        recognition.lang = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US'
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => setIsRecording(true)

        recognition.onresult = (event: WebSpeechRecognitionEvent) => {
            let finalTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                }
            }
            if (finalTranscript) {
                onTranscript(finalTranscript)
            }
        }

        recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error)
            setIsRecording(false)

            if (event.error === 'no-speech') return

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
    }, [isSpeechSupported, language, onTranscript])

    const stopVoiceRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsRecording(false)
        }
    }, [])

    const handleVoiceToggle = useCallback(() => {
        if (isRecording) {
            stopVoiceRecognition()
            return
        }

        if (!hasSeenVoiceDisclaimer.current) {
            setShowVoiceDisclaimer(true)
            return
        }

        startVoiceRecognition()
    }, [isRecording, stopVoiceRecognition, startVoiceRecognition])

    const acceptDisclaimer = useCallback(() => {
        hasSeenVoiceDisclaimer.current = true
        setShowVoiceDisclaimer(false)
        startVoiceRecognition()
    }, [startVoiceRecognition])

    return {
        isRecording,
        handleVoiceToggle,
        showVoiceDisclaimer,
        setShowVoiceDisclaimer,
        acceptDisclaimer
    }
}
