'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export interface InquiryData {
    inquiryText: string
    files: Array<{
        name: string
        type: string
        data: string // Base64
    }>
}

interface InquiryStepProps {
    onComplete: (data: InquiryData) => void
    initialData?: InquiryData
}

export function InquiryStep({ onComplete, initialData }: InquiryStepProps) {
    const [inquiryText, setInquiryText] = useState(initialData?.inquiryText || '')
    const [files, setFiles] = useState<InquiryData['files']>(initialData?.files || [])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: InquiryData['files'] = []
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i]
                // Basic validation: allow images and PDFs, max size 5MB
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

    const handleSubmit = () => {
        onComplete({
            inquiryText,
            files
        })
    }

    return (
        <Card className="p-6 space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-emerald-800">Wen (Inquiry) - Detailed Information</h2>
                <p className="text-stone-600 text-sm">
                    Please describe your condition in detail. You can also upload medical reports or relevant documents.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="inquiry">Detailed Description</Label>
                <Textarea
                    id="inquiry"
                    placeholder="Describe your main complaints, medical history, or any specific questions..."
                    className="min-h-[150px]"
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Medical Reports / Documents (Optional)</Label>
                <div
                    className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept="image/*,application/pdf"
                    />
                    <div className="flex flex-col items-center gap-2 text-stone-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                        <span className="text-sm">Click to upload images or PDFs</span>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="space-y-2 mt-4">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-stone-50 rounded border border-stone-100">
                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(index)
                                    }}
                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Next Step
            </Button>
        </Card>
    )
}
