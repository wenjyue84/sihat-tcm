
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useLanguage } from '@/stores/useAppStore'

interface ChatHeaderProps {
    doctorInfo: any
    isMaximized: boolean
    onToggleMaximize: () => void
}

export function ChatHeader({ doctorInfo, isMaximized, onToggleMaximize }: ChatHeaderProps) {
    const { t, language } = useLanguage()

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3 md:pb-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-semibold text-emerald-800">{t.inquiry.title}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}>
                        {doctorInfo.icon} {language === 'zh' ? doctorInfo.nameZh : doctorInfo.name}
                    </span>
                </div>
                <p className="text-stone-600 text-xs md:text-sm">{t.inquiry.chatDescription}</p>
            </div>
            <div className="flex gap-2 items-center absolute right-4 top-4 md:static">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleMaximize}
                    className="h-8 w-8 p-0 md:h-10 md:w-10"
                    title={isMaximized ? "Minimize" : "Maximize"}
                >
                    {isMaximized ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>
            </div>
        </div>
    )
}

export function MasterAnalysisBanner({ doctorInfo }: { doctorInfo: any }) {
    const { language } = useLanguage()

    if (doctorInfo.id !== 'master') return null

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-sm text-amber-800">
            <span className="text-xl">⏳</span>
            <div>
                <p className="font-medium">{language === 'zh' ? '大师级别分析' : language === 'ms' ? 'Analisis Tahap Pakar' : 'Master Level Analysis'}</p>
                <p className="text-amber-700/80 text-xs mt-0.5">
                    {language === 'zh'
                        ? '大师级医师会进行深度推理和分析。回复可能需要较长时间，因为需要考虑多种中医理论。'
                        : language === 'ms'
                            ? 'Pakar melakukan penaakulan dan analisis mendalam. Respons mungkin mengambil sedikit masa.'
                            : 'The Master physician performs deep reasoning and analysis. Responses may take slightly longer to generate.'}
                </p>
            </div>
        </div>
    )
}
