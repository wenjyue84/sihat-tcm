'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, ArrowLeft, RefreshCw, AlertCircle, Clock, Wifi, FileText, Sparkles, CheckCircle2, Info, SkipForward } from 'lucide-react'
import { ModelCapabilitiesCarousel } from './ModelCapabilitiesCarousel'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDoctorLevel } from '@/contexts/DoctorContext'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'
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

interface ErrorState {
    title: string
    message: string
    guide: string
    step: string
    duration: number
}

type ProgressStep = 'connecting' | 'analyzing' | 'generating' | 'complete' | 'error'

const PROGRESS_STEPS = {
    connecting: { en: 'Connecting to AI service...', zh: '连接AI服务...', ms: 'Menyambung ke perkhidmatan AI...' },
    analyzing: { en: 'Analyzing inquiry data...', zh: '分析问诊数据...', ms: 'Menganalisis data pertanyaan...' },
    generating: { en: 'Generating summary...', zh: '生成总结...', ms: 'Menjana ringkasan...' },
    complete: { en: 'Processing complete', zh: '处理完成', ms: 'Pemprosesan selesai' },
    error: { en: 'Error occurred', zh: '发生错误', ms: 'Ralat berlaku' }
}

export function InquirySummaryStep({ onComplete, onBack, data }: InquirySummaryStepProps) {
    const { language } = useLanguage()
    const { getDoctorInfo } = useDoctorLevel()
    const { setNavigationState } = useDiagnosisProgress()
    const doctorInfo = getDoctorInfo()
    const [summary, setSummary] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<ErrorState | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [progressStep, setProgressStep] = useState<ProgressStep>('connecting')
    const [showReviewPrompt, setShowReviewPrompt] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const startTimeRef = useRef<number>(0)
    const abortControllerRef = useRef<AbortController | null>(null)
    const hasUserEditedRef = useRef(false)

    // Refs for stable callbacks
    const onCompleteRef = useRef(onComplete)
    const onBackRef = useRef(onBack)

    // Keep refs updated
    useEffect(() => {
        onCompleteRef.current = onComplete
        onBackRef.current = onBack
    }, [onComplete, onBack])

    const startTimer = () => {
        startTimeRef.current = Date.now()
        setElapsedTime(0)
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 100)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const generateSummary = async () => {
        // Cancel any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new controller
        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoading(true)
        setError(null)
        setProgressStep('connecting')
        startTimer()

        try {
            // Simulate step progression for better UX
            setTimeout(() => setProgressStep('analyzing'), 500)
            setTimeout(() => setProgressStep('generating'), 1500)

            const response = await fetch('/api/summarize-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatHistory: data.chatHistory,
                    reportFiles: data.reportFiles,
                    medicineFiles: data.medicineFiles,
                    basicInfo: data.basicInfo,
                    language,
                    // Model is determined by doctor level from DoctorContext
                    // gemini-1.5-flash is deprecated - now uses gemini-3-pro-preview/gemini-2.5-pro/gemini-2.0-flash
                    model: doctorInfo.model
                }),
                signal: controller.signal
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(JSON.stringify(errorData))
            }

            const result = await response.json()
            stopTimer()
            setProgressStep('complete')

            // Only update summary if user hasn't edited manually
            if (!hasUserEditedRef.current) {
                setSummary(result.summary)
            }
        } catch (err: any) {
            // Check if this was an abort from unmount (check if component is still mounted/valid context)
            if (err.name === 'AbortError') {
                return
            }

            console.error('Error generating summary:', err)
            stopTimer()

            // If user has skipped/edited, we suppress the error UI to keep them in manual entry mode
            if (hasUserEditedRef.current || !isLoading) {
                // Even if we don't show error, we should probably stop loading if it was still true (but here check ensures safety)
                // If !isLoading, user is already editing or done.
                return
            }

            setProgressStep('error')

            let errorData = { code: 'UNKNOWN', error: 'Unknown error', step: 'unknown', duration: elapsedTime * 1000 }
            try {
                errorData = JSON.parse(err.message)
            } catch {
                // If not JSON, use default
            }

            const failedStep = errorData.step || 'generation'
            const failedDuration = errorData.duration || (elapsedTime * 1000)

            if (errorData.code === 'NO_HISTORY') {
                setError({
                    title: language === 'zh' ? '无法生成总结' : 'Unable to Generate Summary',
                    message: language === 'zh' ? '未找到问诊记录。' : 'No consultation history found.',
                    guide: language === 'zh'
                        ? '请返回聊天界面，确保您已经与医生进行了对话。'
                        : 'Please go back to the chat and ensure you have had a conversation with the doctor.',
                    step: 'validation',
                    duration: failedDuration
                })
            } else {
                // Map step to user-friendly message
                const stepMessages: Record<string, { en: string; zh: string }> = {
                    connection: { en: 'connecting to AI service', zh: '连接AI服务' },
                    timeout: { en: 'waiting for response', zh: '等待响应' },
                    rate_limit: { en: 'AI service is busy', zh: 'AI服务繁忙' },
                    generation: { en: 'generating summary', zh: '生成总结' },
                    unknown: { en: 'processing', zh: '处理' }
                }

                const stepMessage = stepMessages[failedStep] || stepMessages.unknown

                setError({
                    title: language === 'zh' ? '生成总结失败' : 'Failed to Generate Summary',
                    message: language === 'zh'
                        ? `在"${stepMessage.zh}"步骤失败 (${(failedDuration / 1000).toFixed(1)}秒后)`
                        : `Failed at "${stepMessage.en}" step (after ${(failedDuration / 1000).toFixed(1)}s)`,
                    guide: language === 'zh'
                        ? '请点击下方的"重试"按钮。如果问题持续存在，您可以手动填写总结。'
                        : 'Please click the "Retry" button below. If the problem persists, you can manually fill in the summary.',
                    step: failedStep,
                    duration: failedDuration
                })
            }
        }
        finally {
            // Only update loading state if this is still the active controller
            if (abortControllerRef.current === controller) {
                setIsLoading(false)
            }
        }
    }

    useEffect(() => {
        generateSummary()
        return () => {
            stopTimer()
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const handleSkip = () => {
        // Do NOT abort the controller - let it run in background
        // if (abortControllerRef.current) {
        //     abortControllerRef.current.abort()
        // }

        stopTimer()
        setIsLoading(false)
        // Ensure summary is empty so user can type (if it was empty)
        if (!summary) setSummary('')
    }

    // Handler for mobile bottom nav "Next" press
    const handleMobileNext = useCallback(() => {
        // Directly proceed to next step with the summary
        if (summary.trim()) {
            onCompleteRef.current(summary)
        }
    }, [summary])

    // Handler for back button
    const handleBack = useCallback(() => {
        onBackRef.current()
    }, [])

    // Sync with global navigation state
    useEffect(() => {
        setNavigationState({
            onNext: handleMobileNext,
            onBack: handleBack,
            onSkip: undefined,
            showNext: true,
            showBack: true,
            showSkip: false,
            canNext: !isLoading && !!summary.trim()
        })
    }, [isLoading, summary, handleMobileNext, handleBack, setNavigationState])

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
        },
        guideTitle: {
            en: 'What to do next:',
            zh: '接下来的步骤：',
            ms: 'Apa yang perlu dilakukan seterusnya:'
        },
        timer: {
            en: 'Elapsed time',
            zh: '已用时间',
            ms: 'Masa berlalu'
        },
        reviewPrompt: {
            title: {
                en: 'Review Before Continuing',
                zh: '继续前请审核',
                ms: 'Semak Sebelum Meneruskan'
            },
            message: {
                en: 'Please review the inquiry summary above, then click the "Confirm & Continue" button when you are ready to proceed.',
                zh: '请审核上方的问诊总结，准备好后点击"确认并继续"按钮。',
                ms: 'Sila semak ringkasan siasatan di atas, kemudian klik butang "Sahkan & Teruskan" apabila anda sedia untuk meneruskan.'
            },
            gotIt: {
                en: 'Got It',
                zh: '知道了',
                ms: 'Faham'
            }
        },
        skipBtn: {
            en: 'Skip Generation',
            zh: '手动填写',
            ms: 'Langkau Penjanaan'
        }
    }

    const renderProgressIndicator = () => {
        const steps: { key: ProgressStep; icon: typeof Wifi }[] = [
            { key: 'connecting', icon: Wifi },
            { key: 'analyzing', icon: FileText },
            { key: 'generating', icon: Sparkles },
        ]

        const currentIndex = steps.findIndex(s => s.key === progressStep)

        // Short labels for mobile
        const MOBILE_STEPS = {
            connecting: { en: 'Connect', zh: '连接', ms: 'Sambung' },
            analyzing: { en: 'Analyze', zh: '分析', ms: 'Analisis' },
            generating: { en: 'Generate', zh: '生成', ms: 'Hasilkan' },
            complete: { en: 'Done', zh: '完成', ms: 'Selesai' },
            error: { en: 'Error', zh: '错误', ms: 'Ralat' }
        }

        return (
            <div className="w-full max-w-xs sm:max-w-md mx-auto mb-4 sm:mb-6">
                {/* Timer display */}
                <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 text-emerald-700">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="font-mono text-base sm:text-lg">{elapsedTime}s</span>
                </div>

                {/* Progress steps */}
                <div className="flex items-center justify-between relative">
                    {/* Progress line */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-200 -translate-y-1/2 -z-10" />
                    <div
                        className="absolute left-0 top-1/2 h-0.5 bg-emerald-500 -translate-y-1/2 -z-10 transition-all duration-500"
                        style={{ width: `${Math.max(0, currentIndex) * 50}%` }}
                    />

                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = progressStep === step.key
                        const isComplete = currentIndex > index || progressStep === 'complete'

                        return (
                            <div key={step.key} className="flex flex-col items-center gap-0.5 sm:gap-1">
                                <div className={`
                                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white' :
                                        isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                                            'bg-white border-stone-200 text-stone-400'}
                                `}>
                                    {isComplete ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                        isActive ? <Icon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" /> :
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </div>
                                {/* Show short labels on mobile, full labels on desktop */}
                                <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${isActive ? 'text-emerald-600' : 'text-stone-500'}`}>
                                    <span className="hidden sm:inline">{PROGRESS_STEPS[step.key][lang]}</span>
                                    <span className="sm:hidden">{MOBILE_STEPS[step.key][lang]}</span>
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Current step description - only show on larger screens */}
                <p className="hidden sm:block text-center text-sm text-stone-600 mt-4 animate-pulse">
                    {PROGRESS_STEPS[progressStep][lang]}
                </p>
            </div>
        )
    }

    return (
        <Card className="p-4 sm:p-6 min-h-[400px] sm:min-h-[500px] flex flex-col mb-20 md:mb-0">
            <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-800 mb-1 sm:mb-2">{content.title[lang]}</h2>
                <p className="text-sm sm:text-base text-stone-600">{content.description[lang]}</p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-2 w-full">
                        {renderProgressIndicator()}
                        <div className="w-full max-w-md">
                            <ModelCapabilitiesCarousel />
                        </div>

                        {/* Skip Button */}
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 mt-2"
                        >
                            <SkipForward className="w-4 h-4 mr-2" />
                            {content.skipBtn[lang]}
                        </Button>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col p-3 sm:p-6 bg-stone-50 rounded-lg border border-stone-200 overflow-auto">
                        <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 max-w-md mx-auto mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-stone-800">{error.title}</h3>
                            <p className="text-sm sm:text-base text-stone-600">{error.message}</p>

                            {/* Technical details for debugging */}
                            <div className="text-xs text-stone-400 bg-stone-100 px-2 sm:px-3 py-1 rounded-full">
                                {lang === 'zh' ? '步骤' : 'Step'}: {error.step} | {(error.duration / 1000).toFixed(1)}s
                            </div>

                            <div className="w-full bg-white p-3 sm:p-4 rounded border border-stone-100 mt-3 sm:mt-4 text-left">
                                <p className="text-xs sm:text-sm font-medium text-stone-700 mb-1">{content.guideTitle[lang]}</p>
                                <p className="text-xs sm:text-sm text-stone-600">{error.guide}</p>
                            </div>

                            <Button onClick={generateSummary} variant="outline" className="mt-3 sm:mt-4">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {content.retryBtn[lang]}
                            </Button>
                        </div>

                        {/* Manual entry section */}
                        <div className="flex-1 flex flex-col border-t border-stone-200 pt-3 sm:pt-4">
                            <p className="text-xs sm:text-sm text-stone-600 mb-2">
                                {lang === 'zh' ? '或者，您可以手动输入问诊总结后继续：' :
                                    lang === 'ms' ? 'Atau, anda boleh memasukkan ringkasan secara manual dan meneruskan:' :
                                        'Alternatively, you can manually enter a summary and continue:'}
                            </p>
                            <Textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder={lang === 'zh' ? '在此输入您的问诊总结...' :
                                    lang === 'ms' ? 'Masukkan ringkasan siasatan anda di sini...' :
                                        'Enter your inquiry summary here...'}
                                className="flex-1 min-h-[120px] sm:min-h-[150px] text-sm sm:text-base p-3 sm:p-4 leading-relaxed bg-white border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                        <Textarea
                            value={summary}
                            onChange={(e) => {
                                setSummary(e.target.value)
                                hasUserEditedRef.current = true
                            }}
                            className="flex-1 min-h-[200px] sm:min-h-[300px] text-sm sm:text-base p-3 sm:p-4 leading-relaxed bg-stone-50 border-0 focus:border-emerald-500 focus:ring-emerald-500 resize-none font-mono"
                            style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:pt-4 md:mt-6 md:border-t-stone-100 flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4">
                <Button variant="outline" onClick={onBack} className="text-stone-600 w-full sm:w-auto border-stone-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {content.backBtn[lang]}
                </Button>
                <Button
                    onClick={() => onComplete(summary)}
                    className="bg-emerald-800 hover:bg-emerald-900 w-full sm:w-auto"
                    disabled={isLoading || !summary.trim()}
                >
                    <Check className="w-4 h-4 mr-2" />
                    {content.confirmBtn[lang]}
                </Button>
            </div>

            {/* Review Prompt Modal - appears when user clicks Next on mobile bottom nav */}
            {showReviewPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm md:hidden">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                                <Info className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-stone-800">
                                    {content.reviewPrompt.title[lang]}
                                </h3>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    {content.reviewPrompt.message[lang]}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowReviewPrompt(false)}
                            className="w-full border-stone-300 text-stone-700 hover:bg-stone-50"
                        >
                            {content.reviewPrompt.gotIt[lang]}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowReviewPrompt(false)
                                onComplete(summary)
                            }}
                            className="w-full bg-emerald-700 hover:bg-emerald-800"
                        >
                            {content.confirmBtn[lang]}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}
