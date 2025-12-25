import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Info, ClipboardList, Check, Clock, Sparkles, History, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicInfoData } from './types'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLastSymptoms } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
    const [isImporting, setIsImporting] = useState(false)

    const handleImportPrevious = async () => {
        setIsImporting(true)
        try {
            const result = await getLastSymptoms()
            if (result.success && result.data) {
                setFormData({
                    ...formData,
                    mainComplaint: result.data,
                    otherSymptoms: '' // Or append if preferred, but usually last symptoms are one block
                })
                toast.success(t.basicInfo.importSuccess || 'Symptoms imported successfully!')
            } else {
                toast.error(result.error || t.basicInfo.importError || 'No previous symptoms found.')
            }
        } catch (error) {
            toast.error('Failed to import symptoms.')
        } finally {
            setIsImporting(false)
        }
    }

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
        <div onMouseDown={(e) => e.preventDefault()} className="mt-4 rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/80">Quick Add Suggestions</span>
                </div>
                {/* <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground h-5 px-2">
                    Tap to add
                </Badge> */}
            </div>

            <div className="p-4 space-y-4">
                {/* Category Mode Switcher (Tabs) */}
                <Tabs
                    value={categoryMode}
                    onValueChange={(val) => setCategoryMode(val as CategoryMode)}
                    className="w-full"
                >
                    <TabsList className="w-full grid grid-cols-3 h-9 p-1 bg-muted/50">
                        {(['simple', 'western', 'tcm'] as const).map(mode => (
                            <TabsTrigger
                                key={mode}
                                value={mode}
                                className="text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                            >
                                {t.basicInfo.symptomCategories?.modes?.[mode] || mode}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Sub-Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {categories[categoryMode].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                relative flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                                ${activeCategory === cat.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary/20'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                }
                            `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Symptom Grid */}
                <div className="min-h-[120px]">
                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2"
                    >
                        {categories[categoryMode]
                            .find(c => c.id === activeCategory)
                            ?.symptoms.map((symptomKey) => (
                                <div key={symptomKey} className="group relative">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover/95 backdrop-blur-sm border border-border text-popover-foreground text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 hidden md:block scale-95 group-hover:scale-100 origin-bottom">
                                        <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                            {t.basicInfo.symptoms[symptomKey as keyof typeof t.basicInfo.symptoms]}
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {t.basicInfo.symptomDescriptions?.[symptomKey as keyof typeof t.basicInfo.symptomDescriptions] || 'No description available'}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSymptomClick(symptomKey)}
                                        className={`
                                            group flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 select-none
                                            ${selectedSymptoms.includes(symptomKey)
                                                ? "bg-primary/10 border-primary/40 text-primary shadow-inner"
                                                : "bg-background border-border/60 text-foreground/70 hover:border-primary/40 hover:bg-muted/40 hover:text-foreground hover:shadow-sm"
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-200
                                            ${selectedSymptoms.includes(symptomKey)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/30 bg-transparent group-hover:border-primary/50"
                                            }
                                        `}>
                                            {selectedSymptoms.includes(symptomKey) && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        {t.basicInfo.symptoms[symptomKey as keyof typeof t.basicInfo.symptoms]}
                                    </button>
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
                <div className="flex items-center justify-between">
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

                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleImportPrevious}
                        disabled={isImporting}
                        className="h-8 text-[11px] gap-1.5 text-primary hover:text-primary hover:bg-primary/5 rounded-full px-3 border border-primary/20"
                    >
                        {isImporting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <History className="w-3 h-3" />
                        )}
                        {t.basicInfo.importPrevious || "Import Previous"}
                    </Button>
                </div>
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
