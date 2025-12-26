'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, X, Lock, Check, Info } from 'lucide-react'
import { useLanguage } from '@/stores/useAppStore'

interface ShowPromptButtonProps {
    promptType: 'chat' | 'image' | 'final' | 'audio'
}

export function ShowPromptButton({ promptType }: ShowPromptButtonProps) {
    const { language } = useLanguage()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const translations = {
        en: {
            showPrompt: 'Show Prompt',
            loginAsAdmin: 'Login as Admin',
            developmentMessage: 'As it is in development phase, you can click Login to view the system prompt. In future you will need to enter admin password to view.',
            login: 'Login',
            cancel: 'Cancel',
            close: 'Close',
            systemPrompt: 'System Prompt',
            promptTypeLabels: {
                chat: 'Interactive Chat Prompt (问诊)',
                image: 'Image Analysis Prompt (望诊)',
                final: 'Final Analysis Prompt (综合诊断)',
                audio: 'Audio Analysis Prompt (聞诊)'
            }
        },
        zh: {
            showPrompt: '查看提示词',
            loginAsAdmin: '管理员登录',
            developmentMessage: '目前为开发阶段，您可以直接点击登录查看系统提示词。正式版本需要输入管理员密码才能查看。',
            login: '登录',
            cancel: '取消',
            close: '关闭',
            systemPrompt: '系统提示词',
            promptTypeLabels: {
                chat: '问诊交互提示词',
                image: '望诊图像分析提示词',
                final: '综合诊断提示词',
                audio: '聞诊音频分析提示词'
            }
        },
        ms: {
            showPrompt: 'Lihat Arahan',
            loginAsAdmin: 'Log Masuk sebagai Pentadbir',
            developmentMessage: 'Memandangkan ini adalah fasa pembangunan, anda boleh klik Log Masuk untuk melihat arahan sistem. Pada masa hadapan anda perlu memasukkan kata laluan pentadbir untuk melihat.',
            login: 'Log Masuk',
            cancel: 'Batal',
            close: 'Tutup',
            systemPrompt: 'Arahan Sistem',
            promptTypeLabels: {
                chat: 'Arahan Pertanyaan Interaktif (问诊)',
                image: 'Arahan Analisis Imej (望诊)',
                final: 'Arahan Analisis Akhir (综合诊断)',
                audio: 'Arahan Analisis Audio (聞诊)'
            }
        }
    }

    const t = translations[language as keyof typeof translations] || translations.en

    const handleButtonClick = () => {
        setIsModalOpen(true)
        if (isAuthenticated) {
            loadPrompt()
        }
    }

    const loadPrompt = async () => {
        setIsLoading(true)
        try {
            // Dynamic import of systemPrompts
            const { INTERACTIVE_CHAT_PROMPT, TONGUE_ANALYSIS_PROMPT, FACE_ANALYSIS_PROMPT, BODY_ANALYSIS_PROMPT, LISTENING_ANALYSIS_PROMPT, FINAL_ANALYSIS_PROMPT } = await import('@/lib/systemPrompts')

            let selectedPrompt = ''
            switch (promptType) {
                case 'chat':
                    selectedPrompt = INTERACTIVE_CHAT_PROMPT
                    break
                case 'image':
                    selectedPrompt = `--- TONGUE ANALYSIS PROMPT ---\n${TONGUE_ANALYSIS_PROMPT}\n\n--- FACE ANALYSIS PROMPT ---\n${FACE_ANALYSIS_PROMPT}\n\n--- BODY ANALYSIS PROMPT ---\n${BODY_ANALYSIS_PROMPT}`
                    break
                case 'final':
                    selectedPrompt = FINAL_ANALYSIS_PROMPT
                    break
                case 'audio':
                    // Audio/Listening analysis has its own dedicated prompt
                    selectedPrompt = LISTENING_ANALYSIS_PROMPT
                    break
                default:
                    selectedPrompt = INTERACTIVE_CHAT_PROMPT
            }
            setPrompt(selectedPrompt)
        } catch (err) {
            console.error('Failed to load prompt:', err)
            setPrompt('Error loading prompt. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = () => {
        // In development mode, allow login without password
        setIsAuthenticated(true)
        loadPrompt()
    }

    const handleClose = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleButtonClick}
                className="h-7 w-7 sm:h-10 sm:w-auto p-0 sm:px-4 text-sm gap-2 text-purple-500 hover:bg-purple-50 hover:text-purple-700 sm:border sm:border-purple-200"
                title={t.showPrompt}
            >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.showPrompt}</span>
            </Button>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                {isAuthenticated ? (
                                    <Eye className="w-5 h-5 text-purple-600" />
                                ) : (
                                    <Lock className="w-5 h-5 text-amber-600" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {isAuthenticated ? t.promptTypeLabels[promptType] : t.loginAsAdmin}
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {!isAuthenticated ? (
                                // Development Notice
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-amber-800 text-sm leading-relaxed">
                                            {t.developmentMessage}
                                        </p>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                // Loading State
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            ) : (
                                // Prompt Display
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                                        <Check className="w-4 h-4" />
                                        <span>{t.systemPrompt}: {t.promptTypeLabels[promptType]}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                            {prompt}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                            {!isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleClose}
                                    >
                                        {t.cancel}
                                    </Button>
                                    <Button
                                        onClick={handleLogin}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {t.login}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleClose}
                                    className="bg-gray-600 hover:bg-gray-700"
                                >
                                    {t.close}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
