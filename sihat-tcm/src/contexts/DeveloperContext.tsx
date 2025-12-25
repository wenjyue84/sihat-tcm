'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { logger } from '@/lib/clientLogger'

interface DeveloperContextType {
    isDeveloperMode: boolean
    toggleDeveloperMode: () => void
}

const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined)

export function DeveloperProvider({ children }: { children: React.ReactNode }) {
    const { profile, updatePreferences } = useAuth()
    const [isDeveloperMode, setIsDeveloperMode] = useState(false)

    useEffect(() => {
        // STRICT: Only allow developer mode if user is logged in AND has role 'developer'
        if (profile?.role !== 'developer') {
            setIsDeveloperMode(false)
            // Optional: Clear localStorage to avoid confusion if they log back in as dev later? 
            // Better to leave it but just ignore it here.
            return
        }

        // If user is a verified developer, we can respect their persisted preference
        const stored = localStorage.getItem('isDeveloperMode')
        if (stored) {
            try {
                setIsDeveloperMode(JSON.parse(stored))
            } catch (e) {
                logger.warn('DeveloperContext', 'Failed to parse isDeveloperMode from localStorage', e)
                // Default to true for developers if storage is corrupt
                setIsDeveloperMode(true)
            }
        } else {
            // Default to true for developers if no preference set
            setIsDeveloperMode(true)
            localStorage.setItem('isDeveloperMode', 'true')
        }
    }, [profile])

    const toggleDeveloperMode = () => {
        setIsDeveloperMode(prev => {
            const newValue = !prev
            localStorage.setItem('isDeveloperMode', JSON.stringify(newValue))

            // Sync to database if user is logged in
            if (profile) {
                updatePreferences({ isDeveloperMode: newValue })
            }

            return newValue
        })
    }


    return (
        <DeveloperContext.Provider value={{ isDeveloperMode, toggleDeveloperMode }}>
            {children}
        </DeveloperContext.Provider>
    )
}

export function useDeveloper() {
    const context = useContext(DeveloperContext)
    if (context === undefined) {
        throw new Error('useDeveloper must be used within a DeveloperProvider')
    }
    return context
}
