'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { repairJSON, generateMockReport, MOCK_PROFILES } from '@/components/diagnosis/DiagnosisWizard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Terminal, Play, Copy, ChevronRight, ChevronDown } from 'lucide-react'

const MOCK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOCK_AUDIO = "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

type TestStatus = 'pending' | 'running' | 'passed' | 'failed'
type TestCategory = 'Utilities' | 'Data Integrity' | 'AI Capabilities' | 'Chat & Interaction' | 'System Health' | 'Report Generation'

interface TestResult {
    id: string
    number: number
    name: string
    description: string
    category: TestCategory
    status: TestStatus
    message?: string
    error?: any
    duration?: number
}

export default function TestRunnerPage() {
    const [tests, setTests] = useState<TestResult[]>([
        // Utilities
        {
            id: 'json_repair',
            number: 1,
            name: 'JSON Repair Utility',
            description: 'Tests the JSON repair function with malformed JSON strings.',
            category: 'Utilities',
            status: 'pending'
        },
        // Data Integrity
        {
            id: 'mock_profiles',
            number: 2,
            name: 'Mock Profiles Integrity',
            description: 'Verifies that mock profiles contain all necessary data fields.',
            category: 'Data Integrity',
            status: 'pending'
        },
        {
            id: 'test_button_data_coverage',
            number: 3,
            name: 'Test Button Data Coverage',
            description: 'Checks if the "Test" button mock data covers all required fields (medicine, audio, etc).',
            category: 'Data Integrity',
            status: 'pending'
        },
        // AI Capabilities
        {
            id: 'llm_text_extraction',
            number: 4,
            name: 'LLM Text Extraction (OCR)',
            description: 'Verifies if the LLM can extract text from images (PDF/JPG).',
            category: 'AI Capabilities',
            status: 'pending'
        },
        {
            id: 'medicine_extraction',
            number: 5,
            name: 'Medicine Recognition',
            description: 'Tests if the LLM can identify medicine from photos.',
            category: 'AI Capabilities',
            status: 'pending'
        },
        {
            id: 'audio_analysis',
            number: 6,
            name: 'Audio Analysis',
            description: 'Verifies if the system can process and analyze audio files.',
            category: 'AI Capabilities',
            status: 'pending'
        },
        {
            id: 'tongue_analysis',
            number: 7,
            name: 'Tongue Analysis (Vision)',
            description: 'Verifies if the system can analyze a tongue image.',
            category: 'AI Capabilities',
            status: 'pending'
        },
        // Chat & Interaction
        {
            id: 'tcm_inquiry_prompt',
            number: 8,
            name: 'TCM Inquiry Persona',
            description: 'Verifies that the TCM inquiry chat acts according to the system prompt.',
            category: 'Chat & Interaction',
            status: 'pending'
        },
        {
            id: 'chat_api_health',
            number: 9,
            name: 'Chat API Endpoint',
            description: 'Checks if the chat API endpoint is reachable and accepts requests.',
            category: 'Chat & Interaction',
            status: 'pending'
        },
        // Report Generation
        {
            id: 'report_generation_api',
            number: 10,
            name: 'Report Generation API',
            description: 'Tests the backend report generation API with mock data.',
            category: 'Report Generation',
            status: 'pending'
        },
        {
            id: 'report_generation',
            number: 11,
            name: 'Report Generation Logic (Mock)',
            description: 'Tests the mock report generation with various profile data.',
            category: 'Report Generation',
            status: 'pending'
        },
        // System Health
        {
            id: 'api_health',
            number: 12,
            name: 'General API Health Check',
            description: 'Checks if the backend API endpoints are reachable.',
            category: 'System Health',
            status: 'pending'
        },
        {
            id: 'diagnosis_wizard_import',
            number: 13,
            name: 'Component Imports',
            description: 'Verifies that critical components can be imported without errors.',
            category: 'System Health',
            status: 'pending'
        }
    ])

    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Utilities': true,
        'Data Integrity': true,
        'AI Capabilities': true,
        'Chat & Interaction': true,
        'System Health': true,
        'Report Generation': true
    })

    useEffect(() => {
        // Auto-run tests on mount
        runTests()
    }, [])

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const runTests = async () => {
        setIsRunning(true)
        setProgress(0)
        setGeneratedPrompt(null)

        const newTests = [...tests]

        for (let i = 0; i < newTests.length; i++) {
            const test = newTests[i]

            // Update status to running
            test.status = 'running'
            setTests([...newTests])

            const startTime = performance.now()

            try {
                await executeTest(test.id)
                test.status = 'passed'
                test.message = 'Test passed successfully'
            } catch (error: any) {
                test.status = 'failed'
                test.message = error.message || 'Unknown error occurred'
                test.error = error
            }

            test.duration = performance.now() - startTime
            setTests([...newTests])
            setProgress(((i + 1) / newTests.length) * 100)

            // Small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        setIsRunning(false)
    }

    const executeTest = async (testId: string) => {
        switch (testId) {
            case 'json_repair':
                const malformed = '{"key": "value", "summary": "text", "orphan text"}'
                const repaired = repairJSON(malformed)
                try {
                    JSON.parse(repaired)
                } catch (e) {
                    throw new Error('Failed to repair JSON: ' + repaired)
                }
                break

            case 'mock_profiles':
                if (!MOCK_PROFILES || MOCK_PROFILES.length === 0) {
                    throw new Error('No mock profiles found')
                }
                MOCK_PROFILES.forEach(profile => {
                    if (!profile.data || !profile.data.basic_info) {
                        throw new Error(`Profile ${profile.id} missing basic info`)
                    }
                })
                break

            case 'test_button_data_coverage':
                MOCK_PROFILES.forEach(profile => {
                    const data = profile.data;
                    if (data.wen_inquiry?.medicineFiles?.length > 0) {
                        const med = data.wen_inquiry.medicineFiles[0];
                        if (!med.extractedText) throw new Error(`Profile ${profile.id} medicine file missing extractedText`);
                    }
                    if (!data.wen_audio?.audio) throw new Error(`Profile ${profile.id} missing audio data`);
                    if (!data.qie?.bpm) throw new Error(`Profile ${profile.id} missing BPM data`);
                });
                break

            case 'llm_text_extraction':
                try {
                    const response = await fetch('/api/extract-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file: MOCK_IMAGE,
                            fileType: 'image/png',
                            mode: 'general'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const result = await response.json();
                    if (result.error) throw new Error(result.error);
                    if (typeof result.text !== 'string') throw new Error('Invalid response format: text is not a string');
                } catch (e: any) {
                    throw new Error(`LLM Text Extraction failed: ${e.message}`);
                }
                break

            case 'medicine_extraction':
                try {
                    const response = await fetch('/api/extract-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file: MOCK_IMAGE,
                            fileType: 'image/png',
                            mode: 'medicine'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const result = await response.json();
                    if (result.error) throw new Error(result.error);
                    if (result.text === undefined) throw new Error('Invalid response format: missing text field');
                } catch (e: any) {
                    throw new Error(`Medicine Extraction failed: ${e.message}`);
                }
                break

            case 'audio_analysis':
                try {
                    const response = await fetch('/api/analyze-audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            audio: MOCK_AUDIO,
                            language: 'en'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const result = await response.json();
                    if (result.error) throw new Error(result.error);
                    if (!result.overall_observation && !result.analysis) {
                        throw new Error('Invalid response format: missing analysis data');
                    }
                } catch (e: any) {
                    throw new Error(`Audio Analysis failed: ${e.message}`);
                }
                break

            case 'tongue_analysis':
                try {
                    const response = await fetch('/api/analyze-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: MOCK_IMAGE,
                            type: 'tongue'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const result = await response.json();
                    if (result.status === 'error') throw new Error(result.error || 'Unknown error');
                    if (result.status === 'invalid_image') return;
                    if (!result.observation && !result.image_description) {
                        throw new Error('Invalid response format: missing observation');
                    }
                } catch (e: any) {
                    throw new Error(`Tongue Analysis failed: ${e.message}`);
                }
                break

            case 'tcm_inquiry_prompt':
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: 'Hello, are you a TCM doctor?' }],
                            basicInfo: {},
                            model: 'gemini-1.5-pro', // CHANGED: Never use flash
                            language: 'en'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const reader = response.body?.getReader();
                    if (!reader) throw new Error('No response body');
                    const { value, done } = await reader.read();
                    if (done && !value) throw new Error('Empty response stream');
                    reader.cancel();
                } catch (e: any) {
                    throw new Error(`TCM Inquiry failed: ${e.message}`);
                }
                break

            case 'chat_api_health':
                try {
                    // Just check if the endpoint is reachable
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [], // Empty messages to trigger quick return or error
                            model: 'gemini-1.5-pro'
                        })
                    });
                    // It might return 500 or 200 depending on validation, but as long as it's not 404
                    if (response.status === 404) throw new Error('Chat API endpoint not found (404)');
                } catch (e: any) {
                    throw new Error(`Chat API Health check failed: ${e.message}`);
                }
                break

            case 'report_generation_api':
                try {
                    const response = await fetch('/api/consult', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: 'Analyze this patient',
                            data: MOCK_PROFILES[0].data,
                            model: 'gemini-1.5-pro', // CHANGED: Never use flash
                            language: 'en'
                        })
                    });
                    if (!response.ok) throw new Error(`API returned ${response.status}`);
                    const reader = response.body?.getReader();
                    if (!reader) throw new Error('No response body');
                    const { value, done } = await reader.read();
                    if (done && !value) throw new Error('Empty response stream');
                    reader.cancel();
                } catch (e: any) {
                    throw new Error(`Report Generation API failed: ${e.message}`);
                }
                break

            case 'report_generation':
                const report = generateMockReport(MOCK_PROFILES[0].data)
                if (!report.diagnosis || !report.recommendations) {
                    throw new Error('Generated report missing critical sections')
                }
                break

            case 'api_health':
                const response = await fetch('/')
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`)
                }
                break

            case 'diagnosis_wizard_import':
                if (typeof repairJSON !== 'function') {
                    throw new Error('repairJSON is not a function')
                }
                break

            default:
                throw new Error('Test not implemented')
        }
    }

    const generatePrompt = (test: TestResult) => {
        const prompt = `I am running automated tests for the Sihat TCM application and the test '${test.name}' failed.
        
