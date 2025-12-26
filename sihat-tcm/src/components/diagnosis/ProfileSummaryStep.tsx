'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Calendar, Ruler, Scale, Check, ChevronRight, Edit2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/stores/useAppStore'
import { useDoctorLevel } from '@/stores/useAppStore'
import { useState, useEffect, useRef } from 'react'
import { useDiagnosisProgress } from '@/stores/useAppStore'

export interface ProfileSummaryData {
    name: string
    age: string
    gender: string
    height: string
    weight: string
}

interface ProfileSummaryStepProps {
    data: ProfileSummaryData
    onContinue: () => void
    onEditProfile: () => void
}

/**
 * ProfileSummaryStep
 * 
 * A condensed view of the patient's profile for logged-in users.
 * Shows pre-filled basic info (name, age, gender, height, weight) in a read-only format.
 * Allows users to skip directly to the symptoms step (Step 4 of traditional BasicInfoForm).
 */
export function ProfileSummaryStep({ data, onContinue, onEditProfile }: ProfileSummaryStepProps) {
    const { t } = useLanguage()
    const { doctorLevel, setDoctorLevel } = useDoctorLevel()
    const { setNavigationState } = useDiagnosisProgress()

    // Check if profile is complete (all required fields filled)
    const isProfileComplete = !!(
        data.name && data.name.trim() !== '' &&
        data.age && data.age.trim() !== '' &&
        data.gender && data.gender.trim() !== '' &&
        data.height && data.height.trim() !== '' &&
        data.weight && data.weight.trim() !== ''
    )

    // Calculate BMI
    const heightM = parseFloat(data.height) / 100
    const weightKg = parseFloat(data.weight)
    const bmi = heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null

    // Get BMI category
    const getBmiCategory = (bmiValue: number) => {
        if (bmiValue < 18.5) return { label: t.basicInfo.bmiExplanation?.underweight || 'Underweight', color: 'text-yellow-600' }
        if (bmiValue < 25) return { label: t.basicInfo.bmiExplanation?.normal || 'Normal', color: 'text-emerald-600' }
        if (bmiValue < 30) return { label: t.basicInfo.bmiExplanation?.overweight || 'Overweight', color: 'text-orange-600' }
        return { label: t.basicInfo.bmiExplanation?.obese || 'Obese', color: 'text-red-600' }
    }

    const bmiInfo = bmi ? getBmiCategory(parseFloat(bmi)) : null

    // Format gender for display
    const getGenderDisplay = (gender: string) => {
        if (!gender) return '-'
        const genderKey = gender.toLowerCase()
        if (genderKey === 'male') return t.basicInfo.male
        if (genderKey === 'female') return t.basicInfo.female
        return t.basicInfo.other
    }

    const getGenderIcon = (gender: string) => {
        if (!gender) return '❓'
        const genderKey = gender.toLowerCase()
        if (genderKey === 'male') return '♂️'
        if (genderKey === 'female') return '♀️'
        return '⚧️'
    }

    // Create a ref to hold the latest callback to avoid dependency loops
    const onContinueRef = useRef(onContinue)
    useEffect(() => {
        onContinueRef.current = onContinue
    }, [onContinue])

    // Sync navigation state - only allow continue if profile is complete
    useEffect(() => {
        setNavigationState({
            onNext: isProfileComplete ? () => onContinueRef.current() : undefined,
            onBack: undefined, // No back from this step (it's the start)
            showNext: isProfileComplete,
            showBack: false,
            showSkip: false,
            canNext: isProfileComplete
        })
    }, [setNavigationState, isProfileComplete])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4"
                >
                    <User className="w-8 h-8" />
                </motion.div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                    {t.basicInfo.lockedProfile?.reviewTitle || 'Profile Confirmed'}
                </h2>
                <p className="text-stone-500">
                    {t.basicInfo.lockedProfile?.reviewSubtitle || 'Your profile information is ready. Click Continue to proceed.'}
                </p>
            </div>

            {/* Profile Summary Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-stone-50">
                <div className="p-6">
                    {/* Name & Welcome */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-stone-100">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {data.name ? data.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-stone-800">
                                {data.name || t.analysisLoading?.patientInfo?.anonymous || 'Anonymous'}
                            </h3>
                            <p className="text-sm text-stone-500">
                                {t.basicInfo.lockedProfile?.notice || 'Profile auto-filled from your account'}
                            </p>
                        </div>
                        <button
                            onClick={onEditProfile}
                            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={t.basicInfo.lockedProfile?.editInDashboard || 'Edit in Dashboard'}
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Gender */}
                        <div className="bg-stone-50 rounded-xl p-4 text-center">
                            <span className="text-2xl mb-2 block">{getGenderIcon(data.gender)}</span>
                            <div className="text-xs text-stone-400 mb-1">{t.basicInfo.gender}</div>
                            <div className="font-semibold text-stone-700">{getGenderDisplay(data.gender)}</div>
                        </div>

                        {/* Age */}
                        <div className="bg-stone-50 rounded-xl p-4 text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                            <div className="text-xs text-stone-400 mb-1">{t.basicInfo.age}</div>
                            <div className="font-semibold text-stone-700">{data.age} {t.analysisLoading?.yearsOld || 'years old'}</div>
                        </div>

                        {/* Height */}
                        <div className="bg-stone-50 rounded-xl p-4 text-center">
                            <Ruler className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <div className="text-xs text-stone-400 mb-1">{t.basicInfo.height}</div>
                            <div className="font-semibold text-stone-700">{data.height} {t.basicInfo.heightUnit || 'cm'}</div>
                        </div>

                        {/* Weight */}
                        <div className="bg-stone-50 rounded-xl p-4 text-center">
                            <Scale className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                            <div className="text-xs text-stone-400 mb-1">{t.basicInfo.weight}</div>
                            <div className="font-semibold text-stone-700">{data.weight} {t.basicInfo.weightUnit || 'kg'}</div>
                        </div>
                    </div>

                    {/* BMI Display */}
                    {bmi && bmiInfo && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-stone-500">{t.report?.bmi || 'BMI'}:</span>
                                    <span className="font-bold text-stone-800">{bmi}</span>
                                </div>
                                <span className={`text-sm font-medium ${bmiInfo.color}`}>
                                    {bmiInfo.label}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirmation checklist OR Incomplete warning */}
                <div className="px-6 pb-6">
                    {isProfileComplete ? (
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-3 text-emerald-700">
                                <div className="p-1 bg-emerald-500 rounded-full">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium">
                                    {t.basicInfo.lockedProfile?.profileReady || 'Profile information is complete and ready'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-3 text-amber-700">
                                <div className="p-1 bg-amber-500 rounded-full">
                                    <Edit2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium block">
                                        {t.basicInfo.lockedProfile?.profileIncomplete || 'Please complete your profile first'}
                                    </span>
                                    <span className="text-xs text-amber-600">
                                        {t.basicInfo.lockedProfile?.missingFields || 'Some information is missing (age, gender, height, or weight)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Continue Button or Complete Profile Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {isProfileComplete ? (
                    <Button
                        onClick={onContinue}
                        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <span>{t.basicInfo.lockedProfile?.continueToSymptoms || 'Continue to Symptoms'}</span>
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={onEditProfile}
                        className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Edit2 className="w-5 h-5 mr-2" />
                        <span>{t.basicInfo.lockedProfile?.completeProfile || 'Complete My Profile'}</span>
                    </Button>
                )}
            </motion.div>

            {/* Edit Profile Link - only show if profile is complete */}
            {isProfileComplete && (
                <div className="text-center">
                    <button
                        onClick={onEditProfile}
                        className="text-sm text-stone-500 hover:text-emerald-600 transition-colors"
                    >
                        {t.basicInfo.lockedProfile?.wantToEdit || 'Want to update your profile?'}{' '}
                        <span className="underline">
                            {t.basicInfo.lockedProfile?.editInDashboard || 'Edit in Dashboard'}
                        </span>
                    </button>
                </div>
            )}
        </div>
    )
}
