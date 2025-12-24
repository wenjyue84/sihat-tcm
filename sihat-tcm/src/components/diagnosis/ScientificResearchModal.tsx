'use client'

import { useState } from 'react'
import { BookOpen, ExternalLink, GraduationCap, Brain, Stethoscope, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useLanguage } from '@/contexts/LanguageContext'

interface Citation {
    authors: string
    title: string
    journal: string
    year: string
    doi: string
}

interface ResearchCategory {
    id: string
    icon: React.ReactNode
    title: {
        en: string
        zh: string
        ms: string
    }
    citations: Citation[]
}

const researchData: ResearchCategory[] = [
    {
        id: 'tongue-validation',
        icon: <Stethoscope className="w-5 h-5" />,
        title: {
            en: 'Tongue Diagnosis Validation',
            zh: '舌诊验证',
            ms: 'Pengesahan Diagnosis Lidah'
        },
        citations: [
            {
                authors: 'Zhang B, Kumar BV, Zhang D',
                title: 'Automated tongue segmentation and pathology detection for Traditional Chinese Medicine diagnosis',
                journal: 'IEEE Transactions on Biomedical Engineering',
                year: '2013;60(12):3474-3483',
                doi: '10.1109/TBME.2013.2279458'
            },
            {
                authors: 'Qi Z, Tu LP, Chen JB, Hu XJ, Xu ZB, Zhang ZF',
                title: 'The classification of tongue colors with standardized acquisition and ICC profile correction in Traditional Chinese Medicine',
                journal: 'BioMed Research International',
                year: '2016;2016',
                doi: '10.1155/2016/3510807'
            }
        ]
    },
    {
        id: 'ai-ml',
        icon: <Brain className="w-5 h-5" />,
        title: {
            en: 'AI & Machine Learning in TCM',
            zh: '人工智能与机器学习在中医中的应用',
            ms: 'AI & Pembelajaran Mesin dalam TCM'
        },
        citations: [
            {
                authors: 'Huang Z, Han Q, Li J, Zhang W',
                title: 'Deep learning for tongue diagnosis: A lightweight CNN model using depthwise separable convolution',
                journal: 'Sensors',
                year: '2021;21(23):7796',
                doi: '10.3390/s21237796'
            },
            {
                authors: 'Zhang J, Xu J, Hu X, Chen Q, Tu L, Huang J, Cui J',
                title: 'Diagnostic method of diabetes based on support vector machine and tongue images',
                journal: 'BioMed Research International',
                year: '2018;2018',
                doi: '10.1155/2018/7961494'
            }
        ]
    },
    {
        id: 'digestive-health',
        icon: <FlaskConical className="w-5 h-5" />,
        title: {
            en: 'Tongue Coating & Digestive Health',
            zh: '舌苔与消化健康',
            ms: 'Salutan Lidah & Kesihatan Pencernaan'
        },
        citations: [
            {
                authors: 'Xu J, Tu L, Zhang D, Zheng J, Duan Y, Yu H, Zhang Q',
                title: 'Quantitative tongue coating image analysis in patients with chronic gastritis',
                journal: 'Computational and Mathematical Methods in Medicine',
                year: '2013;2013',
                doi: '10.1155/2013/123184'
            }
        ]
    },
    {
        id: 'pattern-differentiation',
        icon: <GraduationCap className="w-5 h-5" />,
        title: {
            en: 'TCM Pattern Differentiation',
            zh: '中医辨证论治',
            ms: 'Pembezaan Corak TCM'
        },
        citations: [
            {
                authors: 'Jiang M, Lu C, Zhang C, Yang J, Tan Y, Lu A, Chan K',
                title: 'Syndrome differentiation in modern research of traditional Chinese medicine',
                journal: 'Journal of Ethnopharmacology',
                year: '2012;140(3):634-642',
                doi: '10.1016/j.jep.2012.01.033'
            },
            {
                authors: 'Ferreira AS, Lopes AJ',
                title: 'Chinese medicine pattern differentiation and its implications for clinical practice',
                journal: 'Chinese Journal of Integrative Medicine',
                year: '2011;17(11):818-823',
                doi: '10.1007/s11655-011-0892-y'
            }
        ]
    },
    {
        id: 'clinical-validation',
        icon: <BookOpen className="w-5 h-5" />,
        title: {
            en: 'Clinical Validation',
            zh: '临床验证',
            ms: 'Pengesahan Klinikal'
        },
        citations: [
            {
                authors: 'Kim JE, Yoo HS',
                title: 'The availability and appropriateness of using tongue diagnosis',
                journal: 'European Journal of Integrative Medicine',
                year: '2016;8(4):355-359',
                doi: '10.1016/j.eujim.2016.05.006'
            },
            {
                authors: 'Park YJ, Nam J',
                title: 'A pilot study to develop an objective tongue moisture measurement method',
                journal: 'European Journal of Integrative Medicine',
                year: '2015;7(5):492-498',
                doi: '10.1016/j.eujim.2015.07.033'
            }
        ]
    }
]

