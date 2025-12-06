'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

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

// Mapping from admin level names to DoctorLevel type
const ADMIN_LEVEL_MAPPING: Record<string, DoctorLevel> = {
    'Master': 'master',
    'Expert': 'expert',
    'Physician': 'physician',
}

interface DoctorContextType {
    doctorLevel: DoctorLevel
    setDoctorLevel: (level: DoctorLevel) => void
    getModel: () => string
    getDoctorInfo: () => typeof DOCTOR_LEVELS[DoctorLevel]
    isLoadingDefault: boolean
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined)

export function DoctorProvider({ children }: { children: ReactNode }) {
    const [doctorLevel, setDoctorLevel] = useState<DoctorLevel>('physician') // Fallback default
    const [isLoadingDefault, setIsLoadingDefault] = useState(true)

    // Fetch the default doctor level from admin settings on mount
    useEffect(() => {
        const fetchDefaultLevel = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_prompts')
                    .select('config')
                    .eq('role', 'doctor')
                    .single()

                if (data?.config?.default_level) {
                    // Map admin level name (e.g., "Master") to DoctorLevel (e.g., "master")
                    const mappedLevel = ADMIN_LEVEL_MAPPING[data.config.default_level]
                    if (mappedLevel) {
                        setDoctorLevel(mappedLevel)
                        console.log('[DoctorContext] Loaded default level from admin:', data.config.default_level, '→', mappedLevel)
                    }
                }
            } catch (error) {
                console.error('[DoctorContext] Error fetching default level:', error)
                // Keep the fallback 'physician' on error
            } finally {
                setIsLoadingDefault(false)
            }
        }

        fetchDefaultLevel()
    }, [])

    const getModel = () => DOCTOR_LEVELS[doctorLevel].model
    const getDoctorInfo = () => DOCTOR_LEVELS[doctorLevel]

    return (
        <DoctorContext.Provider value={{ doctorLevel, setDoctorLevel, getModel, getDoctorInfo, isLoadingDefault }}>
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
