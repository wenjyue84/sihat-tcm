import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test-utils'
import { InquiryChatStep } from './InquiryChatStep'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'

// Mock the hooks
vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: vi.fn()
}))

vi.mock('@/contexts/DiagnosisProgressContext', () => ({
    useDiagnosisProgress: vi.fn()
}))

vi.mock('@/lib/doctorLevels', () => ({
    getDoctorInfo: vi.fn(() => ({
        name: 'Test Doctor',
        icon: <span>👨‍⚕️</span>,
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-800'
    }))
}))

// Mock Speech Recognition API
global.SpeechRecognition = class {
    start() { }
    stop() { }
    abort() { }
} as any

global.webkitSpeechRecognition = global.SpeechRecognition

describe('InquiryChatStep - Responsive Layout', () => {
    const mockUseLanguage = useLanguage as ReturnType<typeof vi.fn>
    const mockUseDiagnosisProgress = useDiagnosisProgress as ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()

        mockUseLanguage.mockReturnValue({
            t: {
                inquiry: {
                    title: 'TCM Inquiry',
                    inputPlaceholder: 'Type your answer...',
                    send: 'Send'
                }
            },
            language: 'en'
        })

        mockUseDiagnosisProgress.mockReturnValue({
            setNavigationState: vi.fn(),
            navigationState: {
                showNext: true,
                showBack: true,
                canNext: true,
                onNext: vi.fn(),
                onBack: vi.fn()
            }
        })

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query !== '(min-width: 768px)',
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    it('renders chat form with correct mobile layout classes', () => {
        const { container } = render(
            <InquiryChatStep
                onComplete={vi.fn()}
                basicInfo={{ name: 'Test', age: '30', gender: 'male' }}
            />
        )

        // Find the form element
        const form = container.querySelector('form')
        expect(form).toBeTruthy()

        if (form) {
            // Verify mobile classes: w-full (not max-w-4xl on mobile)
            expect(form.className).toContain('w-full')
            expect(form.className).not.toContain('max-w-4xl')
            // Desktop classes should be present but not active
            expect(form.className).toContain('md:max-w-4xl')
            expect(form.className).toContain('md:mx-auto')
        }
    })

    it('renders chat form with correct desktop layout classes', () => {
        // Mock desktop viewport
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(min-width: 768px)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))

        const { container } = render(
            <InquiryChatStep
                onComplete={vi.fn()}
                basicInfo={{ name: 'Test', age: '30', gender: 'male' }}
            />
        )

        const form = container.querySelector('form')
        expect(form).toBeTruthy()

        if (form) {
            // Verify desktop classes are present
            expect(form.className).toContain('w-full')
            expect(form.className).toContain('md:max-w-4xl')
            expect(form.className).toContain('md:mx-auto')
        }
    })

    it('maintains full width when chat is maximized on mobile', async () => {
        const { container } = render(
            <InquiryChatStep
                onComplete={vi.fn()}
                basicInfo={{ name: 'Test', age: '30', gender: 'male' }}
            />
        )

        // Find and click maximize button (if it exists)
        const maximizeButton = screen.queryByLabelText(/maximize|expand/i)
        if (maximizeButton) {
            fireEvent.click(maximizeButton)

            // Wait for state update
            await new Promise(resolve => setTimeout(resolve, 100))

            const form = container.querySelector('form')
            if (form) {
                // Form should still be full width on mobile even when maximized
                expect(form.className).toContain('w-full')
                expect(form.className).not.toContain('max-w-4xl')
            }
        }
    })

    it('handles missing basicInfo gracefully', () => {
        const { container } = render(
            <InquiryChatStep
                onComplete={vi.fn()}
            />
        )

        const form = container.querySelector('form')
        expect(form).toBeTruthy()

        if (form) {
            // Should still render with correct layout classes
            expect(form.className).toContain('w-full')
            expect(form.className).toContain('md:max-w-4xl')
        }
    })

    it('preserves fixed positioning classes for bottom navigation on mobile', () => {
        const { container } = render(
            <InquiryChatStep
                onComplete={vi.fn()}
                basicInfo={{ name: 'Test', age: '30', gender: 'male' }}
            />
        )

        // Find the input container div (parent of form)
        const inputContainer = container.querySelector('div.fixed')
        expect(inputContainer).toBeTruthy()

        if (inputContainer) {
            // Should have fixed positioning for mobile bottom nav
            expect(inputContainer.className).toContain('fixed')
            expect(inputContainer.className).toContain('bottom-16')
        }
    })
})

