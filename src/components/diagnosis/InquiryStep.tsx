'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { BasicInfoData } from './BasicInfoForm'

interface FileData {
    name: string
    type: string
    data: string
}

export function InquiryStep({
    onComplete,
    basicInfo
}: {
    onComplete: (data: { inquiryText: string, chatHistory: any[], files: FileData[] }) => void,
    basicInfo?: BasicInfoData
}) {
    const [files, setFiles] = useState<FileData[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Construct the initial system message based on basic info
    const systemMessage = basicInfo
        ? `You are an experienced Traditional Chinese Medicine practitioner (老中医). The patient is a ${basicInfo.age}-year-old ${basicInfo.gender} named ${basicInfo.name}.
    
Weight: ${basicInfo.weight} kg
Height: ${basicInfo.height} cm
Main complaints/symptoms: "${basicInfo.symptoms}"
Symptom duration: ${basicInfo.symptomDuration}

CRITICAL INSTRUCTIONS:
1. Ask ONLY ONE focused follow-up question at a time based on the information provided
2. Do NOT greet or introduce yourself - the conversation has already started
3. Base your questions on their symptoms: "${basicInfo.symptoms}"
4. Follow the principles of the "Ten Questions" (Shi Wen) of TCM
5. Continue asking focused questions until you have enough information for diagnosis (typically 8-15 questions)
6. Be professional, empathetic, and thorough in your inquiry
7. When you have sufficient information, acknowledge it and say you're ready to proceed with diagnosis`
        : `You are an experienced Traditional Chinese Medicine practitioner (老中医). Please ask the patient relevant questions to understand their condition better. Ask only one question at a time.`

    const { messages, sendMessage, setMessages, isLoading, error } = useChat({
        api: '/api/chat',
        initialMessages: [
            { id: '1', role: 'system', content: systemMessage }
        ],
        onError: (err: any) => console.error("useChat error:", err),
    } as any) as any

    const [localInput, setLocalInput] = useState('')
    const [hasRequestedInitialQuestion, setHasRequestedInitialQuestion] = useState(false)

    // Trigger the first question from AI doctor when component mounts
    useEffect(() => {
        if (!hasRequestedInitialQuestion && messages.length === 1 && messages[0].role === 'system') {
            setHasRequestedInitialQuestion(true)

            // Generate a more specific prompt based on symptoms
            let prompt = 'Please start the consultation.'

            if (basicInfo && basicInfo.symptoms) {
                const symptoms = basicInfo.symptoms.toLowerCase()

                if (symptoms.includes('pain') || symptoms.includes('ache')) {
                    prompt = `The patient mentioned experiencing "${basicInfo.symptoms}". Please ask about the nature of this pain (sharp, dull, throbbing, or burning).`
                } else if (symptoms.includes('fatigue') || symptoms.includes('tired')) {
                    prompt = `The patient mentioned feeling "${basicInfo.symptoms}". Please ask when they notice this fatigue most (morning, afternoon, or evening).`
                } else if (symptoms.includes('headache')) {
                    prompt = `The patient mentioned "${basicInfo.symptoms}". Please ask about the characteristics of the headache.`
                } else {
                    prompt = `The patient mentioned experiencing "${basicInfo.symptoms}". Please ask a relevant follow-up question to understand their condition better.`
                }
            }

            // Send the prompt to trigger the AI doctor's first question
            sendMessage({ role: 'user', content: prompt })
        }
    }, [messages, hasRequestedInitialQuestion, basicInfo, sendMessage])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!localInput.trim()) return
        try {
            await sendMessage({ role: 'user', content: localInput })
            setLocalInput('')
        } catch (e) {
            console.error('SendMessage error:', e)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const newFiles: FileData[] = []

        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i]
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large (max 5MB)`)
                continue
            }

            try {
                const base64 = await convertToBase64(file)
                newFiles.push({
                    name: file.name,
                    type: file.type,
                    data: base64 as string
                })
            } catch (error) {
                console.error("Error reading file:", error)
            }
        }
        setFiles(prev => [...prev, ...newFiles])
    }

    const convertToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
        })
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const calculateBMI = (weight: number, height: number) => {
        const heightInMeters = height / 100
        return weight / (heightInMeters * heightInMeters)
    }

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { category: 'Underweight', description: 'Below healthy range', color: 'bg-blue-50 border-blue-300 text-blue-800' }
        if (bmi < 25) return { category: 'Normal', description: 'Healthy weight', color: 'bg-green-50 border-green-300 text-green-800' }
        if (bmi < 30) return { category: 'Overweight', description: 'Above healthy range', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' }
        return { category: 'Obese', description: 'Significantly above range', color: 'bg-red-50 border-red-300 text-red-800' }
    }

    const handleComplete = () => {
        // Compile the chat history into a text format for the "inquiryText" field
        // Filter out the initial system message and the trigger prompt
        const chatSummary = messages
            .filter((m: any) => m.role !== 'system' && m.content !== 'Please start the consultation.' && !m.content.startsWith('The patient mentioned'))
            .map((m: any) => `${m.role === 'user' ? 'Patient' : 'Doctor'}: ${m.content}`)
            .join('\n');

        onComplete({
            inquiryText: chatSummary,
            chatHistory: messages,
            files
        })
    }

    return (
        <Card className="p-6 h-[600px] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-xl font-semibold text-emerald-800">Wen (Inquiry) - Consultation</h2>
                    <p className="text-stone-600 text-sm">Chat with the AI assistant to describe your condition.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    Upload Reports
                </Button>
            </div>

            {/* Basic Information Summary with BMI */}
            {basicInfo && basicInfo.weight && basicInfo.height && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                    <h3 className="font-semibold text-emerald-800 text-sm">Patient Information Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <span className="text-stone-500">Name:</span>
                            <p className="font-medium text-stone-800">{basicInfo.name}</p>
                        </div>
                        <div>
                            <span className="text-stone-500">Age:</span>
                            <p className="font-medium text-stone-800">{basicInfo.age} years</p>
                        </div>
                        <div>
                            <span className="text-stone-500">Gender:</span>
                            <p className="font-medium text-stone-800 capitalize">{basicInfo.gender}</p>
                        </div>
                        <div>
                            <span className="text-stone-500">Weight:</span>
                            <p className="font-medium text-stone-800">{basicInfo.weight} kg</p>
                        </div>
                        <div>
                            <span className="text-stone-500">Height:</span>
                            <p className="font-medium text-stone-800">{basicInfo.height} cm</p>
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
                                            <span className="text-stone-500">BMI Status:</span>
                                            <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full border ${bmiInfo.color}`}>
                                                <span className="font-bold">{bmi.toFixed(1)}</span>
                                                <span className="text-xs">•</span>
                                                <span className="font-semibold">{bmiInfo.category}</span>
                                                <span className="text-xs opacity-75">({bmiInfo.description})</span>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages
                        .filter((m: any) => m.role !== 'system' && m.content !== 'Please start the consultation.' && !m.content.startsWith('The patient mentioned'))
                        .map((m: any) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-stone-100 text-stone-800 rounded-bl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-stone-100 text-stone-500 p-3 rounded-lg rounded-bl-none italic text-sm">
                                Typing...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {files.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2 border-t border-stone-100">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 text-xs whitespace-nowrap">
                            <span className="truncate max-w-[100px]">{file.name}</span>
                            <button onClick={() => removeFile(index)} className="text-stone-400 hover:text-red-500">
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
                <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                    <Input
                        value={localInput}
                        onChange={(e) => setLocalInput(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" disabled={isLoading || !localInput?.trim()}>
                        Send
                    </Button>
                </form>
            </div>

            <Button onClick={handleComplete} className="w-full bg-emerald-800 hover:bg-emerald-900 mt-2">
                Finish Inquiry & Continue
            </Button>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
            />
        </Card>
    )
}
