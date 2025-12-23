import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { DiagnosisProgressProvider } from '@/contexts/DiagnosisProgressContext'

// Mock ResizeObserver for framer-motion/radix-ui
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <LanguageProvider>
            <DiagnosisProgressProvider>
                {children}
            </DiagnosisProgressProvider>
        </LanguageProvider>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
