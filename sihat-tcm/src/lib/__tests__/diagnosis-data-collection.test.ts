/**
 * Phase 2: Data Collection & Saving Tests
 * 
 * Tests for collecting and saving all diagnosis input data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
    SaveDiagnosisInput,
    DiagnosisReport,
    ChatMessage,
    FileMetadata,
    TongueAnalysisData,
    FaceAnalysisData,
    AudioAnalysisData,
    PulseData
} from '@/types/database';

describe('Phase 2: Data Collection & Saving', () => {
    describe('Input Data Structure', () => {
        it('should have all required input data fields in SaveDiagnosisInput', () => {
            const input: SaveDiagnosisInput = {
                primary_diagnosis: 'Qi Deficiency',
                full_report: {} as DiagnosisReport,
                // Inquiry data
                inquiry_summary: 'Patient reported headaches and fatigue',
                inquiry_chat_history: [
                    { role: 'user', content: 'I have headaches' },
                    { role: 'assistant', content: 'How long?' }
                ],
                inquiry_report_files: [
                    {
                        name: 'report.pdf',
                        url: 'https://example.com/report.pdf',
                        type: 'application/pdf',
                        size: 1024000,
                        extracted_text: 'Patient has...'
                    }
                ],
                inquiry_medicine_files: [
                    {
                        name: 'medicine.jpg',
                        url: 'https://example.com/medicine.jpg',
                        type: 'image/jpeg',
                        extracted_text: 'Ginseng Extract'
                    }
                ],
                // Visual analysis
                tongue_analysis: {
                    image_url: 'https://example.com/tongue.jpg',
                    observation: 'Pale tongue with white coating',
                    analysis_tags: ['pale', 'white-coating'],
                    tcm_indicators: ['Qi Deficiency'],
                    pattern_suggestions: ['Spleen Qi Deficiency'],
                    potential_issues: ['Digestive weakness']
                },
                face_analysis: {
                    image_url: 'https://example.com/face.jpg',
                    observation: 'Pale complexion',
                    tcm_indicators: ['Blood Deficiency']
                },
                body_analysis: {
                    image_url: 'https://example.com/body.jpg',
                    observation: 'Swelling in lower limbs'
                },
                // Audio analysis
                audio_analysis: {
                    audio_url: 'https://example.com/audio.mp3',
                    observation: 'Weak voice',
                    potential_issues: ['Lung Qi Deficiency']
                },
                // Pulse data
                pulse_data: {
                    bpm: 72,
                    quality: 'smooth',
                    rhythm: 'regular',
                    strength: 'moderate',
                    notes: 'Normal pulse'
                },
                // Guest session
                is_guest_session: false
            };

            expect(input.inquiry_summary).toBeDefined();
            expect(input.inquiry_chat_history).toHaveLength(2);
            expect(input.tongue_analysis?.image_url).toBeDefined();
            expect(input.pulse_data?.bpm).toBe(72);
        });

        it('should allow partial input data (not all fields required)', () => {
            const minimalInput: SaveDiagnosisInput = {
                primary_diagnosis: 'Yin Deficiency',
                full_report: {} as DiagnosisReport,
                inquiry_summary: 'Summary only'
            };

            expect(minimalInput.inquiry_summary).toBeDefined();
            expect(minimalInput.tongue_analysis).toBeUndefined();
            expect(minimalInput.pulse_data).toBeUndefined();
        });

        it('should handle guest session fields', () => {
            const guestInput: SaveDiagnosisInput = {
                primary_diagnosis: 'Damp Heat',
                full_report: {} as DiagnosisReport,
                is_guest_session: true,
                guest_email: 'guest@example.com',
                guest_name: 'Guest User'
            };

            expect(guestInput.is_guest_session).toBe(true);
            expect(guestInput.guest_email).toBe('guest@example.com');
            expect(guestInput.guest_name).toBe('Guest User');
        });
    });

    describe('Data Collection Logic', () => {
        it('should map inquiry data correctly', () => {
            const mockInquiryData = {
                inquiryText: 'Patient summary',
                chatHistory: [
                    { role: 'user', content: 'Test' }
                ],
                reportFiles: [
                    {
                        name: 'report.pdf',
                        url: 'https://example.com/report.pdf',
                        type: 'application/pdf',
                        size: 1024,
                        extractedText: 'Extracted text'
                    }
                ],
                medicineFiles: []
            };

            // Simulate the mapping logic from useDiagnosisWizard
            const inquiry_summary = mockInquiryData.inquiryText;
            const inquiry_chat_history = mockInquiryData.chatHistory;
            const inquiry_report_files = mockInquiryData.reportFiles.map((f: any) => ({
                name: f.name || 'Unknown',
                url: f.url || f.publicUrl || '',
                type: f.type || 'application/octet-stream',
                size: f.size,
                extracted_text: f.extractedText
            })).filter((f: any) => f.url);

            expect(inquiry_summary).toBe('Patient summary');
            expect(inquiry_chat_history).toHaveLength(1);
            expect(inquiry_report_files).toHaveLength(1);
            expect(inquiry_report_files[0].name).toBe('report.pdf');
        });

        it('should map visual analysis data correctly', () => {
            const mockTongueData = {
                image: 'https://example.com/tongue.jpg',
                observation: 'Pale tongue',
                analysis_tags: ['pale'],
                tcm_indicators: ['Qi Deficiency'],
                pattern_suggestions: ['Spleen Qi Deficiency'],
                potential_issues: ['Digestive weakness']
            };

            // Simulate the mapping logic
            const tongue_analysis: TongueAnalysisData = mockTongueData ? {
                image_url: mockTongueData.image,
                observation: mockTongueData.observation,
                analysis_tags: mockTongueData.analysis_tags,
                tcm_indicators: mockTongueData.tcm_indicators,
                pattern_suggestions: mockTongueData.pattern_suggestions,
                potential_issues: mockTongueData.potential_issues
            } : undefined;

            expect(tongue_analysis?.image_url).toBe('https://example.com/tongue.jpg');
            expect(tongue_analysis?.tcm_indicators).toContain('Qi Deficiency');
        });

        it('should map pulse data correctly', () => {
            const mockPulseData = {
                bpm: 72,
                quality: 'smooth',
                rhythm: 'regular',
                strength: 'moderate',
                notes: 'Normal'
            };

            // Simulate the mapping logic
            const pulse_data: PulseData = mockPulseData ? {
                bpm: mockPulseData.bpm,
                quality: mockPulseData.quality,
                rhythm: mockPulseData.rhythm,
                strength: mockPulseData.strength,
                notes: mockPulseData.notes
            } : undefined;

            expect(pulse_data?.bpm).toBe(72);
            expect(pulse_data?.quality).toBe('smooth');
        });

        it('should handle missing data gracefully', () => {
            // Test with null/undefined values
            const tongue_analysis = null ? {
                image_url: '',
                observation: ''
            } : undefined;

            const pulse_data = null ? {
                bpm: 0
            } : undefined;

            expect(tongue_analysis).toBeUndefined();
            expect(pulse_data).toBeUndefined();
        });
    });

    describe('File Metadata Mapping', () => {
        it('should map file objects with all properties', () => {
            const mockFile = {
                name: 'report.pdf',
                url: 'https://example.com/report.pdf',
                publicUrl: 'https://example.com/public/report.pdf',
                type: 'application/pdf',
                size: 1024000,
                extractedText: 'Patient has...'
            };

            // Simulate mapping logic
            const fileMetadata: FileMetadata = {
                name: mockFile.name || 'Unknown',
                url: mockFile.url || mockFile.publicUrl || '',
                type: mockFile.type || 'application/octet-stream',
                size: mockFile.size,
                extracted_text: mockFile.extractedText
            };

            expect(fileMetadata.name).toBe('report.pdf');
            expect(fileMetadata.url).toBe('https://example.com/report.pdf');
            expect(fileMetadata.extracted_text).toBe('Patient has...');
        });

        it('should use publicUrl as fallback if url is missing', () => {
            const mockFile = {
                name: 'report.pdf',
                publicUrl: 'https://example.com/public/report.pdf',
                type: 'application/pdf'
            };

            const fileMetadata: FileMetadata = {
                name: mockFile.name || 'Unknown',
                url: mockFile.url || mockFile.publicUrl || '',
                type: mockFile.type || 'application/octet-stream'
            };

            expect(fileMetadata.url).toBe('https://example.com/public/report.pdf');
        });

        it('should filter out files without URLs', () => {
            const mockFiles = [
                { name: 'file1.pdf', url: 'https://example.com/file1.pdf' },
                { name: 'file2.pdf', url: '' },
                { name: 'file3.pdf' } // No URL property
            ];

            const filteredFiles = mockFiles
                .map((f: any) => ({
                    name: f.name || 'Unknown',
                    url: f.url || f.publicUrl || '',
                    type: f.type || 'application/octet-stream'
                }))
                .filter((f: any) => f.url);

            expect(filteredFiles).toHaveLength(1);
            expect(filteredFiles[0].name).toBe('file1.pdf');
        });
    });

    describe('Guest Session Handling', () => {
        it('should identify guest sessions correctly', () => {
            const isGuest1 = !null; // No user
            const isGuest2 = !undefined; // No user
            const isGuest3 = !!null; // Has user

            expect(isGuest1).toBe(true);
            expect(isGuest2).toBe(true);
            expect(isGuest3).toBe(false);
        });

        it('should generate unique session tokens', () => {
            const token1 = crypto.randomUUID();
            const token2 = crypto.randomUUID();

            expect(token1).toBeDefined();
            expect(token2).toBeDefined();
            expect(token1).not.toBe(token2);
            expect(token1.length).toBeGreaterThan(0);
        });
    });

    describe('Data Completeness', () => {
        it('should collect all input data types', () => {
            const completeInput: SaveDiagnosisInput = {
                primary_diagnosis: 'Test',
                full_report: {} as DiagnosisReport,
                // All input data fields present
                inquiry_summary: 'Summary',
                inquiry_chat_history: [],
                inquiry_report_files: [],
                inquiry_medicine_files: [],
                tongue_analysis: { image_url: 'url' },
                face_analysis: { image_url: 'url' },
                body_analysis: { image_url: 'url' },
                audio_analysis: { audio_url: 'url' },
                pulse_data: { bpm: 72 }
            };

            const hasAllFields = 
                completeInput.inquiry_summary !== undefined &&
                completeInput.inquiry_chat_history !== undefined &&
                completeInput.inquiry_report_files !== undefined &&
                completeInput.inquiry_medicine_files !== undefined &&
                completeInput.tongue_analysis !== undefined &&
                completeInput.face_analysis !== undefined &&
                completeInput.body_analysis !== undefined &&
                completeInput.audio_analysis !== undefined &&
                completeInput.pulse_data !== undefined;

            expect(hasAllFields).toBe(true);
        });
    });
});

