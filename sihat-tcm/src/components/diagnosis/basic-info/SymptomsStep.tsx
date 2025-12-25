import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Info, ClipboardList, Activity, Check, Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BasicInfoData } from './types'
import { useLanguage } from '@/contexts/LanguageContext'

interface SymptomsStepProps {
    formData: BasicInfoData
    setFormData: (data: BasicInfoData) => void
    activeInput: 'main' | 'other'
    setActiveInput: (input: 'main' | 'other') => void
    selectedSymptoms: string[]
    setSelectedSymptoms: (symptoms: string[]) => void
}

type CategoryMode = 'simple' | 'western' | 'tcm'

export function SymptomsStep({
    formData,
    setFormData,
    activeInput,
    setActiveInput,
    selectedSymptoms,
    setSelectedSymptoms
}: SymptomsStepProps) {
    const { t } = useLanguage()

    const [categoryMode, setCategoryMode] = useState<CategoryMode>('simple')
    const [activeCategory, setActiveCategory] = useState<string>('common')
    const [isInputFocused, setIsInputFocused] = useState(false)

    // Define categories
    const categories: Record<CategoryMode, { id: string; label: string; symptoms: string[] }[]> = {
        simple: [
            { id: 'common', label: t.basicInfo.symptomCategories?.simple?.common || 'Common Symptoms', symptoms: ['fever', 'cough', 'headache', 'fatigue', 'soreThroat', 'stomachPain'] },
            { id: 'chronic', label: t.basicInfo.symptomCategories?.simple?.chronic || 'Chronic / Critical', symptoms: ['highBloodPressure', 'diabetes', 'heartDisease', 'shortnessOfBreath', 'stroke', 'cancer', 'pneumonia'] }
        ],
        western: [
            { id: 'respiratory', label: t.basicInfo.symptomCategories?.western?.respiratory || 'Respiratory', symptoms: ['cough', 'shortnessOfBreath', 'soreThroat', 'pneumonia'] },
            { id: 'digestive', label: t.basicInfo.symptomCategories?.western?.digestive || 'Digestive', symptoms: ['stomachPain'] },
            { id: 'neurological', label: t.basicInfo.symptomCategories?.western?.neurological || 'Neurological', symptoms: ['headache', 'stroke', 'fatigue'] },
            { id: 'cardiovascular', label: t.basicInfo.symptomCategories?.western?.cardiovascular || 'Cardiovascular', symptoms: ['highBloodPressure', 'heartDisease'] },
            { id: 'general', label: t.basicInfo.symptomCategories?.western?.general || 'General', symptoms: ['fever', 'diabetes', 'cancer'] }
        ],
        tcm: [
            { id: 'wood', label: t.basicInfo.symptomCategories?.tcm?.wood || 'Wood (Liver)', symptoms: ['headache', 'stroke', 'highBloodPressure'] },
            { id: 'fire', label: t.basicInfo.symptomCategories?.tcm?.fire || 'Fire (Heart)', symptoms: ['heartDisease', 'fever'] },
            { id: 'earth', label: t.basicInfo.symptomCategories?.tcm?.earth || 'Earth (Spleen)', symptoms: ['stomachPain', 'fatigue', 'diabetes'] },
            { id: 'metal', label: t.basicInfo.symptomCategories?.tcm?.metal || 'Metal (Lung)', symptoms: ['cough', 'shortnessOfBreath', 'soreThroat', 'pneumonia'] },
            { id: 'water', label: t.basicInfo.symptomCategories?.tcm?.water || 'Water (Kidney)', symptoms: ['cancer'] }
        ]
    }

    // Reset active category when mode changes to ensure valid selection
    useEffect(() => {
        if (categories[categoryMode].length > 0) {
            setActiveCategory(categories[categoryMode][0].id)
        }
    }, [categoryMode, t])

    const handleSymptomClick = (symptomKey: string) => {
        const symptomName = t.basicInfo.symptoms[symptomKey as keyof typeof t.basicInfo.symptoms]
        let newSelection: string[]

        // Target specific input based on focus
        const targetField = activeInput === 'main' ? 'mainComplaint' : 'otherSymptoms'
        let currentText = formData[targetField] || ''

        if (selectedSymptoms.includes(symptomKey)) {
            // Deselect logic
            newSelection = selectedSymptoms.filter(s => s !== symptomKey)

            // Remove the symptom name from text string nicely
            const cases = [
                `, ${symptomName}`,
                `${symptomName}, `,
                symptomName
            ]

            for (const c of cases) {
                if (currentText.includes(c)) {
                    currentText = currentText.replace(c, '')
                    break
                }
            }
            currentText = currentText.trim()
            if (currentText.startsWith(',')) currentText = currentText.substring(1).trim()
            if (currentText.endsWith(',')) currentText = currentText.substring(0, currentText.length - 1).trim()

            setFormData({ ...formData, [targetField]: currentText })

        } else {
            // Select logic

            // Logic for Main Complaint (Single Item focus) vs Other (Append)
            if (activeInput === 'main') {
                // Single item only

                // Find and remove the key for the PREVIOUS main complaint if it exists
                const prevMainText = formData.mainComplaint || ''
                let prevKey = ''

                if (prevMainText) {
                    const entry = Object.entries(t.basicInfo.symptoms).find(([_, value]) => value === prevMainText)
                    if (entry) {
                        prevKey = entry[0]
                    }
                }

                currentText = symptomName

                // Start with current selection
                let updatedSelection = [...selectedSymptoms]

                // Remove previous key if found
                if (prevKey && updatedSelection.includes(prevKey)) {
                    updatedSelection = updatedSelection.filter(k => k !== prevKey)
                }

                // Add new key
                newSelection = [...updatedSelection, symptomKey]
            } else {
                // Other symptoms - standard append
                newSelection = [...selectedSymptoms, symptomKey]
                if (currentText.trim().length > 0) {
                    if (!currentText.includes(symptomName)) {
                        currentText = `${currentText}, ${symptomName}`
                    }
                } else {
                    currentText = symptomName
                }
            }

            setFormData({ ...formData, [targetField]: currentText })
        }

        setSelectedSymptoms(newSelection)
    }

    const quickSelectionsSection = (
        <div onMouseDown={(e) => e.preventDefault()}>
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Quick Selections</span>
                </div>
            </div>

            {/* Symptom Selection (Priority 2) */}
            <div>
                {/* Category Mode Switcher */}
                <div className="flex justify-between items-center bg-muted/40 p-1 rounded-lg mb-4">
                    {(['simple', 'western', 'tcm'] as const).map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setCategoryMode(mode)}
                            className={`
                                flex-1 py-1.5 text-xs font-medium rounded-md transition-all
                                ${categoryMode === mode
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            {t.basicInfo.symptomCategories?.modes?.[mode] || mode}
                        </button>
                    ))}
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide -mx-1 px-1">
                    {categories[categoryMode].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                ${activeCategory === cat.id
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                }
                            `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Symptom Grid - Filtered by Active Category */}
                <div className="space-y-3 min-h-44">
                    <Label className="text-muted-foreground font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            {categories[categoryMode].find(c => c.id === activeCategory)?.label}
                        </div>
                    </Label>

                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2"
                    >
                        {categories[categoryMode]
                            .find(c => c.id === activeCategory)
                            ?.symptoms.map((symptomKey) => (
                                <div key={symptomKey} className="relative group">
                                    {/* Tooltip - hidden on mobile, shows on hover for desktop */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-popover border border-border text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 hidden md:block">
                                        <p className="font-medium text-foreground mb-1">
                                            {t.basicInfo.symptoms[symptomKey as keyof typeof t.basicInfo.symptoms]}
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {t.basicInfo.symptomDescriptions?.[symptomKey as keyof typeof t.basicInfo.symptomDescriptions] || 'No description available'}
                                        </p>
                                        {/* Arrow pointing down */}
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSymptomClick(symptomKey)}
                                        className={`
                                        px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border min-h-10
                                        ${selectedSymptoms.includes(symptomKey)
                                                ? "bg-primary/20 border-primary/30 text-primary shadow-sm"
                                                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
                                            }
                                    `}
                                    >
                                        {selectedSymptoms.includes(symptomKey) && <Check className="w-3 h-3" />}
                                        {t.basicInfo.symptoms[symptomKey as keyof typeof t.basicInfo.symptoms]}
                                    </motion.button>
                                </div>
                            ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Main Concern Input (Priority 1) */}
            <div className="space-y-2">
                <Label htmlFor="mainComplaint" className="text-muted-foreground font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {t.basicInfo.mainConcern || "Main Concern / Complaints"}
                    <div className="group relative flex items-center">
                        <Info className="w-4 h-4 text-muted-foreground/50 cursor-help" />
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 p-2 bg-popover border border-border text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {t.basicInfo.mainConcernTooltip || "Please focus on your ONE major complaint here."}
                            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                        </div>
                    </div>
                </Label>
                <Input
                    id="mainComplaint"
                    value={formData.mainComplaint}
                    onChange={(e) => setFormData({ ...formData, mainComplaint: e.target.value })}
                    onFocus={() => {
                        setActiveInput('main')
                        setIsInputFocused(true)
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={t.basicInfo.mainConcernPlaceholder || "e.g. Severe Headache"}
                    className={`border-border bg-muted/20 transition-all ${activeInput === 'main' ? 'ring-2 ring-primary/20 border-primary' : ''}`}
                    suppressHydrationWarning
                />
            </div>
            {isInputFocused && activeInput === 'main' && quickSelectionsSection}

            {/* Other Symptoms Input */}
            <div className="space-y-2">
                <Label htmlFor="otherSymptoms" className="text-muted-foreground font-medium flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-500" />
                    {t.basicInfo.otherSymptoms || "Other Symptoms"}
                </Label>
                <Textarea
                    id="otherSymptoms"
                    value={formData.otherSymptoms}
                    onChange={(e) => setFormData({ ...formData, otherSymptoms: e.target.value })}
                    onFocus={() => {
                        setActiveInput('other')
                        setIsInputFocused(true)
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={t.basicInfo.otherSymptomsPlaceholder || "Any other symptoms..."}
                    className={`min-h-[80px] border-border bg-muted/20 resize-none transition-all ${activeInput === 'other' ? 'ring-2 ring-primary/20 border-primary' : ''}`}
                    suppressHydrationWarning
                />
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Select from below to add to <strong>{activeInput === 'main' ? (t.basicInfo.mainConcern || "Main Concern") : (t.basicInfo.otherSymptoms || "Other Symptoms")}</strong>
                </p>
            </div>
            {isInputFocused && activeInput === 'other' && quickSelectionsSection}

            {/* Symptom Duration (Priority 3) */}
            <div className="space-y-2" id="symptomDuration-wrapper">
                <Label htmlFor="symptomDuration" className="text-muted-foreground font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {t.basicInfo.duration}
                </Label>
                <Select
                    value={formData.symptomDuration}
                    onValueChange={(val) => setFormData({ ...formData, symptomDuration: val })}
                >
                    <SelectTrigger id="symptomDuration" className="h-12 border-border focus:ring-primary/50 focus:border-primary bg-muted/20 text-foreground">
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
    )
}
