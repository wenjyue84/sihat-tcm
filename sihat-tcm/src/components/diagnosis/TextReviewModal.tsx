'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, FileText, Check, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface TextReviewModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (text: string, file: File) => void
    file: File | null
    mode?: 'general' | 'medicine'
}

export function TextReviewModal({ isOpen, onClose, onConfirm, file, mode = 'general' }: TextReviewModalProps) {
    const { language } = useLanguage()
    const [isProcessing, setIsProcessing] = useState(true)
    const [timer, setTimer] = useState(0)
    const [text, setText] = useState('')
    const [warning, setWarning] = useState<string | null>(null)

    // Reset state when modal opens with a new file
    useEffect(() => {
        if (isOpen && file) {
            setIsProcessing(true)
            setTimer(0)
            setText('')
            setWarning(null)

            // Start timer
            const startTime = Date.now()
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                setTimer(elapsed)
            }, 1000)

            // Actually extract text from the file using AI
            const extractText = async () => {
                try {
                    // Convert file to base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.readAsDataURL(file)
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = error => reject(error)
                    })

                    // Call extraction API
                    const response = await fetch('/api/extract-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file: base64,
                            fileName: file.name,
                            fileType: file.type,
                            mode: mode,
                            language: language
                        })
                    })

                    const data = await response.json()

                    if (data.error) {
                        throw new Error(data.error)
                    }

                    // Set warning if applicable
                    if (data.warning) {
                        setWarning(data.warning)
                    }

                    // Set the extracted text
                    setText(data.text || '')

                } catch (error: any) {
                    console.error('Extraction error:', error)
                    // Show error message in the text area
                    const errorMessages = {
                        en: `Error extracting text: ${error.message}\n\nPlease try again or enter the information manually.`,
                        zh: `提取文本时出错：${error.message}\n\n请重试或手动输入信息。`,
                        ms: `Ralat mengekstrak teks: ${error.message}\n\nSila cuba lagi atau masukkan maklumat secara manual.`
                    }
                    setText(errorMessages[language as 'en' | 'zh' | 'ms'] || errorMessages.en)
                } finally {
                    clearInterval(interval)
                    setIsProcessing(false)
                }
            }

            extractText()

            return () => {
                clearInterval(interval)
            }
        }
    }, [isOpen, file, mode, language])

    const handleConfirm = () => {
        if (file) {
            onConfirm(text, file)
            onClose()
        }
    }

    const t = {
        title: {
            en: 'Review Extracted Text',
            zh: '审核提取的文本',
            ms: 'Semak Teks yang Diekstrak'
        },
        description: {
            en: 'Please review and edit the text extracted from your document to ensure accuracy.',
            zh: '请审核并编辑从您的文档中提取的文本，以确保准确性。',
            ms: 'Sila semak dan edit teks yang diekstrak daripada dokumen anda untuk memastikan ketepatan.'
        },
        processing: {
            en: 'Processing document...',
            zh: '正在处理文档...',
            ms: 'Sedang memproses dokumen...'
        },
        timeElapsed: {
            en: 'Time elapsed',
            zh: '已用时间',
            ms: 'Masa berlalu'
        },
        seconds: {
            en: 's',
            zh: '秒',
            ms: 's'
        },
        cancel: {
            en: 'Cancel',
            zh: '取消',
            ms: 'Batal'
        },
        confirm: {
            en: 'Confirm & Attach',
            zh: '确认并附加',
            ms: 'Sahkan & Lampirkan'
        }
    }

    const lang = language as 'en' | 'zh' | 'ms'

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        {t.title[lang]}
                    </DialogTitle>
                    <DialogDescription>
                        {t.description[lang]}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-emerald-800">
                                    {timer}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-stone-700">{t.processing[lang]}</p>
                                <p className="text-sm text-stone-500">{t.timeElapsed[lang]}: {timer}{t.seconds[lang]}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {warning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
                                    <span className="text-lg">⚠️</span>
                                    <p>{warning}</p>
                                </div>
                            )}
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[300px] font-mono text-sm bg-stone-50"
                                placeholder="Extracted text will appear here..."
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        <X className="w-4 h-4 mr-2" />
                        {t.cancel[lang]}
                    </Button>
                    <Button onClick={handleConfirm} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-4 h-4 mr-2" />
                        {t.confirm[lang]}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
