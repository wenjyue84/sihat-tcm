'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

export function AdaptiveChat({ onComplete, basicInfo, initialMessages }: { onComplete: (data: any) => void, basicInfo: any, initialMessages?: any[] }) {
    const [input, setInput] = useState('')

    // Construct the initial system message based on basic info
    const systemMessage = `You are a TCM assistant. The patient is a ${basicInfo?.age}-year-old ${basicInfo?.gender} named ${basicInfo?.name}. 
    They have reported the following symptoms: "${basicInfo?.symptoms}".
    Your goal is to ask relevant follow-up questions to gather more details for a TCM diagnosis. 
    Focus on the "Ten Questions" (Shi Wen) of TCM. Ask one question at a time. Keep it brief and professional.`

    const { messages, sendMessage, setMessages, reload, error } = useChat({
        api: '/api/chat',
        initialMessages: initialMessages && initialMessages.length > 0 ? initialMessages : [
            { id: '1', role: 'system', content: systemMessage }
        ],
        onError: (err: any) => console.error("useChat error:", err),
    } as any) as any

    // Trigger the first question from AI when the component mounts
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'system') {
            sendMessage({ role: 'user', content: 'Please start the diagnosis.' })
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        try {
            await sendMessage({ role: 'user', content: input })
        } catch (e) {
            console.error('SendMessage error:', e)
        }
        setInput('')
    }

    return (
        <Card className="p-6 space-y-4 h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold">Wen (Inquiry)</h2>
            <ScrollArea className="flex-1 p-4 border rounded-lg">
                {messages.filter((m: any) => m.role !== 'system' && m.content !== 'Please start the diagnosis.').map((m: any) => (
                    <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            {m.content}
                        </span>
                    </div>
                ))}
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer..." />
                <Button type="submit">Send</Button>
            </form>
            <Button variant="outline" onClick={() => onComplete({ chat: messages })}>Finish Chat</Button>
        </Card>
    )
}
