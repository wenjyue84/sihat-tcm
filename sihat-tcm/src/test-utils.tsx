import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
// Note: These providers are no longer needed - using Zustand store instead
// Tests should use the store directly or mock it

// Mock ResizeObserver for framer-motion/radix-ui
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Zustand store is global, no providers needed
// Tests can use the store directly or mock it as needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