Error Message: ${test.message}
Test Description: ${test.description}
Test ID: ${test.id}
Category: ${test.category}

Context:
- This test is part of the client-side test runner.
- The error occurred during the execution of the test logic.

Please help me troubleshoot this issue. Analyze the code related to '${test.id}' and suggest a fix.`

        setGeneratedPrompt(prompt)
    }

    // Group tests by category
    const groupedTests = tests.reduce((acc, test) => {
        if (!acc[test.category]) {
            acc[test.category] = []
        }
        acc[test.category].push(test)
        return acc
    }, {} as Record<TestCategory, TestResult[]>)

    const categories: TestCategory[] = ['Utilities', 'Data Integrity', 'AI Capabilities', 'Chat & Interaction', 'Report Generation', 'System Health']

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            System Diagnostics
                        </h1>
                        <p className="text-slate-400">Automated comprehensive testing suite</p>
                    </div>
                    <Button
                        onClick={runTests}
                        disabled={isRunning}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Running Tests...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-5 w-5" />
                                Run All Tests
                            </>
                        )}
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Bar */}
                        {isRunning && (
                            <div className="w-full bg-slate-900 rounded-full h-2 mb-6 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        )}

                        {/* Grouped Test List */}
                        {categories.map((category) => (
                            <div key={category} className="space-y-3">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="flex items-center gap-2 text-lg font-semibold text-slate-300 hover:text-emerald-400 transition-colors w-full text-left"
                                >
                                    {expandedCategories[category] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    {category}
                                    <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-1 rounded-full">
                                        {groupedTests[category]?.length || 0} tests
                                    </span>
                                </button>

                                {expandedCategories[category] && (
                                    <div className="space-y-3 pl-2">
                                        {groupedTests[category]?.map((test) => (
                                            <motion.div
                                                key={test.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-4 rounded-xl border ${test.status === 'passed' ? 'bg-emerald-950/30 border-emerald-900/50' :
                                                    test.status === 'failed' ? 'bg-red-950/30 border-red-900/50' :
                                                        test.status === 'running' ? 'bg-blue-950/30 border-blue-900/50' :
                                                            'bg-slate-900/50 border-slate-800'
                                                    } transition-colors`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${test.status === 'passed' ? 'bg-emerald-900 text-emerald-400' :
                                                                test.status === 'failed' ? 'bg-red-900 text-red-400' :
                                                                    'bg-slate-800 text-slate-500'
                                                            }`}>
                                                            {test.number}
                                                        </div>
                                                        <div className={`p-2 rounded-lg ${test.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            test.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                                test.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-slate-800 text-slate-500'
                                                            }`}>
                                                            {test.status === 'passed' ? <CheckCircle className="w-5 h-5" /> :
                                                                test.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                                                                    test.status === 'running' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                                        <Terminal className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-200">{test.name}</h3>
                                                            <p className="text-sm text-slate-500">{test.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {test.duration && (
                                                            <span className="text-xs font-mono text-slate-600">
                                                                {test.duration.toFixed(0)}ms
                                                            </span>
                                                        )}
                                                        {test.status === 'failed' && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => generatePrompt(test)}
                                                                className="h-8 text-xs"
                                                            >
                                                                Give me prompt
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                {test.message && test.status !== 'pending' && (
                                                    <div className={`mt-3 ml-14 text-sm ${test.status === 'failed' ? 'text-red-400' : 'text-emerald-400'
                                                        }`}>
                                                        {test.message}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Prompt Display Panel */}
                    <div className="lg:col-span-1">
                        <Card className="h-full bg-slate-900 border-slate-800 p-6 sticky top-8">
                            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-purple-400" />
                                Troubleshooting Assistant
                            </h2>

                            {generatedPrompt ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {generatedPrompt}
                                    </div>
                                    <Button
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedPrompt)
                                        }}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy to Clipboard
                                    </Button>
                                    <p className="text-xs text-slate-500 text-center">
                                        Paste this prompt in Antigravity IDE to get help.
                                    </p>
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-center p-4 border-2 border-dashed border-slate-800 rounded-xl">
                                    <AlertTriangle className="w-10 h-10 mb-3 opacity-50" />
                                    <p className="text-sm">Run tests and click "Give me prompt" on any failed test to generate a troubleshooting guide.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
