'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const MODELS_TO_TEST = [
    { id: 'gemini-3.0-preview', name: 'Master (Gemini 3.0 Preview)' },
    { id: 'gemini-2.5-pro', name: 'Expert (Gemini 2.5 Pro)' },
    { id: 'gemini-2.0-flash', name: 'Physician (Gemini 2.0 Flash)' },
    // Adding 1.5 models as control group to verify API key works at all
    { id: 'gemini-1.5-pro', name: 'Control: Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Control: Gemini 1.5 Flash' },
]

export default function TestModelsPage() {
    const [results, setResults] = useState<Record<string, { status: 'loading' | 'success' | 'error', message?: string, time?: number }>>({})

    const testModel = async (modelId: string) => {
        setResults(prev => ({
            ...prev,
            [modelId]: { status: 'loading' }
        }))

        const startTime = Date.now()

        try {
            const response = await fetch('/api/test-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelId,
                    prompt: 'Hello, are you working? Reply with "Yes".'
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || response.statusText)
            }

            // Read stream
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let content = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    content += decoder.decode(value)
                }
            }

            const endTime = Date.now()
            setResults(prev => ({
                ...prev,
                [modelId]: {
                    status: 'success',
                    message: content,
                    time: endTime - startTime
                }
            }))

        } catch (error: any) {
            setResults(prev => ({
                ...prev,
                [modelId]: {
                    status: 'error',
                    message: error.message
                }
            }))
        }
    }

    const testAll = () => {
        MODELS_TO_TEST.forEach(m => testModel(m.id))
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Gemini Model Availability Test</h1>
                <p className="text-stone-600">
                    Test if the configured models are accessible with your current API key.
                </p>
            </div>

            <div className="grid gap-4">
                <Button onClick={testAll} className="w-full md:w-auto mb-4">
                    Test All Models
                </Button>

                {MODELS_TO_TEST.map(model => (
                    <Card key={model.id} className="overflow-hidden">
                        <div className="flex items-center p-4 gap-4">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{model.name}</h3>
                                <code className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600">
                                    {model.id}
                                </code>
                            </div>

                            <div className="flex items-center gap-4">
                                {results[model.id]?.status === 'loading' && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm font-medium">Testing...</span>
                                    </div>
                                )}

                                {results[model.id]?.status === 'success' && (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle className="w-6 h-6" />
                                        <div className="text-right">
                                            <span className="block text-sm font-bold">Working</span>
                                            <span className="block text-xs text-emerald-600/80">{results[model.id].time}ms</span>
                                        </div>
                                    </div>
                                )}

                                {results[model.id]?.status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="w-6 h-6" />
                                        <div className="text-right">
                                            <span className="block text-sm font-bold">Failed</span>
                                        </div>
                                    </div>
                                )}

                                {!results[model.id] && (
                                    <Button variant="outline" size="sm" onClick={() => testModel(model.id)}>
                                        Test
                                    </Button>
                                )}
                            </div>
                        </div>

                        {results[model.id]?.status === 'error' && (
                            <div className="bg-red-50 p-4 border-t border-red-100 text-sm text-red-800 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Error Message:</p>
                                    <p className="font-mono mt-1">{results[model.id].message}</p>
                                </div>
                            </div>
                        )}

                        {results[model.id]?.status === 'success' && (
                            <div className="bg-emerald-50 p-4 border-t border-emerald-100 text-sm text-emerald-800">
                                <p className="font-semibold text-xs uppercase tracking-wider mb-1 text-emerald-600">Response:</p>
                                <p>{results[model.id].message}</p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    )
}
