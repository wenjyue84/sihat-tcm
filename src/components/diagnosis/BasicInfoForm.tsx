'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useRef } from 'react'
import { User, Calendar as CalendarIcon, Scale, Ruler, Activity, Clock, FileText, Check, Sparkles, Stethoscope, Minus, Plus, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDoctorLevel, DOCTOR_LEVELS, DoctorLevel } from '@/contexts/DoctorContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { BMIExplanationModal } from './BMIExplanationModal'

// Total number of wizard steps
const TOTAL_STEPS = 5

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

// Step progress indicator component
function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    const { t } = useLanguage()

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-600">
                    {t.basicInfo.wizardSteps?.stepProgress?.replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))
                        || `Step ${currentStep} of ${totalSteps}`}
                </span>
                <span className="text-sm text-emerald-600 font-semibold">
                    {Math.round((currentStep / totalSteps) * 100)}%
                </span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}

// Animation variants for step transitions
const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 100 : -100,
        opacity: 0
    })
}

export function BasicInfoForm({ onComplete, initialData }: { onComplete: (data: BasicInfoData) => void, initialData?: BasicInfoData }) {
    const { doctorLevel, setDoctorLevel } = useDoctorLevel()
    const { t, language } = useLanguage()

    // Wizard step state
    const [currentStep, setCurrentStep] = useState(1)
    const [direction, setDirection] = useState(0)
    const [stepError, setStepError] = useState<string | null>(null)
    const [showBMIModal, setShowBMIModal] = useState(false)

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
        'stomachPain', 'soreThroat', 'shortnessOfBreath',
        'highBloodPressure', 'diabetes', 'cancer',
        'heartDisease', 'pneumonia', 'stroke'
    ]

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])

    // Age quick-select values
    // Age quick-select values
    const ageRanges = [
        { label: t.basicInfo.ageRanges?.under18 || 'Under 18', value: 15, min: 0, max: 17 },
        { label: t.basicInfo.ageRanges?.['18-25'] || '18-25', value: 22, min: 18, max: 25 },
        { label: t.basicInfo.ageRanges?.['26-35'] || '26-35', value: 30, min: 26, max: 35 },
        { label: t.basicInfo.ageRanges?.['36-45'] || '36-45', value: 40, min: 36, max: 45 },
        { label: t.basicInfo.ageRanges?.['46-55'] || '46-55', value: 50, min: 46, max: 55 },
        { label: t.basicInfo.ageRanges?.['56-65'] || '56-65', value: 60, min: 56, max: 65 },
        { label: t.basicInfo.ageRanges?.over65 || 'Over 65', value: 70, min: 66, max: 120 },
    ]

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

    // Validate current step before proceeding
    const validateStep = (step: number): boolean => {
        setStepError(null)

        switch (step) {
            case 1:
                if (!formData.gender) {
                    setStepError(t.basicInfo.gender + ' ' + (t.errors?.requiredField || 'is required'))
                    return false
                }
                return true
            case 2:
                if (!formData.age) {
                    setStepError(t.basicInfo.age + ' ' + (t.errors?.requiredField || 'is required'))
                    return false
                }
                return true
            case 3:
                if (!formData.weight || !formData.height) {
                    const missing = []
                    if (!formData.weight) missing.push(t.basicInfo.weight)
                    if (!formData.height) missing.push(t.basicInfo.height)
                    setStepError(missing.join(', ') + ' ' + (t.errors?.requiredField || 'is required'))
                    return false
                }
                return true
            case 4:
                if (!formData.symptomDuration) {
                    setStepError(t.basicInfo.duration + ' ' + (t.errors?.requiredField || 'is required'))
                    return false
                }
                return true
            case 5:
                return true
            default:
                return true
        }
    }

    const goToNextStep = () => {
        if (validateStep(currentStep)) {
            setDirection(1)
            setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
        }
    }

    const goToPreviousStep = () => {
        setStepError(null)
        setDirection(-1)
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateStep(currentStep)) {
            onComplete(formData)
        }
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

    // Get step title and subtitle
    const getStepInfo = (step: number) => {
        const stepInfo = {
            1: {
                title: t.basicInfo.wizardSteps?.step1Title || "Who are you?",
                subtitle: t.basicInfo.wizardSteps?.step1Subtitle || "Let's start with your identity"
            },
            2: {
                title: t.basicInfo.wizardSteps?.step2Title || "How old are you?",
                subtitle: t.basicInfo.wizardSteps?.step2Subtitle || "Select your age"
            },
            3: {
                title: t.basicInfo.wizardSteps?.step3Title || "Body measurements",
                subtitle: t.basicInfo.wizardSteps?.step3Subtitle || "Help us calculate your health metrics"
            },
            4: {
                title: t.basicInfo.wizardSteps?.step4Title || "What's bothering you?",
                subtitle: t.basicInfo.wizardSteps?.step4Subtitle || "Describe your symptoms"
            },
            5: {
                title: t.basicInfo.wizardSteps?.step5Title || "Choose your doctor",
                subtitle: t.basicInfo.wizardSteps?.step5Subtitle || "Select your TCM practitioner level"
            }
        }
        return stepInfo[step as keyof typeof stepInfo] || { title: '', subtitle: '' }
    }

    // Render step content
    const renderStepContent = () => {
        const stepInfo = getStepInfo(currentStep)

        return (
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-6"
                >
                    {/* Step Header */}
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-stone-800 mb-2">{stepInfo.title}</h3>
                        <p className="text-stone-500">{stepInfo.subtitle}</p>
                    </div>

                    {/* Step Content */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-stone-600 font-medium">{t.basicInfo.fullName}</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t.basicInfo.fullNamePlaceholder}
                                        className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 text-stone-900"
                                    />
                                </div>
                            </div>

                            {/* Gender Selection - Icon Buttons */}
                            <div className="space-y-3">
                                <Label className="text-stone-600 font-medium">{t.basicInfo.gender}</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'male', label: t.basicInfo.male, icon: '♂️', color: 'from-blue-500 to-blue-600' },
                                        { value: 'female', label: t.basicInfo.female, icon: '♀️', color: 'from-pink-500 to-pink-600' },
                                        { value: 'other', label: t.basicInfo.other, icon: '⚧️', color: 'from-purple-500 to-purple-600' }
                                    ].map(gender => (
                                        <motion.button
                                            key={gender.value}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData({ ...formData, gender: gender.value })}
                                            className={`
                                                relative p-4 rounded-xl border-2 transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center gap-2
                                                ${formData.gender === gender.value
                                                    ? 'border-emerald-400 bg-emerald-50 shadow-md'
                                                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                                                }
                                            `}
                                        >
                                            <span className="text-3xl">{gender.icon}</span>
                                            <span className={`text-sm font-medium ${formData.gender === gender.value ? 'text-emerald-700' : 'text-stone-600'}`}>
                                                {gender.label}
                                            </span>
                                            {formData.gender === gender.value && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                                                >
                                                    <Check className="w-3 h-3 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {/* Age Input with Quick Select */}
                            <div className="space-y-4">
                                <Label htmlFor="age" className="text-stone-600 font-medium">{t.basicInfo.age}</Label>

                                {/* Quick Age Range Pills */}
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {ageRanges.map((range) => (
                                        <motion.button
                                            key={range.label}
                                            type="button"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFormData({ ...formData, age: String(range.value) })}
                                            className={`
                                                px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px]
                                                ${parseInt(formData.age) >= range.min && parseInt(formData.age) <= range.max
                                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-sm'
                                                    : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-200 hover:bg-emerald-50'
                                                }
                                            `}
                                        >
                                            {range.label}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Or enter exact age */}
                                <div className="text-center text-stone-400 text-sm my-4">— {t.common.or} —</div>

                                {/* Precise Age Input */}
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
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            {/* Height */}
                            <div className="space-y-2">
                                <Label htmlFor="height" className="text-stone-600 font-medium flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-emerald-600" />
                                    {t.basicInfo.height}
                                </Label>
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

                            {/* Weight */}
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-stone-600 font-medium flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-emerald-600" />
                                    {t.basicInfo.weight}
                                </Label>
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

                            {/* BMI Preview */}
                            {formData.height && formData.weight && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100 transition-colors relative group"
                                        onClick={() => setShowBMIModal(true)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="text-stone-500 text-sm">BMI: </span>
                                        <span className="text-emerald-700 font-bold text-lg">
                                            {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                                        </span>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="text-xs text-emerald-600/70 mt-1 font-medium">
                                            {t.common.view || 'View'} details
                                        </div>
                                    </motion.div>

                                    <BMIExplanationModal
                                        isOpen={showBMIModal}
                                        onClose={() => setShowBMIModal(false)}
                                        bmi={parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)}
                                        height={parseFloat(formData.height)}
                                        weight={parseFloat(formData.weight)}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            {/* Common Symptoms */}
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

                            {/* Symptom Duration */}
                            <div className="space-y-2" id="symptomDuration-wrapper">
                                <Label htmlFor="symptomDuration" className="text-stone-600 font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-600" />
                                    {t.basicInfo.duration}
                                </Label>
                                <Select
                                    value={formData.symptomDuration}
                                    onValueChange={(val) => setFormData({ ...formData, symptomDuration: val })}
                                >
                                    <SelectTrigger id="symptomDuration" className="h-12 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50 text-stone-900">
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

                            {/* Detailed Symptoms */}
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
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <Label className="text-stone-600 font-medium flex items-center gap-2 text-lg">
                                <Stethoscope className="w-5 h-5 text-emerald-600" />
                                {t.basicInfo.chooseTcmDoctor}
                            </Label>
                            <div className="space-y-3">
                                {(Object.keys(DOCTOR_LEVELS) as DoctorLevel[]).map((level) => {
                                    const info = DOCTOR_LEVELS[level]
                                    const translatedInfo = getDoctorLevelInfo(level)
                                    const isSelected = doctorLevel === level

                                    return (
                                        <motion.div
                                            key={level}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setDoctorLevel(level)}
                                            className={`
                                                relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                                                ${isSelected
                                                    ? `${info.borderColor} ${info.bgColor} shadow-md`
                                                    : 'border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl">{info.icon}</span>
                                                <div className="flex-1">
                                                    <h3 className={`font-bold ${isSelected ? info.textColor : 'text-stone-700'}`}>
                                                        {translatedInfo.name}
                                                    </h3>
                                                    <p className="text-xs text-stone-500 mt-0.5">
                                                        {translatedInfo.description}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className={`h-6 w-6 rounded-full bg-gradient-to-r ${info.color} flex items-center justify-center`}
                                                    >
                                                        <Check className="w-4 h-4 text-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        )
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

            <form onSubmit={handleSubmit} className="p-6 pb-24 md:pb-6" noValidate>
                {/* Progress Indicator */}
                <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                {/* Step Content */}
                <div className="min-h-[350px]">
                    {renderStepContent()}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {stepError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"
                        >
                            {stepError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
                    <div className="flex gap-3">
                        {/* Back Button */}
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousStep}
                                className="flex-1 h-12 text-stone-600 border-stone-200 hover:bg-stone-50"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                {t.common.back}
                            </Button>
                        )}

                        {/* Next / Submit Button */}
                        {currentStep < TOTAL_STEPS ? (
                            <Button
                                type="button"
                                onClick={goToNextStep}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300"
                            >
                                {t.common.next}
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                {t.basicInfo.startDiagnosis}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Card>
    )
}
