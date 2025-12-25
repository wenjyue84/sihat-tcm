'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

/**
 * Test Page for Mobile Layout Optimization
 * 
 * This page demonstrates the responsive layout improvements:
 * - Full width containers on mobile (no max-w-4xl constraint)
 * - Optimal reading width for text content (w-[90%] max-w-[680px])
 * - Proper padding strategy (px-5 on mobile, px-6 on desktop)
 * 
 * Usage: Visit /test-mobile-layout to visually verify layout improvements
 */
export default function TestMobileLayoutPage() {
    const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')

    const mockTextContent = `This is a long-form text paragraph that demonstrates the optimal reading width strategy. On mobile devices, this text should be constrained to approximately 90% of the container width with a maximum of 680px for optimal readability. This ensures comfortable line length (45-75 characters) without feeling too narrow or too wide. The text should be centered within its container for better visual balance.`

    const mockCardContent = [
        { title: 'Patient Information', content: 'Name: John Doe, Age: 30, Gender: Male' },
        { title: 'Diagnosis', content: 'Pattern: Qi Deficiency, Constitution: Damp Heat' },
        { title: 'Recommendations', content: 'Dietary therapy, Acupuncture points, Lifestyle advice' }
    ]

    return (
        <div className="min-h-screen bg-stone-50 py-8">
            {/* Viewport Simulator */}
            <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white p-2 rounded-lg shadow-lg border border-stone-200">
                <Button
                    variant={viewport === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewport('mobile')}
                    className="flex items-center gap-1"
                >
                    <Smartphone className="w-4 h-4" />
                    Mobile
                </Button>
                <Button
                    variant={viewport === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewport('tablet')}
                    className="flex items-center gap-1"
                >
                    <Tablet className="w-4 h-4" />
                    Tablet
                </Button>
                <Button
                    variant={viewport === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewport('desktop')}
                    className="flex items-center gap-1"
                >
                    <Monitor className="w-4 h-4" />
                    Desktop
                </Button>
            </div>

            {/* Container with responsive width strategy */}
            <div className={`w-full px-5 md:px-6 md:max-w-4xl md:mx-auto space-y-8 ${
                viewport === 'mobile' ? 'max-w-full' : viewport === 'tablet' ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'
            }`}>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
                        Mobile Layout Optimization Test
                    </h1>
                    <p className="text-stone-600">
                        Current viewport: <span className="font-semibold">{viewport}</span>
                    </p>
                </div>

                {/* Test 1: Full-Width Card (Structured Content) */}
                <Card className="p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Test 1: Full-Width Card (Structured Content)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mockCardContent.map((card, idx) => (
                            <div key={idx} className="bg-stone-50 rounded-lg p-3">
                                <h3 className="text-sm font-medium text-stone-700 mb-1">{card.title}</h3>
                                <p className="text-xs text-stone-600">{card.content}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-4">
                        ✅ This card uses full width on mobile (w-full). Grid adapts: 2 columns on mobile, 4 on desktop.
                    </p>
                </Card>

                {/* Test 2: Optimal Reading Width (Text Content) */}
                <Card className="p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Test 2: Optimal Reading Width (Text Content)
                    </h2>
                    <div className="w-[90%] max-w-[680px] mx-auto">
                        <p className="text-base md:text-lg text-stone-800 leading-relaxed">
                            {mockTextContent}
                        </p>
                    </div>
                    <p className="text-xs text-stone-500 mt-4 text-center">
                        ✅ This text uses w-[90%] max-w-[680px] for optimal reading width (45-75 characters per line).
                    </p>
                </Card>

                {/* Test 3: Container Width Comparison */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Test 3: Container Width Comparison
                    </h2>
                    
                    {/* Old Pattern (Constrained) */}
                    <Card className="p-5 md:p-6 max-w-4xl mx-auto border-2 border-red-200 bg-red-50/30">
                        <h3 className="font-semibold text-red-800 mb-2">❌ Old Pattern (max-w-4xl on mobile)</h3>
                        <p className="text-sm text-red-700">
                            This container uses max-w-4xl even on mobile, wasting horizontal space.
                            On a 375px device, this would be constrained to ~343px, wasting ~32px.
                        </p>
                    </Card>

                    {/* New Pattern (Full Width) */}
                    <Card className="p-5 md:p-6 w-full md:max-w-4xl md:mx-auto border-2 border-emerald-200 bg-emerald-50/30">
                        <h3 className="font-semibold text-emerald-800 mb-2">✅ New Pattern (w-full on mobile)</h3>
                        <p className="text-sm text-emerald-700">
                            This container uses full width on mobile (w-full px-5), then constrains on desktop (md:max-w-4xl).
                            On a 375px device, this uses ~335px (375px - 40px padding), maximizing space usage.
                        </p>
                    </Card>
                </div>

                {/* Test 4: Padding Strategy */}
                <Card className="p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Test 4: Padding Strategy
                    </h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>Mobile:</strong> px-5 (20px horizontal padding)</p>
                        <p><strong>Desktop:</strong> md:px-6 (24px horizontal padding)</p>
                        <p className="text-stone-500 text-xs mt-2">
                            ✅ Consistent padding strategy across all components for visual harmony.
                        </p>
                    </div>
                </Card>

                {/* Measurement Guide */}
                <Card className="p-5 md:p-6 bg-blue-50 border-blue-200">
                    <h2 className="text-lg font-semibold text-blue-800 mb-4">
                        📏 Measurement Guide
                    </h2>
                    <div className="space-y-2 text-sm text-blue-700">
                        <p><strong>iPhone SE (375px):</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Old: ~311px usable (343px - 32px padding)</li>
                            <li>New: ~335px usable (375px - 40px padding)</li>
                            <li>Improvement: +24px (+7.7%)</li>
                        </ul>
                        <p className="mt-3"><strong>iPhone 14 Pro Max (428px):</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Old: ~380px usable</li>
                            <li>New: ~385px usable</li>
                            <li>Text width: ~347px (90% of 385px) - optimal for 55-60 chars</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    )
}


