'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

export function AdaptiveChat({ onComplete }: { onComplete: (data: any) => void }) {
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: '/api/chat',
        initialMessages: [
            { id: '1', role: 'system', content: 'You are a TCM assistant. Ask relevant follow-up questions about symptoms. Keep it brief.' },
            { id: '2', role: 'assistant', content: 'Do you have any specific symptoms you would like to mention?' }
        ]
    })

    return (
        <Card className="p-6 space-y-4 h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold">Wen (Inquiry)</h2>
            <ScrollArea className="flex-1 p-4 border rounded-lg">
                {messages.filter((m: any) => m.role !== 'system').map((m: any) => (
                    <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            {m.content}
                        </span>
                    </div>
                ))}
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input value={input} onChange={handleInputChange} placeholder="Type your answer..." />
                <Button type="submit">Send</Button>
            </form>
            <Button variant="outline" onClick={() => onComplete({ chat: messages })}>Finish Chat</Button>
        </Card>
    )
}
