
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/stores/useAppStore'

interface VoiceDisclaimerModalProps {
    isOpen: boolean
    onAccept: () => void
    onClose: () => void
}

export function VoiceDisclaimerModal({ isOpen, onAccept, onClose }: VoiceDisclaimerModalProps) {
    const { language } = useLanguage()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-stone-800">
                            {language === 'zh' ? '语音输入 (原型版)' : language === 'ms' ? 'Input Suara (Prototaip)' : 'Voice Input (Prototype)'}
                        </h3>
                        <p className="text-sm text-stone-500">
                            {language === 'zh' ? '实验性功能' : language === 'ms' ? 'Ciri Eksperimen' : 'Experimental Feature'}
                        </p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800 leading-relaxed">
                        {language === 'zh'
                            ? '此语音识别功能目前处于原型阶段，识别准确率可能不高。建议在使用后检查并修正识别结果。未来版本将采用更先进的语音技术以提供更好的体验。'
                            : language === 'ms'
                                ? 'Ciri pengecaman suara ini masih dalam fasa prototaip dan ketepatannya mungkin tidak tinggi. Sila semak dan betulkan hasil selepas menggunakan. Versi akan datang akan menggunakan teknologi suara yang lebih maju.'
                                : 'This voice recognition feature is currently in prototype stage and accuracy may be limited. Please review and correct the results after use. Future versions will use more advanced speech technology for better accuracy.'}
                    </p>
                </div>

                <ul className="text-sm text-stone-600 space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        {language === 'zh' ? '支持中文、英语和马来语' : language === 'ms' ? 'Menyokong Mandarin, Inggeris dan Melayu' : 'Supports Chinese, English and Malay'}
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        {language === 'zh' ? '点击麦克风开始，再次点击停止' : language === 'ms' ? 'Ketik mikrofon untuk mula, ketik lagi untuk berhenti' : 'Tap mic to start, tap again to stop'}
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-amber-500">⚠</span>
                        {language === 'zh' ? '需要Chrome或Edge浏览器' : language === 'ms' ? 'Memerlukan pelayar Chrome atau Edge' : 'Requires Chrome or Edge browser'}
                    </li>
                </ul>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {language === 'zh' ? '取消' : language === 'ms' ? 'Batal' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={onAccept}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {language === 'zh' ? '我知道了，开始' : language === 'ms' ? 'Saya faham, mula' : 'I Understand, Start'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
