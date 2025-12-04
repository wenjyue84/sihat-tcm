'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BasicInfoData } from './BasicInfoForm'
import { Loader2, Send, Upload, X } from 'lucide-react'
import { useDoctorLevel } from '@/contexts/DoctorContext'

interface FileData {
    name: string
    type: string
    data: string
}

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
}

export function InquiryStep({
    onComplete,
    basicInfo
}: {
    onComplete: (data: { inquiryText: string, chatHistory: any[], files: FileData[] }) => void,
    basicInfo?: BasicInfoData
}) {
    const { getDoctorInfo } = useDoctorLevel()
    const doctorInfo = getDoctorInfo()
    const [files, setFiles] = useState<FileData[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [localInput, setLocalInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hasRequestedInitialQuestion, setHasRequestedInitialQuestion] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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

    // Send message to API with manual streaming
    const sendMessage = useCallback(async (userMessage: string, isInitialPrompt = false) => {
        setIsLoading(true)

        // Add user message to state (skip if it's the initial prompt)
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage
        }

        const currentMessages = isInitialPrompt
            ? [{ role: 'system', content: systemMessage }]
            : [...messages, userMsg]

        if (!isInitialPrompt) {
            setMessages(prev => [...prev, userMsg])
        }

        try {
            console.log('[InquiryStep] Sending message to /api/chat')
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
                    basicInfo,
                    model: doctorInfo.model
                })
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            // Read streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            // Create placeholder for assistant message
            const assistantMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

            if (reader) {
                console.log('[InquiryStep] Starting to read stream...')
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        console.log('[InquiryStep] Stream complete!')
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

            console.log('[InquiryStep] Final response length:', fullText.length)
        } catch (err: any) {
            console.error('[InquiryStep] Error:', err)
            // Add error message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }])
        } finally {
            setIsLoading(false)
        }
    }, [messages, systemMessage, basicInfo, doctorInfo.model])

    // Trigger the first question from AI doctor when component mounts
    useEffect(() => {
        if (!hasRequestedInitialQuestion && messages.length === 0) {
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
            sendMessage(prompt, true)
        }
    }, [hasRequestedInitialQuestion, messages.length, basicInfo, sendMessage])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    // Keep focus on input field - refocus when loading finishes or messages change
    useEffect(() => {
        if (!isLoading) {
            // Small delay to ensure DOM is updated before focusing
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
        // Auto-focus the input field after sending message
        inputRef.current?.focus()
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
        const chatSummary = messages
            .filter((m) => m.role !== 'system')
            .map((m) => `${m.role === 'user' ? 'Patient' : 'Doctor'}: ${m.content}`)
            .join('\n');

        onComplete({
            inquiryText: chatSummary,
            chatHistory: messages,
            files
        })
    }

    // Filter messages for display (hide system messages and initial prompts)
    const displayMessages = messages.filter(m =>
        m.role !== 'system' &&
        !m.content.startsWith('The patient mentioned') &&
        m.content !== 'Please start the consultation.'
    )

    return (
        <Card className="p-4 md:p-6 h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3 md:pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-xl font-semibold text-emerald-800">Wen (Inquiry) - Consultation</h2>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}>
                            {doctorInfo.icon} {doctorInfo.name}
                        </span>
                    </div>
                    <p className="text-stone-600 text-xs md:text-sm">Chat with the AI assistant to describe your condition.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-10 text-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Reports
                </Button>
            </div>

            {doctorInfo.id === 'master' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-sm text-amber-800">
                    <span className="text-xl">⏳</span>
                    <div>
                        <p className="font-medium">Master Level Analysis</p>
                        <p className="text-amber-700/80 text-xs mt-0.5">
                            The Master physician performs deep reasoning and analysis. Responses may take slightly longer to generate as it considers multiple TCM theories.
                        </p>
                    </div>
                </div>
            )}

            {/* Basic Information Summary with BMI - Collapsible hint on mobile */}
            {basicInfo && basicInfo.weight && basicInfo.height && (
                <details className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 md:p-4 rounded-lg border border-emerald-200 group">
                    <summary className="font-semibold text-emerald-800 text-sm cursor-pointer flex items-center justify-between">
                        Patient Information
                        <span className="text-xs text-emerald-600 group-open:hidden">Tap to expand</span>
                    </summary>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
                        <div>
                            <span className="text-stone-500 text-xs">Name:</span>
                            <p className="font-medium text-stone-800 text-sm">{basicInfo.name}</p>
                        </div>
                        <div>
                            <span className="text-stone-500 text-xs">Age:</span>
                            <p className="font-medium text-stone-800 text-sm">{basicInfo.age} years</p>
                        </div>
                        <div>
                            <span className="text-stone-500 text-xs">Gender:</span>
                            <p className="font-medium text-stone-800 text-sm capitalize">{basicInfo.gender}</p>
                        </div>
                        <div>
                            <span className="text-stone-500 text-xs">Weight:</span>
                            <p className="font-medium text-stone-800 text-sm">{basicInfo.weight} kg</p>
                        </div>
                        <div>
                            <span className="text-stone-500 text-xs">Height:</span>
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
                                            <span className="text-stone-500 text-xs">BMI Status:</span>
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
                </details>
            )}

            {/* Chat Messages Area with Scrollbar */}
            <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-stone-100"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#6ee7b7 #f5f5f4'
                }}
            >
                <div className="space-y-4 p-2">
                    {displayMessages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${m.role === 'user'
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-stone-100 text-stone-800 rounded-bl-none'
                                }`}>
                                {m.content || (isLoading ? '...' : '')}
                            </div>
                        </div>
                    ))}
                    {isLoading && displayMessages.length === 0 && (
                        <div className="flex justify-start">
                            <div className="bg-stone-100 text-stone-500 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="italic text-sm">Doctor is typing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {files.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2 border-t border-stone-100">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 text-xs whitespace-nowrap">
                            <span className="truncate max-w-[100px]">{file.name}</span>
                            <button onClick={() => removeFile(index)} className="text-stone-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
                <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                    <Input
                        ref={inputRef}
                        value={localInput}
                        onChange={(e) => setLocalInput(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1 h-12 text-base"
                        autoFocus
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !localInput?.trim()} className="h-12 w-12 p-0">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>

            <Button
                onClick={handleComplete}
                className="w-full h-12 bg-emerald-800 hover:bg-emerald-900 text-base"
                disabled={displayMessages.length < 2}
            >
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
