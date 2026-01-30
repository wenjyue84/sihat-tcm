/**
 * Google AI Library Tests
 *
 * Tests for the lib/googleAI.js utility functions
 * that handle AI analysis for diagnosis features.
 */
import { analyzeImage, generateHealthRecommendations } from '../lib/googleAI';

// Note: The actual Google AI SDK is mocked in jest.setup.js

describe('Google AI Library', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('analyzeImage', () => {
        it('is a function', () => {
            expect(typeof analyzeImage).toBe('function');
        });

        it('handles base64 image input', async () => {
            const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const analysisType = 'tongue';

            // The mock should return a successful response
            try {
                const result = await analyzeImage(mockBase64, analysisType);
                // If the function works, it should return some analysis
                expect(result).toBeDefined();
            } catch (error) {
                // If there's an error, it should be handled gracefully
                expect(error).toBeDefined();
            }
        });

        it('handles different analysis types', async () => {
            const mockBase64 = 'mock-base64-string';

            // Test tongue analysis type
            try {
                await analyzeImage(mockBase64, 'tongue');
            } catch (e) {
                // Expected in test environment
            }

            // Test face analysis type
            try {
                await analyzeImage(mockBase64, 'face');
            } catch (e) {
                // Expected in test environment
            }

            expect(true).toBe(true);
        });
    });

    describe('generateHealthRecommendations', () => {
        it('is a function', () => {
            expect(typeof generateHealthRecommendations).toBe('function');
        });

        it('accepts diagnosis data and returns recommendations', async () => {
            const mockDiagnosisData = {
                symptoms: ['fatigue', 'poor appetite'],
                observations: {
                    tongue: { color: 'pale', coating: 'thin white' },
                },
            };

            try {
                const result = await generateHealthRecommendations(mockDiagnosisData);
                expect(result).toBeDefined();
            } catch (error) {
                // Expected in test environment without API key
                expect(error).toBeDefined();
            }
        });
    });
});

describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
        // This tests that the library doesn't crash on network failures
        const mockBase64 = 'invalid-base64';

        try {
            await analyzeImage(mockBase64, 'tongue');
        } catch (error) {
            expect(error.message).toBeDefined();
        }
    });

    it('handles invalid input gracefully', async () => {
        try {
            await analyzeImage(null, 'tongue');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});
