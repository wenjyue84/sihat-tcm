import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test-utils'
import DiagnosisWizard from './DiagnosisWizard'
import { useDiagnosisWizard } from '@/hooks/useDiagnosisWizard'
import { useDeveloper } from '@/contexts/DeveloperContext'

// Mock the hooks
vi.mock('@/hooks/useDiagnosisWizard', () => ({
    useDiagnosisWizard: vi.fn()
}))

vi.mock('@/contexts/DeveloperContext', () => ({
    useDeveloper: vi.fn()
}))

// Mock child components to focus on layout
vi.mock('./BasicInfoForm', () => ({
    BasicInfoForm: () => <div data-testid="basic-info-form">Basic Info Form</div>
}))

vi.mock('./ProgressStepper', () => ({
    ProgressStepper: () => <div data-testid="progress-stepper">Progress Stepper</div>
}))

describe('DiagnosisWizard - Responsive Layout', () => {
    const mockUseDiagnosisWizard = useDiagnosisWizard as ReturnType<typeof vi.fn>
    const mockUseDeveloper = useDeveloper as ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()

        // Default mock implementation
        mockUseDeveloper.mockReturnValue({
            isDeveloperMode: false
        })

        mockUseDiagnosisWizard.mockReturnValue({
            step: 'basic_info',
            setStep: vi.fn(),
            data: {},
            setData: vi.fn(),
            isAnalyzing: false,
            analysisResult: null,
            setAnalysisResult: vi.fn(),
            completion: '',
            setCompletion: vi.fn(),
            isLoading: false,
            error: null,
            isSaved: false,
            setIsSaved: vi.fn(),
            maxStepReached: 0,
            celebrationPhase: null,
            setCelebrationPhase: vi.fn(),
            pendingResumeState: null,
            handleResumeProgress: vi.fn(),
            handleStartNew: vi.fn(),
            nextStep: vi.fn(),
            prevStep: vi.fn(),
            analyzeImage: vi.fn(),
            handleSkipAnalysis: vi.fn(),
            submitConsultation: vi.fn(),
            STEPS: [],
            t: {},
            language: 'en'
        })

        // Mock matchMedia for responsive testing
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query === '(min-width: 768px)', // Desktop breakpoint
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

    it('renders with correct mobile layout classes', () => {
        // Mock mobile viewport
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query !== '(min-width: 768px)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))

        const { container } = render(<DiagnosisWizard />)
        const mainContainer = container.firstChild as HTMLElement

        // Verify mobile classes: w-full, px-5 (not max-w-4xl on mobile)
        expect(mainContainer.className).toContain('w-full')
        expect(mainContainer.className).toContain('px-5')
        expect(mainContainer.className).not.toContain('max-w-4xl')
        // Desktop classes should be present but not active
        expect(mainContainer.className).toContain('md:max-w-4xl')
        expect(mainContainer.className).toContain('md:mx-auto')
    })

    it('renders with correct desktop layout classes', () => {
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

        const { container } = render(<DiagnosisWizard />)
        const mainContainer = container.firstChild as HTMLElement

        // Verify desktop classes are present
        expect(mainContainer.className).toContain('w-full')
        expect(mainContainer.className).toContain('md:max-w-4xl')
        expect(mainContainer.className).toContain('md:mx-auto')
        expect(mainContainer.className).toContain('md:px-6')
    })

    it('maintains padding structure for bottom navigation on mobile', () => {
        const { container } = render(<DiagnosisWizard />)
        const mainContainer = container.firstChild as HTMLElement

        // Verify pb-24 is present for bottom navigation spacing
        expect(mainContainer.className).toContain('pb-24')
    })

    it('handles null data gracefully', () => {
        mockUseDiagnosisWizard.mockReturnValue({
            ...mockUseDiagnosisWizard(),
            data: null
        })

        const { container } = render(<DiagnosisWizard />)
        const mainContainer = container.firstChild as HTMLElement

        // Should still render with correct layout classes
        expect(mainContainer.className).toContain('w-full')
        expect(mainContainer.className).toContain('px-5')
    })
})

