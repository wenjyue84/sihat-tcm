'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Pill, ArrowRight, SkipForward } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { TextReviewModal } from './TextReviewModal'
import { FileData } from './UploadReportsStep'

interface UploadMedicineStepProps {
    onComplete: (files: FileData[]) => void
    onSkip: () => void
    initialFiles?: FileData[]
    onBack: () => void
}

export function UploadMedicineStep({ onComplete, onSkip, initialFiles = [], onBack }: UploadMedicineStepProps) {
    const { t, language } = useLanguage()
    const [files, setFiles] = useState<FileData[]>(initialFiles)
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const [currentReviewFile, setCurrentReviewFile] = useState<File | null>(null)
    const [manualInput, setManualInput] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]

        if (file.size > 5 * 1024 * 1024) {
            alert(t.errors?.fileTooBig?.replace('{size}', '5') || 'File too big (max 5MB)')
            return
        }

        setCurrentReviewFile(file)
        setIsReviewModalOpen(true)
        e.target.value = '' // Reset input
    }

    const convertToBase64 = (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
    }

    const handleReviewConfirm = async (text: string, file: File) => {
        try {
            const base64 = await convertToBase64(file)
            setFiles(prev => [...prev, {
                name: file.name,
                type: file.type,
                data: base64,
                extractedText: text
            }])
        } catch (error) {
            console.error("Error processing file:", error)
        }
    }

    const handleManualAdd = () => {
        if (!manualInput.trim()) return

        setFiles(prev => [...prev, {
            name: language === 'zh' ? '手动输入' : language === 'ms' ? 'Input Manual' : 'Manual Entry',
            type: 'text/plain',
            data: '',
            extractedText: manualInput
        }])
        setManualInput('')
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const lang = language as 'en' | 'zh' | 'ms'

    const content = {
        title: {
            en: 'Upload Current Medicine',
            zh: '上传现有药物',
            ms: 'Muat Naik Ubat Semasa'
        },
        description: {
            en: 'If you are currently taking any medication (Western or TCM), please upload photos of the packaging or prescriptions. This helps the AI doctor understand your current treatment.',
            zh: '如果您目前正在服用任何药物（西药或中药），请上传包装或处方的照片。这有助于AI医生了解您目前的治疗情况。',
            ms: 'Jika anda sedang mengambil sebarang ubat (Barat atau TCM), sila muat naik foto pembungkusan atau preskripsi. Ini membantu doktor AI memahami rawatan semasa anda.'
        },
        uploadBtn: {
            en: 'Upload Medicine Photo',
            zh: '上传药物照片',
            ms: 'Muat Naik Foto Ubat'
        },
        manualInputLabel: {
            en: 'Or enter medicine names manually:',
            zh: '或手动输入药物名称：',
            ms: 'Atau masukkan nama ubat secara manual:'
        },
        manualInputPlaceholder: {
            en: 'e.g. Panadol, Metformin...',
            zh: '例如：必理痛，二甲双胍...',
            ms: 'cth. Panadol, Metformin...'
        },
        addManualBtn: {
            en: 'Add',
            zh: '添加',
            ms: 'Tambah'
        },
        nextBtn: {
            en: 'Start Consultation',
            zh: '开始问诊',
            ms: 'Mulakan Konsultasi'
        },
        skipBtn: {
            en: 'Skip',
            zh: '跳过',
            ms: 'Langkau'
        },
        backBtn: {
            en: 'Back',
            zh: '返回',
            ms: 'Kembali'
        },
        uploadedFiles: {
            en: 'Uploaded Medicine:',
            zh: '已上传药物：',
            ms: 'Ubat Dimuat Naik:'
        },
        fileTypes: {
            en: 'JPG, PNG, PDF, DOCX, TXT (Max 5MB)',
            zh: 'JPG, PNG, PDF, DOCX, TXT (最大 5MB)',
            ms: 'JPG, PNG, PDF, DOCX, TXT (Maks 5MB)'
        }
    }

    return (
        <Card className="p-6 min-h-[500px] flex flex-col">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-emerald-800 mb-2">{content.title[lang]}</h2>
                <p className="text-stone-600">{content.description[lang]}</p>
            </div>

            <div className="flex flex-col gap-6 mb-6">
                {/* File Upload Area */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Pill className="w-8 h-8" />
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700">
                            {content.uploadBtn[lang]}
                        </Button>
                        <p className="text-xs text-stone-400 mt-2">{content.fileTypes[lang]}</p>
                    </div>
                </div>

                {/* Manual Input Area */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        {content.manualInputLabel[lang]}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder={content.manualInputPlaceholder[lang]}
                            className="flex-1 h-10 px-3 rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                        />
                        <Button onClick={handleManualAdd} disabled={!manualInput.trim()} variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                            {content.addManualBtn[lang]}
                        </Button>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mb-6 flex-1">
                    <h3 className="text-sm font-medium text-stone-700 mb-3">{content.uploadedFiles[lang]}</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white border border-stone-200 p-3 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center flex-shrink-0">
                                        <Pill className="w-4 h-4 text-stone-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-stone-800 truncate">{file.name}</p>
                                        <p className="text-xs text-stone-500 truncate">{file.extractedText?.substring(0, 50)}...</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="text-stone-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-auto pt-4 border-t border-stone-100">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack} className="text-stone-600">
                        {content.backBtn[lang]}
                    </Button>
                    <Button variant="ghost" onClick={onSkip} className="text-stone-500 hover:text-stone-700">
                        {content.skipBtn[lang]} <SkipForward className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                <Button
                    onClick={() => onComplete(files)}
                    className="bg-emerald-800 hover:bg-emerald-900"
                    disabled={files.length === 0}
                >
                    {content.nextBtn[lang]} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt,.md"
                onChange={handleFileChange}
            />

            <TextReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onConfirm={handleReviewConfirm}
                file={currentReviewFile}
                mode="medicine"
            />
        </Card>
    )
}
