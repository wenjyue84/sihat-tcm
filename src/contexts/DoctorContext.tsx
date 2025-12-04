'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type DoctorLevel = 'master' | 'expert' | 'physician'

export const DOCTOR_LEVELS = {
    master: {
        id: 'master',
        name: '名医 Master',
        description: 'Most experienced, renowned physician',
        model: 'gemini-3-pro-preview',
        icon: '👨‍⚕️',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-800',
    },
    expert: {
        id: 'expert',
        name: '专家 Expert',
        description: 'Experienced specialist physician',
        model: 'gemini-2.5-pro',
        icon: '🩺',
        color: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-800',
    },
    physician: {
        id: 'physician',
        name: '医师 Physician',
        description: 'Standard practitioner',
        model: 'gemini-2.5-flash',
        icon: '💊',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-800',
    },
} as const

interface DoctorContextType {
    doctorLevel: DoctorLevel
    setDoctorLevel: (level: DoctorLevel) => void
    getModel: () => string
    getDoctorInfo: () => typeof DOCTOR_LEVELS[DoctorLevel]
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined)

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [doctorLevel, setDoctorLevel] = useState<DoctorLevel>('physician') // Default to physician

    const getModel = () => DOCTOR_LEVELS[doctorLevel].model
    const getDoctorInfo = () => DOCTOR_LEVELS[doctorLevel]

    return (
        <DoctorContext.Provider value={{ doctorLevel, setDoctorLevel, getModel, getDoctorInfo }}>
            {children}
        </DoctorContext.Provider>
    )
}

export function useDoctorLevel() {
    const context = useContext(DoctorContext)
    if (context === undefined) {
        throw new Error('useDoctorLevel must be used within a DoctorProvider')
    }
    return context
}
