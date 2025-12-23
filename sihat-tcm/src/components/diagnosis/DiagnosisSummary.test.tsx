import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test-utils'
import { DiagnosisSummary } from './DiagnosisSummary'
import { translations } from '@/lib/translations'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'

// Mock Data
const mockData = {
    basic_info: {
        name: 'Test Patient',
        age: '30',
        gender: 'male',
        height: '175',
        weight: '70',
        symptoms: 'Headache',
        symptomDuration: '2 days'
    },
    wang_tongue: { image: 'test-tongue.jpg', observation: 'Pale tongue' },
    wang_face: { image: 'test-face.jpg', observation: 'Pale complexion' },
    wen_inquiry: { summary: 'Patient reports headache.' },
    qie: { bpm: 75, pulseQualities: [{ nameEn: 'Slippery' }] },
    wen_audio: { analysis: 'Strong voice' }
}

// Helper to simulate the Layout which renders buttons based on Context
const NavigationControls = () => {
    const { navigationState } = useDiagnosisProgress()

    return (
        <div data-testid="nav-controls">
            {navigationState.showNext && (
                <button
                    onClick={navigationState.onNext}
                    disabled={!navigationState.canNext && navigationState.canNext !== undefined} // Handle specific canNext logic if needed
                >
                    Next
                </button>
            )}
            {navigationState.showBack && (
                <button onClick={navigationState.onBack}>
                    Back
                </button>
            )}
        </div>
    )
}

describe('DiagnosisSummary', () => {
    const mockOnConfirm = vi.fn()
    const mockOnBack = vi.fn()
    const t = translations.en

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
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

    it('renders initial observations step', () => {
        render(
            <>
                <DiagnosisSummary
                    data={mockData}
                    onConfirm={mockOnConfirm}
                    onBack={mockOnBack}
                />
                <NavigationControls />
            </>
        )

        // Title check
        expect(screen.getByText(t.diagnosisSummary.title)).toBeInTheDocument()

        // Check for observations (wang_tongue is in the first step)
        expect(screen.getByText(/Pale tongue/)).toBeInTheDocument()

        // Check section title
        // Note: It appears multiple times (in progress bar and in the card), so use getAllByText
        const titles = screen.getAllByText(t.diagnosisSummary.sections.wangTongue)
        expect(titles.length).toBeGreaterThan(0)
    })

    it('navigates through internal steps and calls onConfirm', async () => {
        render(
            <>
                <DiagnosisSummary
                    data={mockData}
                    onConfirm={mockOnConfirm}
                    onBack={mockOnBack}
                />
                <NavigationControls />
            </>
        )

        // Wait for usage of setNavigationState in useEffect
        const nextBtn = await screen.findByText('Next')

        // Step 1: Observations -> Click Next
        fireEvent.click(nextBtn)

        // Step 2: Inquiry
        expect(await screen.findByText(t.diagnosisSummary.sections.wenInquiry)).toBeInTheDocument()
        fireEvent.click(nextBtn)

        // Step 3: Options
        expect(await screen.findByText(t.diagnosisSummary.reportOptions.title)).toBeInTheDocument()

        // Step 4: Confirm (Last Next click)
        fireEvent.click(nextBtn)

        expect(mockOnConfirm).toHaveBeenCalled()
    })
})
