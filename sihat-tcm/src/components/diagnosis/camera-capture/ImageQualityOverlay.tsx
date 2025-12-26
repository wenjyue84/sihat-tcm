
import React from 'react'
import { AlertTriangle, CheckCircle, Camera, Lightbulb, Focus, Move } from 'lucide-react'
import { ImageQualityResult } from '@/lib/imageQualityValidator'

interface ImageQualityOverlayProps {
    qualityResult: ImageQualityResult | null
    isVisible: boolean
    className?: string
}

export function ImageQualityOverlay({
    qualityResult,
    isVisible,
    className = ''
}: ImageQualityOverlayProps) {
    if (!isVisible || !qualityResult) {
        return null
    }

    const getQualityColor = (overall: string) => {
        switch (overall) {
            case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
            case 'good': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
            case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'poor': return 'text-red-600 bg-red-50 border-red-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getQualityIcon = (overall: string) => {
        switch (overall) {
            case 'excellent':
            case 'good':
                return <CheckCircle className="w-4 h-4" />
            case 'fair':
            case 'poor':
                return <AlertTriangle className="w-4 h-4" />
            default:
                return <Camera className="w-4 h-4" />
        }
    }

    const getIssueIcon = (type: string) => {
        switch (type) {
            case 'blur': return <Focus className="w-3 h-3" />
            case 'lighting': return <Lightbulb className="w-3 h-3" />
            case 'composition': return <Move className="w-3 h-3" />
            case 'resolution': return <Camera className="w-3 h-3" />
            default: return <AlertTriangle className="w-3 h-3" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-100'
            case 'medium': return 'text-yellow-600 bg-yellow-100'
            case 'low': return 'text-blue-600 bg-blue-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const highPriorityIssues = qualityResult.issues.filter(issue => issue.severity === 'high')

    return (
        <div className={`absolute top-2 left-2 right-2 z-20 pointer-events-none ${className}`}>
            {/* Main Quality Indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${getQualityColor(qualityResult.overall)}`}>
                {getQualityIcon(qualityResult.overall)}
                <span className="text-sm font-medium">
                    {qualityResult.overall === 'excellent' && 'Excellent Quality'}
                    {qualityResult.overall === 'good' && 'Good Quality'}
                    {qualityResult.overall === 'fair' && 'Fair Quality'}
                    {qualityResult.overall === 'poor' && 'Poor Quality'}
                </span>
                <span className="text-xs opacity-75">
                    {qualityResult.score}%
                </span>
            </div>

            {/* High Priority Issues */}
            {highPriorityIssues.length > 0 && (
                <div className="mt-2 space-y-1">
                    {highPriorityIssues.slice(0, 2).map((issue, index) => (
                        <div
                            key={index}
                            className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)} backdrop-blur-sm`}
                        >
                            {getIssueIcon(issue.type)}
                            <span>{issue.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Suggestions for Poor Quality */}
            {qualityResult.overall === 'poor' && qualityResult.suggestions.length > 0 && (
                <div className="mt-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-1">Quick Tips:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                        {qualityResult.suggestions.slice(0, 2).map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-1">
                                <span className="text-emerald-600 mt-0.5">•</span>
                                <span>{suggestion}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
