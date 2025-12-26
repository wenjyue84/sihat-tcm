/**
 * Tests for ImageQualityOverlay components
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ImageQualityOverlay } from './ImageQualityOverlay'
import { CompositionGuideOverlay } from './CompositionGuideOverlay'
import { ImageQualityResult } from '@/lib/imageQualityValidator'

// Mock the useLanguage hook
vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: {
            camera: {
                referenceGuide: 'Reference Guide',
                guideLabels: {
                    tongue: 'Position tongue here',
                    face: 'Center your face here',
                    body: 'Position body area here'
                }
            }
        }
    })
}))

describe('ImageQualityOverlay', () => {
    const mockQualityResult: ImageQualityResult = {
        overall: 'good',
        score: 75,
        issues: [
            {
                type: 'lighting',
                severity: 'medium',
                message: 'Lighting could be improved',
                confidence: 0.7
            }
        ],
        suggestions: ['Move to better lighting']
    }

    it('should render quality overlay when visible', () => {
        const { container } = render(
            <ImageQualityOverlay
                qualityResult={mockQualityResult}
                isVisible={true}
            />
        )

        expect(container.firstChild).toBeTruthy()
    })

    it('should not render when not visible', () => {
        const { container } = render(
            <ImageQualityOverlay
                qualityResult={mockQualityResult}
                isVisible={false}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('should not render when no quality result', () => {
        const { container } = render(
            <ImageQualityOverlay
                qualityResult={null}
                isVisible={true}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('should handle different quality levels', () => {
        const qualityLevels: Array<'excellent' | 'good' | 'fair' | 'poor'> = [
            'excellent', 'good', 'fair', 'poor'
        ]

        qualityLevels.forEach(level => {
            const result: ImageQualityResult = {
                overall: level,
                score: level === 'excellent' ? 95 : level === 'good' ? 75 : level === 'fair' ? 55 : 25,
                issues: [],
                suggestions: []
            }

            const { container } = render(
                <ImageQualityOverlay
                    qualityResult={result}
                    isVisible={true}
                />
            )

            expect(container.firstChild).toBeTruthy()
        })
    })
})

describe('CompositionGuideOverlay', () => {
    it('should render composition guide when visible', () => {
        const { container } = render(
            <CompositionGuideOverlay
                isVisible={true}
                mode="face"
            />
        )

        expect(container.firstChild).toBeTruthy()
    })

    it('should not render when not visible', () => {
        const { container } = render(
            <CompositionGuideOverlay
                isVisible={false}
                mode="face"
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('should handle different modes', () => {
        const modes: ('tongue' | 'face' | 'body')[] = ['tongue', 'face', 'body']

        modes.forEach(mode => {
            const { container } = render(
                <CompositionGuideOverlay
                    isVisible={true}
                    mode={mode}
                />
            )

            expect(container.firstChild).toBeTruthy()
        })
    })
})
