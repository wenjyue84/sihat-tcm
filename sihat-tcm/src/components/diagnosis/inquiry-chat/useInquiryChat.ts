
import { useState, useCallback, useRef } from 'react'
import { useLanguage } from '@/stores/useAppStore'
import { useDoctorLevel } from '@/stores/useAppStore'
import { BasicInfoData } from '../BasicInfoForm'
import { INTERACTIVE_CHAT_PROMPT } from '@/lib/systemPrompts'

export interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
}

export function useInquiryChat(basicInfo?: BasicInfoData) {
    const { language } = useLanguage()
    const { getDoctorInfo } = useDoctorLevel()
    const doctorInfo = getDoctorInfo()

    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Construct the initial system message
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

    const sendMessage = useCallback(async (userMessage: string, isInitialPrompt = false, isSystemInjection = false) => {
        setIsLoading(true)

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage
        }

        if (!isSystemInjection) {
            setMessages(prev => [...prev, userMsg])
        }

        const currentMessages = isInitialPrompt
            ? [{ role: 'system', content: systemMessage }, userMsg]
            : [...messages, userMsg]

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
                    basicInfo,
                    model: doctorInfo.model,
                    language
                })
            })

            if (!response.ok) {
                try {
                    const errorData = await response.json()
                    throw new Error(JSON.stringify(errorData))
                } catch {
                    throw new Error(`API error: ${response.status}`)
                }
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
            console.error('[InquiryChat] Error:', err)

            // Error handling logic (simplified for brevity, can be expanded if needed)
            const errorMessage = language === 'zh' ? '抱歉，发生了错误。请重试。' : 'Sorry, I encountered an error. Please try again.'

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage
            }])
        } finally {
            setIsLoading(false)
        }
    }, [messages, systemMessage, basicInfo, doctorInfo.model, language])

    return {
        messages,
        isLoading,
        sendMessage,
        doctorInfo
    }
}
