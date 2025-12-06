'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, RotateCcw, AlertCircle, AlertTriangle } from 'lucide-react'

interface ObservationResultProps {
    image: string;
    observation: string;
    potentialIssues: string[];
    onRetake: () => void;
    onContinue: () => void;
    type: 'tongue' | 'face' | 'part';
    status?: string; // 'invalid_image' when image doesn't match expected content
    message?: string; // Message explaining what was detected
    confidence?: number; // 0-100 confidence score
    imageDescription?: string; // What the AI saw in the image
}

export function ObservationResult({
    image,
    observation,
    potentialIssues,
    onRetake,
    onContinue,
    type,
    status,
    message,
    confidence,
    imageDescription
}: ObservationResultProps) {
    const isInvalidImage = status === 'invalid_image' || (!observation && message);
    const typeLabels = {
        tongue: 'Tongue',
        face: 'Face',
        part: 'Specific Area'
    };

    return (
        <Card className="p-4 md:p-6 space-y-6">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-semibold text-emerald-800">
                    {type === 'tongue' ? 'Tongue Analysis Result' : type === 'face' ? 'Face Analysis Result' : 'Specific Area Analysis Result'}
                </h2>
                <p className="text-stone-600 text-sm mt-1">
                    {isInvalidImage
                        ? 'The image could not be analyzed. Please review and retake if needed.'
                        : 'Here is what our AI observed. Please review before proceeding.'}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="relative h-64 md:h-auto bg-gray-100 rounded-xl overflow-hidden">
                    <img
                        src={image}
                        alt="Analyzed"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                {/* Analysis Content */}
                <div className="space-y-4">
                    {isInvalidImage ? (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h3 className="font-medium text-red-900 mb-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Image Not Recognized
                            </h3>
                            <p className="text-sm text-red-800 leading-relaxed mb-3">
                                {message || `This image does not appear to contain a ${typeLabels[type].toLowerCase()}. Please retake the photo with a clear view of your ${typeLabels[type].toLowerCase()}.`}
                            </p>
                            {imageDescription && (
                                <p className="text-xs text-red-600 italic">
                                    Detected: {imageDescription}
                                </p>
                            )}
                            {confidence !== undefined && confidence > 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                    Confidence: {confidence}%
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                <h3 className="font-medium text-emerald-900 mb-2 flex items-center">
                                    <Check className="w-4 h-4 mr-2" />
                                    Observation
                                    {confidence !== undefined && confidence >= 60 && (
                                        <span className="ml-2 text-xs text-emerald-600 font-normal">
                                            ({confidence}% confidence)
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                    {observation || "No detailed observation available."}
                                </p>
                            </div>

                            {potentialIssues && potentialIssues.length > 0 && (
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                    <h3 className="font-medium text-amber-900 mb-2 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Potential Indications
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                                        {potentialIssues.map((issue, index) => (
                                            <li key={index}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    onClick={onRetake}
                    variant="outline"
                    className="flex-1 h-12 text-base"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Photo
                </Button>
                <Button
                    onClick={onContinue}
                    className="flex-1 h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Continue
                </Button>
            </div>
        </Card>
    )
}
