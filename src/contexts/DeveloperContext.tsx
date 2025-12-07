'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface DeveloperContextType {
    isDeveloperMode: boolean
    toggleDeveloperMode: () => void
}

const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined)

export function DeveloperProvider({ children }: { children: React.ReactNode }) {
    const [isDeveloperMode, setIsDeveloperMode] = useState(false)

    useEffect(() => {
        // Load initial state from localStorage
        const stored = localStorage.getItem('isDeveloperMode')
        if (stored) {
            setIsDeveloperMode(JSON.parse(stored))
        }
    }, [])

    const toggleDeveloperMode = () => {
        setIsDeveloperMode(prev => {
            const newValue = !prev
            localStorage.setItem('isDeveloperMode', JSON.stringify(newValue))
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
