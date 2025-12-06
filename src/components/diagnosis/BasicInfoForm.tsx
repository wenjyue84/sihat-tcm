'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useRef } from 'react'
import { User, Calendar as CalendarIcon, Scale, Ruler, Activity, Clock, FileText, Check, Sparkles, Stethoscope, Minus, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDoctorLevel, DOCTOR_LEVELS, DoctorLevel } from '@/contexts/DoctorContext'
import { useLanguage } from '@/contexts/LanguageContext'

// Mobile-friendly numeric input with slider and increment/decrement buttons
interface MobileNumericInputProps {
    id: string
    value: string
    onChange: (value: string) => void
    placeholder: string
    icon: React.ReactNode
    min: number
    max: number
    step?: number
    unit?: string
    quickValues?: number[]
    required?: boolean
}

function MobileNumericInput({
    id,
    value,
    onChange,
    placeholder,
    icon,
    min,
    max,
    step = 1,
    unit,
    quickValues,
    required = false
}: MobileNumericInputProps) {
    const [showSlider, setShowSlider] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)
    const numValue = parseFloat(value) || 0

    // Close slider when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sliderRef.current && !sliderRef.current.contains(e.target as Node)) {
                setShowSlider(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleIncrement = () => {
        const newValue = Math.min(max, numValue + step)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleDecrement = () => {
        const newValue = Math.max(min, numValue - step)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleQuickSelect = (val: number) => {
        onChange(step < 1 ? val.toFixed(1) : String(val))
        setShowSlider(false)
    }

    const percentage = ((numValue - min) / (max - min)) * 100

    return (
        <div className="relative" ref={sliderRef}>
            {/* Main input container */}
            <div className="flex items-stretch gap-1">
                {/* Decrement button */}
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={numValue <= min}
                    className="flex items-center justify-center w-11 h-12 rounded-l-lg border border-r-0 border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 active:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
                    aria-label="Decrease"
                >
                    <Minus className="w-4 h-4 text-stone-600" />
                </button>

                {/* Input field */}
                <div className="relative flex-1">
                    <div className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70 pointer-events-none">
                        {icon}
                    </div>
                    <Input
                        id={id}
                        type="number"
                        inputMode="decimal"
                        min={min}
                        max={max}
                        step={step}
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setShowSlider(true)}
                        placeholder={placeholder}
                        className="pl-10 pr-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 rounded-none text-center text-lg font-semibold text-stone-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required={required}
                    />
                    {unit && (
                        <span className="absolute right-3 top-3.5 text-stone-400 text-sm pointer-events-none">
                            {unit}
                        </span>
                    )}
                </div>

                {/* Increment button */}
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={numValue >= max}
                    className="flex items-center justify-center w-11 h-12 rounded-r-lg border border-l-0 border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 active:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
                    aria-label="Increase"
                >
                    <Plus className="w-4 h-4 text-stone-600" />
                </button>
            </div>

            {/* Expandable slider and quick selection panel */}
            {showSlider && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-2 p-4 bg-white border border-stone-200 rounded-xl shadow-lg z-20"
                >
                    {/* Slider */}
                    <div className="mb-4">
                        <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className="absolute h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={numValue || min}
                            onChange={handleSliderChange}
                            className="absolute top-0 left-0 right-0 w-full h-2 opacity-0 cursor-pointer"
                            style={{ marginTop: '0px' }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-stone-400">{min}{unit}</span>
                            <span className="text-sm font-semibold text-emerald-600">{value || '—'}{unit && value ? unit : ''}</span>
                            <span className="text-xs text-stone-400">{max}{unit}</span>
                        </div>
                    </div>

                    {/* Quick selection buttons */}
                    {quickValues && quickValues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {quickValues.map((qv) => (
                                <button
                                    key={qv}
                                    type="button"
                                    onClick={() => handleQuickSelect(qv)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[40px] ${numValue === qv
                                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-emerald-50 hover:border-emerald-200'
                                        }`}
                                >
                                    {qv}{unit}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}

export interface BasicInfoData {
    name: string
    age: string
    gender: string
    weight: string
    height: string
    symptoms: string
    symptomDuration: string
}

export function BasicInfoForm({ onComplete, initialData }: { onComplete: (data: BasicInfoData) => void, initialData?: BasicInfoData }) {
    const { doctorLevel, setDoctorLevel } = useDoctorLevel()
    const { t, language } = useLanguage()
    const [formData, setFormData] = useState<BasicInfoData>(initialData || {
        name: 'Anonymous',
        age: '',
        gender: '',
        weight: '',
        height: '',
        symptoms: '',
        symptomDuration: ''
    })



    // Symptom keys for translation
    const symptomKeys: Array<keyof typeof t.basicInfo.symptoms> = [
        'fever', 'cough', 'headache', 'fatigue',
        'stomachPain', 'soreThroat', 'shortnessOfBreath'
    ]

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
    const [errors, setErrors] = useState<string[]>([])

    // Load patient profile data from localStorage
    useEffect(() => {
        const savedProfileData = localStorage.getItem('patientProfileData')
        if (savedProfileData) {
            try {
                const profileData = JSON.parse(savedProfileData)
                setFormData(prev => ({
                    ...prev,
                    name: profileData.name ?? prev.name ?? '',
                    age: profileData.age ?? prev.age ?? '',
                    gender: profileData.gender ?? prev.gender ?? '',
                    weight: profileData.weight ?? prev.weight ?? '',
                    height: profileData.height ?? prev.height ?? '',
                }))
                localStorage.removeItem('patientProfileData')
            } catch (e) {
                console.error('Error loading profile data:', e)
            }
        }
    }, [])

    // Sync with initialData changes (e.g. when profile loads)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                name: initialData.name ?? prev.name ?? '',
                age: initialData.age ?? prev.age ?? '',
                gender: initialData.gender ?? prev.gender ?? '',
                weight: initialData.weight ?? prev.weight ?? '',
                height: initialData.height ?? prev.height ?? '',
                symptoms: initialData.symptoms ?? prev.symptoms ?? '',
                symptomDuration: initialData.symptomDuration ?? prev.symptomDuration ?? ''
            }))
        }
    }, [initialData])

    // Listen for test data fill event
    useEffect(() => {
        const handleFillTestData = () => {
            const testData: BasicInfoData = {
                name: 'John Doe',
                age: '35',
                gender: 'male',
                weight: '72',
                height: '175',
                symptoms: 'Headache, Fatigue, feeling tired and dizzy for the past week',
                symptomDuration: '1-2-weeks'
            }
            setFormData(testData)
            setSelectedSymptoms(['headache', 'fatigue'])
        }

        window.addEventListener('fill-test-data', handleFillTestData)
        return () => window.removeEventListener('fill-test-data', handleFillTestData)
    }, [])

    const handleSymptomClick = (symptomKey: string) => {
        let newSelection: string[]
        if (selectedSymptoms.includes(symptomKey)) {
            newSelection = selectedSymptoms.filter(s => s !== symptomKey)
        } else {
            newSelection = [...selectedSymptoms, symptomKey]
        }
        setSelectedSymptoms(newSelection)
        // Store translated symptom names
        const translatedSymptoms = newSelection.map(key =>
            t.basicInfo.symptoms[key as keyof typeof t.basicInfo.symptoms]
        )
        setFormData({ ...formData, symptoms: translatedSymptoms.join(', ') })
    }



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const missingFields: string[] = []
        if (!formData.name) missingFields.push('name')
        if (!formData.gender) missingFields.push('gender')
        if (!formData.age) missingFields.push('age')
        if (!formData.weight) missingFields.push('weight')
        if (!formData.height) missingFields.push('height')
        if (!formData.symptomDuration) missingFields.push('symptomDuration')

        if (missingFields.length > 0) {
            const fieldNames: Record<string, string> = {
                name: t.basicInfo.fullName,
                gender: t.basicInfo.gender,
                age: t.basicInfo.age,
                weight: t.basicInfo.weight,
                height: t.basicInfo.height,
                symptomDuration: t.basicInfo.duration
            }

            setErrors(missingFields.map(field => `${fieldNames[field]} ${t.errors?.requiredField || 'is required'}`))

            // Scroll to the first missing field
            const firstFieldId = missingFields[0]
            // Check for wrapper first (for Selects), then direct ID (for Inputs)
            const element = document.getElementById(`${firstFieldId}-wrapper`) || document.getElementById(firstFieldId)

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                // Try to focus if it's an input
                if (element.tagName === 'INPUT') {
                    element.focus()
                }
            }
            return
        }

        setErrors([])
        onComplete(formData)
    }

    // Get translated doctor level info
    const getDoctorLevelInfo = (level: DoctorLevel) => {
        const levelMap: Record<DoctorLevel, { name: string; description: string }> = {
            physician: { name: t.doctorLevels.physician.name, description: t.doctorLevels.physician.description },
            expert: { name: t.doctorLevels.seniorPhysician.name, description: t.doctorLevels.seniorPhysician.description },
            master: { name: t.doctorLevels.masterPhysician.name, description: t.doctorLevels.masterPhysician.description },
        }
        return levelMap[level]
    }

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">{t.basicInfo.title}</h2>
                </div>
                <p className="text-emerald-50 opacity-90">{t.basicInfo.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 pb-24 md:pb-6" noValidate>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-2 col-span-2 lg:col-span-1">
                        <Label htmlFor="name" className="text-stone-600 font-medium">{t.basicInfo.fullName}</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t.basicInfo.fullNamePlaceholder}
                                className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 text-stone-900"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 col-span-2 lg:col-span-1" id="gender-wrapper">
                        <Label htmlFor="gender" className="text-stone-600 font-medium">{t.basicInfo.gender}</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 h-4 w-4 text-emerald-600/70 z-10 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </div>
                            <Select
                                value={formData.gender}
                                onValueChange={(val) => setFormData({ ...formData, gender: val })}
                            >
                                <SelectTrigger id="gender" className="pl-10 h-12 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50 text-stone-900">
                                    <SelectValue placeholder={t.basicInfo.selectGender} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">{t.basicInfo.male}</SelectItem>
                                    <SelectItem value="female">{t.basicInfo.female}</SelectItem>
                                    <SelectItem value="other">{t.basicInfo.other}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age" className="text-stone-600 font-medium">{t.basicInfo.age}</Label>
                        <MobileNumericInput
                            id="age"
                            value={formData.age}
                            onChange={(val) => setFormData({ ...formData, age: val })}
                            placeholder={t.basicInfo.agePlaceholder}
                            icon={<CalendarIcon className="h-4 w-4" />}
                            min={1}
                            max={120}
                            step={1}
                            quickValues={[18, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weight" className="text-stone-600 font-medium">{t.basicInfo.weight}</Label>
                        <MobileNumericInput
                            id="weight"
                            value={formData.weight}
                            onChange={(val) => setFormData({ ...formData, weight: val })}
                            placeholder={t.basicInfo.weightPlaceholder}
                            icon={<Scale className="h-4 w-4" />}
                            min={20}
                            max={200}
                            step={1}
                            unit="kg"
                            quickValues={[45, 50, 55, 60, 65, 70, 75, 80, 85, 90]}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="height" className="text-stone-600 font-medium">{t.basicInfo.height}</Label>
                        <MobileNumericInput
                            id="height"
                            value={formData.height}
                            onChange={(val) => setFormData({ ...formData, height: val })}
                            placeholder={t.basicInfo.heightPlaceholder}
                            icon={<Ruler className="h-4 w-4" />}
                            min={100}
                            max={220}
                            step={1}
                            unit="cm"
                            quickValues={[150, 155, 160, 165, 170, 175, 180, 185, 190]}
                            required
                        />
                    </div>

                    <div className="space-y-2 relative z-10" id="symptomDuration-wrapper">
                        <Label htmlFor="symptomDuration" className="text-stone-600 font-medium">{t.basicInfo.duration}</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 h-4 w-4 text-emerald-600/70 z-10 pointer-events-none">
                                <Clock className="h-4 w-4" />
                            </div>
                            <Select
                                value={formData.symptomDuration}
                                onValueChange={(val) => setFormData({ ...formData, symptomDuration: val })}
                            >
                                <SelectTrigger id="symptomDuration" className="pl-10 h-12 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50 text-stone-900">
                                    <SelectValue placeholder={t.basicInfo.durationPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="less-than-1-day">{t.basicInfo.durationOptions.lessThan1Day}</SelectItem>
                                    <SelectItem value="1-3-days">{t.basicInfo.durationOptions['1-3days']}</SelectItem>
                                    <SelectItem value="4-7-days">{t.basicInfo.durationOptions['4-7days']}</SelectItem>
                                    <SelectItem value="1-2-weeks">{t.basicInfo.durationOptions['1-2weeks']}</SelectItem>
                                    <SelectItem value="2-4-weeks">{t.basicInfo.durationOptions['2-4weeks']}</SelectItem>
                                    <SelectItem value="1-3-months">{t.basicInfo.durationOptions['1-3months']}</SelectItem>
                                    <SelectItem value="3-6-months">{t.basicInfo.durationOptions['3-6months']}</SelectItem>
                                    <SelectItem value="6-12-months">{t.basicInfo.durationOptions['6-12months']}</SelectItem>
                                    <SelectItem value="over-1-year">{t.basicInfo.durationOptions.over1Year}</SelectItem>
                                    <SelectItem value="chronic">{t.basicInfo.durationOptions.chronic}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>



                <div className="space-y-3">
                    <Label className="text-stone-600 font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        {t.basicInfo.commonSymptoms}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {symptomKeys.map((symptomKey) => (
                            <motion.button
                                key={symptomKey}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSymptomClick(symptomKey)}
                                className={`
                                    px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border min-h-[44px]
                                    ${selectedSymptoms.includes(symptomKey)
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-800 shadow-sm"
                                        : "bg-white border-stone-200 text-stone-600 hover:border-emerald-200 hover:bg-emerald-50"
                                    }
                                `}
                            >
                                {selectedSymptoms.includes(symptomKey) && <Check className="w-4 h-4" />}
                                {t.basicInfo.symptoms[symptomKey]}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="symptoms" className="text-stone-600 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {t.basicInfo.detailedSymptoms}
                    </Label>
                    <Textarea
                        id="symptoms"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        placeholder={t.basicInfo.detailedSymptomsPlaceholder}
                        className="min-h-[100px] border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 resize-none"
                    />
                </div>

                {/* Doctor Level Selection */}
                <div className="space-y-4">
                    <Label className="text-stone-600 font-medium flex items-center gap-2 text-lg">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        {t.basicInfo.chooseTcmDoctor}
                    </Label>
                    <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
                        {(Object.keys(DOCTOR_LEVELS) as DoctorLevel[]).map((level) => {
                            const info = DOCTOR_LEVELS[level]
                            const translatedInfo = getDoctorLevelInfo(level)
                            const isSelected = doctorLevel === level

                            return (
                                <div
                                    key={level}
                                    onClick={() => setDoctorLevel(level)}
                                    className={`
                                        relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 min-w-[260px] md:min-w-0 flex-shrink-0 snap-center
                                        ${isSelected
                                            ? `${info.borderColor} ${info.bgColor} shadow-md scale-[1.02]`
                                            : 'border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-2xl">{info.icon}</span>
                                        {isSelected && (
                                            <div className={`h-5 w-5 rounded-full bg-gradient-to-r ${info.color} flex items-center justify-center`}>
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={`font-bold ${isSelected ? info.textColor : 'text-stone-700'}`}>
                                        {translatedInfo.name}
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-1">
                                        {translatedInfo.description}
                                    </p>
                                    {isSelected && (
                                        <div className={`absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-transparent ${info.borderColor.replace('border', 'ring')}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 md:static md:bg-transparent md:border-none md:shadow-none md:p-0">
                    {errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 animate-in fade-in slide-in-from-bottom-2">
                            <p className="font-medium mb-1">{t.errors?.validationError || 'Please check the following fields:'}</p>
                            <ul className="list-disc list-inside">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t.basicInfo.startDiagnosis}
                    </Button>
                </div>
            </form>


        </Card>
    )
}
