'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect } from 'react'
import { User, Calendar, Scale, Ruler, Activity, Clock, FileText, Check, Sparkles, Stethoscope, GraduationCap, Medal } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDoctorLevel, DOCTOR_LEVELS, DoctorLevel } from '@/contexts/DoctorContext'

export interface BasicInfoData {
    name: string
    age: string
    gender: string
    weight: string // in kg
    height: string // in cm
    symptoms: string
    symptomDuration: string // how long they've had symptoms
}

export function BasicInfoForm({ onComplete, initialData }: { onComplete: (data: BasicInfoData) => void, initialData?: BasicInfoData }) {
    const { doctorLevel, setDoctorLevel } = useDoctorLevel()
    const [formData, setFormData] = useState<BasicInfoData>(initialData || {
        name: '',
        age: '',
        gender: '',
        weight: '',
        height: '',
        symptoms: '',
        symptomDuration: ''
    })

    const commonSymptoms = [
        "Fever", "Cough", "Headache", "Fatigue",
        "Stomach Pain", "Sore Throat", "Shortness of Breath"
    ]

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])

    // Load patient profile data from localStorage (set from patient dashboard)
    useEffect(() => {
        const savedProfileData = localStorage.getItem('patientProfileData')
        if (savedProfileData) {
            try {
                const profileData = JSON.parse(savedProfileData)
                setFormData(prev => ({
                    ...prev,
                    name: profileData.name || prev.name,
                    age: profileData.age || prev.age,
                    gender: profileData.gender || prev.gender,
                    weight: profileData.weight || prev.weight,
                    height: profileData.height || prev.height,
                }))
                // Clear the stored data after loading
                localStorage.removeItem('patientProfileData')
            } catch (e) {
                console.error('Error loading profile data:', e)
            }
        }
    }, [])

    // Listen for test data fill event (only works in development on localhost)
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
            setSelectedSymptoms(['Headache', 'Fatigue'])
        }

        window.addEventListener('fill-test-data', handleFillTestData)
        return () => window.removeEventListener('fill-test-data', handleFillTestData)
    }, [])

    const handleSymptomClick = (symptom: string) => {
        let newSelection: string[]
        if (selectedSymptoms.includes(symptom)) {
            newSelection = selectedSymptoms.filter(s => s !== symptom)
        } else {
            newSelection = [...selectedSymptoms, symptom]
        }
        setSelectedSymptoms(newSelection)
        setFormData({ ...formData, symptoms: newSelection.join(', ') })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.name && formData.age && formData.gender && formData.weight && formData.height) {
            onComplete(formData)
        }
    }

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Patient Profile</h2>
                </div>
                <p className="text-emerald-50 opacity-90">Please provide your basic details to help us diagnose you accurately.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">


                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="name" className="text-stone-600 font-medium">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your name"
                                className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="gender" className="text-stone-600 font-medium">Gender</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 h-4 w-4 text-emerald-600/70 z-10 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </div>
                            <Select
                                value={formData.gender}
                                onValueChange={(val) => setFormData({ ...formData, gender: val })}
                            >
                                <SelectTrigger id="gender" className="pl-10 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50">
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age" className="text-stone-600 font-medium">Age</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                            <Input
                                id="age"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="120"
                                list="age-suggestions"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                placeholder="Age"
                                className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                required
                            />
                            <datalist id="age-suggestions">
                                {[1, 5, 10, 15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90].map((age) => (
                                    <option key={age} value={age} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weight" className="text-stone-600 font-medium">Weight (kg)</Label>
                        <div className="relative">
                            <Scale className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                            <Input
                                id="weight"
                                type="number"
                                inputMode="decimal"
                                min="1"
                                max="500"
                                step="0.1"
                                list="weight-suggestions"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="kg"
                                className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                required
                            />
                            <datalist id="weight-suggestions">
                                {[40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120].map((weight) => (
                                    <option key={weight} value={weight} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="height" className="text-stone-600 font-medium">Height (cm)</Label>
                        <div className="relative">
                            <Ruler className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                            <Input
                                id="height"
                                type="number"
                                inputMode="decimal"
                                min="1"
                                max="300"
                                step="0.1"
                                list="height-suggestions"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                placeholder="cm"
                                className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                required
                            />
                            <datalist id="height-suggestions">
                                {[140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200].map((height) => (
                                    <option key={height} value={height} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="symptomDuration" className="text-stone-600 font-medium">Duration</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 h-4 w-4 text-emerald-600/70 z-10 pointer-events-none">
                                <Clock className="h-4 w-4" />
                            </div>
                            <Select
                                value={formData.symptomDuration}
                                onValueChange={(val) => setFormData({ ...formData, symptomDuration: val })}
                            >
                                <SelectTrigger id="symptomDuration" className="pl-10 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50">
                                    <SelectValue placeholder="How long?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="less-than-1-day">Less than 1 day</SelectItem>
                                    <SelectItem value="1-3-days">1-3 days</SelectItem>
                                    <SelectItem value="4-7-days">4-7 days</SelectItem>
                                    <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                                    <SelectItem value="2-4-weeks">2-4 weeks</SelectItem>
                                    <SelectItem value="1-3-months">1-3 months</SelectItem>
                                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                                    <SelectItem value="6-12-months">6-12 months</SelectItem>
                                    <SelectItem value="over-1-year">Over 1 year</SelectItem>
                                    <SelectItem value="chronic">Chronic (ongoing)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-stone-600 font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Common Symptoms
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map((symptom) => (
                            <motion.button
                                key={symptom}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSymptomClick(symptom)}
                                className={`
                                    px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border min-h-[44px]
                                    ${selectedSymptoms.includes(symptom)
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-800 shadow-sm"
                                        : "bg-white border-stone-200 text-stone-600 hover:border-emerald-200 hover:bg-emerald-50"
                                    }
                                `}
                            >
                                {selectedSymptoms.includes(symptom) && <Check className="w-4 h-4" />}
                                {symptom}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="symptoms" className="text-stone-600 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Detailed Symptoms / Concerns
                    </Label>
                    <Textarea
                        id="symptoms"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        placeholder="Please describe your main complaints, feelings, and any other relevant details..."
                        className="min-h-[100px] border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 resize-none"
                    />
                </div>

                {/* Doctor Level Selection */}
                <div className="space-y-4">
                    <Label className="text-stone-600 font-medium flex items-center gap-2 text-lg">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        Choose Your TCM Doctor
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(Object.keys(DOCTOR_LEVELS) as DoctorLevel[]).map((level) => {
                            const info = DOCTOR_LEVELS[level]
                            const isSelected = doctorLevel === level

                            return (
                                <div
                                    key={level}
                                    onClick={() => setDoctorLevel(level)}
                                    className={`
                                        relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
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
                                        {info.name}
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-1">
                                        {info.description}
                                    </p>
                                    {isSelected && (
                                        <div className={`absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-transparent ${info.borderColor.replace('border', 'ring')}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Diagnosis
                </Button>
            </form>
        </Card>
    )
}