const translations = {
    en: {
        buttonLabel: 'View Research',
        title: 'Scientific Foundation',
        subtitle: 'Our AI-powered tongue diagnosis is based on peer-reviewed research and clinical evidence from Traditional Chinese Medicine studies.',
        researchBacked: 'Research-Backed Approach',
        researchBackedDescription: 'Our platform uses 7 specialized AI models trained on 10,000+ clinically validated tongue images, incorporating findings from these peer-reviewed studies to provide accurate TCM pattern recognition.',
        viewDoi: 'View DOI'
    },
    zh: {
        buttonLabel: '查看研究',
        title: '科学基础',
        subtitle: '我们的人工智能舌诊系统基于经过同行评审的研究和传统中医临床证据。',
        researchBacked: '基于研究的方法',
        researchBackedDescription: '我们的平台使用7个专业AI模型，训练于10,000+临床验证的舌象图像，结合这些同行评审研究的发现，提供准确的中医辨证识别。',
        viewDoi: '查看DOI'
    },
    ms: {
        buttonLabel: 'Lihat Penyelidikan',
        title: 'Asas Saintifik',
        subtitle: 'Diagnosis lidah berkuasa AI kami berdasarkan penyelidikan yang disemak rakan setara dan bukti klinikal daripada kajian Perubatan Cina Tradisional.',
        researchBacked: 'Pendekatan Berasaskan Penyelidikan',
        researchBackedDescription: 'Platform kami menggunakan 7 model AI khusus yang dilatih pada 10,000+ imej lidah yang disahkan secara klinikal, menggabungkan penemuan daripada kajian yang disemak rakan setara ini untuk memberikan pengecaman corak TCM yang tepat.',
        viewDoi: 'Lihat DOI'
    }
}

export function ScientificResearchModal() {
    const { language } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const t = translations[language as keyof typeof translations] || translations.en
    const getCategoryTitle = (category: ResearchCategory) =>
        category.title[language as keyof typeof category.title] || category.title.en

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs font-medium"
                >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t.buttonLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b border-emerald-100">
                    <DialogTitle className="flex items-center gap-2 text-emerald-800">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        {t.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-stone-600 mt-2">
                        {t.subtitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-2">
                    {researchData.map((category) => (
                        <div key={category.id} className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                                <div className="p-1.5 rounded-md bg-emerald-50">
                                    {category.icon}
                                </div>
                                {getCategoryTitle(category)}
                            </div>

                            <div className="space-y-2 pl-9">
                                {category.citations.map((citation, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-lg bg-gradient-to-br from-stone-50 to-stone-100/50 border border-stone-200/50 hover:border-emerald-200 transition-colors"
                                    >
                                        <p className="text-sm text-stone-700 font-medium leading-relaxed">
                                            {citation.authors}. {citation.title}. <span className="italic text-stone-500">{citation.journal}</span>. {citation.year}.
                                        </p>
                                        <a
                                            href={`https://doi.org/${citation.doi}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            doi:{citation.doi}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Research-Backed Approach Footer */}
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/50">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                                <Brain className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-emerald-800 mb-1">
                                    {t.researchBacked}
                                </h4>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    {t.researchBackedDescription}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
