'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Download, Share2, Save, Loader2, ImageIcon, BadgeCheck, Check, X, UserPlus, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ReportActionsProps {
    onChatOpen: () => void
    onDownloadPDF: () => void
    onShare: () => void
    onSave: () => void
    onRestart: () => void
    onInfographicsOpen: () => void
    onRequestVerification: () => void
    isSaving: boolean
    hasSaved: boolean
    language: string
    variants: any
}

// Translations for the guest dialog
const guestDialogTranslations = {
    en: {
        title: 'Create an Account?',
        message: 'Would you like to create an account to save your diagnosis history and access it anytime?',
        loginSignup: 'Login / Sign Up',
        continueWithout: 'Continue Without Account',
        benefits: 'Benefits of having an account:',
        benefit1: 'Save and access your diagnosis history',
        benefit2: 'Track your health progress over time',
        benefit3: 'Get personalized recommendations'
    },
    zh: {
        title: '创建账户？',
        message: '您是否要创建账户以保存诊断历史记录，随时访问？',
        loginSignup: '登录 / 注册',
        continueWithout: '无需账户继续',
        benefits: '拥有账户的好处：',
        benefit1: '保存并访问您的诊断历史',
        benefit2: '随时追踪健康进展',
        benefit3: '获取个性化建议'
    },
    ms: {
        title: 'Buat Akaun?',
        message: 'Adakah anda ingin membuat akaun untuk menyimpan sejarah diagnosis anda dan mengaksesnya bila-bila masa?',
        loginSignup: 'Log Masuk / Daftar',
        continueWithout: 'Teruskan Tanpa Akaun',
        benefits: 'Manfaat mempunyai akaun:',
        benefit1: 'Simpan dan akses sejarah diagnosis anda',
        benefit2: 'Jejak kemajuan kesihatan anda dari masa ke masa',
        benefit3: 'Dapatkan cadangan yang diperibadikan'
    }
}

export function ReportActions({
    onChatOpen,
    onDownloadPDF,
    onShare,
    onSave,
    onRestart,
    onInfographicsOpen,
    onRequestVerification,
    isSaving,
    hasSaved,
    language,
    variants
}: ReportActionsProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [showGuestDialog, setShowGuestDialog] = useState(false)

    const dialogT = guestDialogTranslations[language as keyof typeof guestDialogTranslations] || guestDialogTranslations.en

    const handleStartNewConsultation = () => {
        // If user is logged in, proceed directly
        if (user) {
            onRestart()
            return
        }

        // If guest, show the dialog
        setShowGuestDialog(true)
    }

    const handleLoginSignup = () => {
        setShowGuestDialog(false)
        router.push('/patient')
    }

    const handleCloseDialog = () => {
        setShowGuestDialog(false)
        router.push('/patient')
    }

    const handleContinueWithoutAccount = () => {
        setShowGuestDialog(false)
        onRestart()
    }
    return (
        <motion.div variants={variants} className="w-full pt-6 md:pt-8">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Primary CTA - Chat Button */}
                <div className="flex justify-center">
                    <button
                        onClick={onChatOpen}
                        className="relative group px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white rounded-full shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 flex items-center justify-center gap-3 text-lg font-bold min-w-[280px] md:min-w-[320px] transform hover:-translate-y-1 ring-4 ring-emerald-100"
                    >
                        <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-transparent transition-colors" />
                        <MessageCircle className="h-6 w-6 animate-pulse" />
                        <span>Ask About Report</span>
                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                    </button>
                </div>

                {/* Action Groups */}
                <div className="space-y-4">
                    {/* Export & Share Group */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={onDownloadPDF}
                            className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </button>

                        <button
                            onClick={onShare}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>

                        <button
                            onClick={onInfographicsOpen}
                            className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center"
                        >
                            <ImageIcon className="h-4 w-4" />
                            Infographics
                        </button>
                    </div>

                    {/* Save & Verify Group */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={onSave}
                            disabled={isSaving || hasSaved}
                            className={`px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center ${hasSaved
                                ? 'bg-green-100 border border-green-200 text-green-700 cursor-default'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                                }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {language === 'zh' ? '保存中...' : language === 'ms' ? 'Menyimpan...' : 'Saving...'}
                                </>
                            ) : hasSaved ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    {language === 'zh' ? '已保存' : language === 'ms' ? 'Disimpan' : 'Saved'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {language === 'zh' ? '保存' : language === 'ms' ? 'Simpan' : 'Save'}
                                </>
                            )}
                        </button>

                        <button
                            onClick={onRequestVerification}
                            className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center"
                        >
                            <BadgeCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">Request Doctor Verification</span>
                            <span className="sm:hidden">Verify</span>
                        </button>
                    </div>

                    {/* Navigation Group */}
                    <div className="flex justify-center pt-2 border-t border-stone-200">
                        <button
                            onClick={handleStartNewConsultation}
                            className="px-6 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
                        >
                            <Home className="h-4 w-4" />
                            {language === 'zh' ? '返回首页' : language === 'ms' ? 'Kembali ke Laman Utama' : 'Return to Home'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Guest Login/Signup Dialog */}
            <AnimatePresence>
                {showGuestDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={handleCloseDialog}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white relative">
                                <button
                                    onClick={handleCloseDialog}
                                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <UserPlus className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-bold">{dialogT.title}</h2>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <p className="text-stone-600">{dialogT.message}</p>

                                {/* Benefits */}
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <p className="text-sm font-medium text-emerald-800 mb-2">{dialogT.benefits}</p>
                                    <ul className="space-y-2 text-sm text-emerald-700">
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                            {dialogT.benefit1}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                            {dialogT.benefit2}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                            {dialogT.benefit3}
                                        </li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleLoginSignup}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-5 w-5" />
                                        {dialogT.loginSignup}
                                    </button>
                                    <button
                                        onClick={handleContinueWithoutAccount}
                                        className="w-full py-3 px-4 bg-stone-100 text-stone-600 rounded-full font-medium hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Home className="h-5 w-5" />
                                        {dialogT.continueWithout}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
