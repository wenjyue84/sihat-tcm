'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, ArrowLeft, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { FileData } from './UploadReportsStep'

interface InquirySummaryStepProps {
    onComplete: (summary: string) => void
    onBack: () => void
    data: {
        chatHistory: any[]
        reportFiles: FileData[]
        medicineFiles: FileData[]
        basicInfo: any
    }
}

export function InquirySummaryStep({ onComplete, onBack, data }: InquirySummaryStepProps) {
    const { t, language } = useLanguage()
    const [summary, setSummary] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const generateSummary = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/summarize-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatHistory: data.chatHistory,
                    reportFiles: data.reportFiles,
                    medicineFiles: data.medicineFiles,
                    basicInfo: data.basicInfo,
                    language
                })
            })

            if (!response.ok) throw new Error('Failed to generate summary')

            const result = await response.json()
            setSummary(result.summary)
        } catch (err) {
            console.error('Error generating summary:', err)
            setError('Failed to generate summary. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        generateSummary()
    }, [])

    const lang = language as 'en' | 'zh' | 'ms'

    const content = {
        title: {
            en: 'Review Inquiry Summary',
            zh: '审核问诊总结',
            ms: 'Semak Ringkasan Siasatan'
        },
        description: {
            en: 'Please review the summary of your inquiry below. You can edit it to add missing details or correct any mistakes before we proceed to the next step.',
            zh: '请审核下方的问诊总结。您可以编辑它以补充遗漏的细节或更正任何错误，然后再继续下一步。',
            ms: 'Sila semak ringkasan siasatan anda di bawah. Anda boleh mengeditnya untuk menambah butiran yang hilang atau membetulkan sebarang kesilapan sebelum kami meneruskan ke langkah seterusnya.'
        },
        loading: {
            en: 'Generating summary from your consultation...',
            zh: '正在根据您的问诊生成总结...',
            ms: 'Sedang menjana ringkasan daripada konsultasi anda...'
        },
        confirmBtn: {
            en: 'Confirm & Continue',
            zh: '确认并继续',
            ms: 'Sahkan & Teruskan'
        },
        retryBtn: {
            en: 'Retry',
            zh: '重试',
            ms: 'Cuba Lagi'
        },
        backBtn: {
            en: 'Back to Chat',
            zh: '返回聊天',
            ms: 'Kembali ke Sembang'
        }
    }

    return (
        <Card className="p-6 min-h-[500px] flex flex-col">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-emerald-800 mb-2">{content.title[lang]}</h2>
                <p className="text-stone-600">{content.description[lang]}</p>
            </div>

            <div className="flex-1 flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        <p className="text-stone-500 animate-pulse">{content.loading[lang]}</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-red-500">
                        <p>{error}</p>
                        <Button onClick={generateSummary} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {content.retryBtn[lang]}
                        </Button>
                    </div>
                ) : (
                    <Textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="flex-1 min-h-[300px] text-base p-4 leading-relaxed bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                )}
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-stone-100">
                <Button variant="outline" onClick={onBack} className="text-stone-600">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {content.backBtn[lang]}
                </Button>
                <Button
                    onClick={() => onComplete(summary)}
                    className="bg-emerald-800 hover:bg-emerald-900"
                    disabled={isLoading || !summary.trim()}
                >
                    <Check className="w-4 h-4 mr-2" />
                    {content.confirmBtn[lang]}
                </Button>
            </div>
        </Card>
    )
}
