'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, RotateCcw, AlertCircle, AlertTriangle, Pencil, Save, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'

interface ObservationResultProps {
    image: string;
    observation: string;
    potentialIssues: string[];
    onRetake: () => void;
    onContinue: (data?: { observation: string, potentialIssues: string[] }) => void;
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
    imageDescription,
    onBack
}: ObservationResultProps & { onBack?: () => void }) {
    const { t } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()
    const isInvalidImage = status === 'invalid_image' || (!observation && message);
    const [showWarning, setShowWarning] = useState(false)
    const [showGuidelines, setShowGuidelines] = useState(false)

    // Editing State
    const [isEditing, setIsEditing] = useState(false)
    const [editedObservation, setEditedObservation] = useState(observation || "")
    const [editedIssues, setEditedIssues] = useState<string>(potentialIssues ? potentialIssues.join('\n') : "")

    // Update local state when props change
    useEffect(() => {
        setEditedObservation(observation || "")
        setEditedIssues(potentialIssues ? potentialIssues.join('\n') : "")
    }, [observation, potentialIssues])

    // Hide global navigation
    useEffect(() => {
        setNavigationState({
            showNext: false,
            showBack: false,
            showSkip: false,
            hideBottomNav: true
        })
    }, [setNavigationState])

    const typeLabels = {
        tongue: 'Tongue',
        face: 'Face',
        part: 'Specific Area'
    };

    const handleContinueClick = () => {
        if (isInvalidImage) {
            setShowWarning(true)
        } else {
            // Parse issues back to array
            const issuesArray = editedIssues
                .split('\n')
                .map(i => i.trim())
                .filter(i => i.length > 0);

            onContinue({
                observation: editedObservation,
                potentialIssues: issuesArray
            })
        }
    }

    const toggleEdit = () => {
        if (isEditing) {
            // Saving (just toggle off, data is ready in state for Continue)
            setIsEditing(false)
        } else {
            setIsEditing(true)
        }
    }

    const cancelEdit = () => {
        // Revert changes
        setEditedObservation(observation || "")
        setEditedIssues(potentialIssues ? potentialIssues.join('\n') : "")
        setIsEditing(false)
    }

    return (
        <Card className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 text-center md:text-left">
                <div>
                    <h2 className="text-xl font-semibold text-emerald-800">
                        {type === 'tongue' ? 'Tongue Analysis Result' : type === 'face' ? 'Face Analysis Result' : 'Specific Area Analysis Result'}
                    </h2>
                    <p className="text-stone-600 text-sm mt-1">
                        {isInvalidImage
                            ? 'The image could not be analyzed. Please review and retake if needed.'
                            : 'Here is what our AI observed. Please review before proceeding.'}
                    </p>
                </div>

                {/* Edit Toggle Button */}
                {!isInvalidImage && (
                    <div className="flex justify-center md:justify-end">
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleEdit}
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Result
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEdit}
                                    className="text-stone-500 hover:bg-stone-100"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleEdit}
                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="relative h-64 md:h-auto bg-gray-100 rounded-xl overflow-hidden">
                    {image && (
                        <img
                            src={image}
                            alt="Analyzed"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
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
                            {/* Observation Section */}
                            <div className={`p-4 rounded-lg border transition-colors ${isEditing ? 'bg-white border-emerald-300 ring-2 ring-emerald-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <h3 className="font-medium text-emerald-900 mb-2 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Check className="w-4 h-4 mr-2" />
                                        Observation
                                        {confidence !== undefined && confidence >= 60 && !isEditing && (
                                            <span className="ml-2 text-xs text-emerald-600 font-normal">
                                                ({confidence}% confidence)
                                            </span>
                                        )}
                                    </div>
                                </h3>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="observation" className="sr-only">Observation</Label>
                                        <Textarea
                                            id="observation"
                                            value={editedObservation}
                                            onChange={(e) => setEditedObservation(e.target.value)}
                                            className="min-h-[100px] border-emerald-200 focus-visible:ring-emerald-500"
                                            placeholder="Enter observation details..."
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                                        {editedObservation || "No detailed observation available."}
                                    </p>
                                )}
                            </div>

                            {/* Issues Section */}
                            <div className={`p-4 rounded-lg border transition-colors ${isEditing ? 'bg-white border-amber-300 ring-2 ring-amber-100' : 'bg-amber-50 border-amber-100'}`}>
                                <h3 className="font-medium text-amber-900 mb-2 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Potential Indications
                                </h3>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="issues" className="sr-only">Potential Indications (one per line)</Label>
                                        <p className="text-xs text-stone-500 mb-1">Enter one indication per line</p>
                                        <Textarea
                                            id="issues"
                                            value={editedIssues}
                                            onChange={(e) => setEditedIssues(e.target.value)}
                                            className="min-h-[100px] border-amber-200 focus-visible:ring-amber-500"
                                            placeholder="Qi Deficiency&#10;Dampness&#10;Heat"
                                        />
                                    </div>
                                ) : (
                                    (editedIssues && editedIssues.length > 0) ? (
                                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                                            {editedIssues.split('\n').filter(i => i.trim()).map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-amber-800/60 italic">No specific indications noted.</p>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                {onBack && (
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="h-12 w-12 p-0 flex-shrink-0 border-stone-300 text-stone-600 hover:bg-stone-100 md:hidden"
                        disabled={isEditing}
                    >
                        <span className="text-xl">←</span>
                    </Button>
                )}
                <Button
                    onClick={onRetake}
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    disabled={isEditing}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.camera.retake}
                </Button>
                <Button
                    onClick={handleContinueClick}
                    className="flex-1 h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                    disabled={isEditing}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Continue
                </Button>
            </div>

            <Dialog open={showWarning} onOpenChange={setShowWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Warning: Image Quality
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            The accuracy of the final report will be affected should we not have the correct photo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => {
                            setShowWarning(false)
                            setShowGuidelines(true)
                        }}>
                            Guidelines
                        </Button>
                        <Button onClick={() => {
                            setShowWarning(false)
                            onContinue({
                                observation: editedObservation,
                                potentialIssues: editedIssues.split('\n').filter(i => i.trim())
                            })
                        }}>
                            Continue Anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Photo Guidelines</DialogTitle>
                        <DialogDescription>
                            Please follow these guidelines for the best analysis results:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-600">
                            <li>Make sure the light is sufficient and even.</li>
                            <li>Do not edit or beautify the photo.</li>
                            <li>Ensure the {typeLabels[type].toLowerCase()} is clearly visible and in focus.</li>
                            <li>Avoid shadows or glare.</li>
                            {type === 'tongue' && <li>Relax your tongue, do not stiffen it.</li>}
                            {type === 'face' && <li>Remove glasses and ensure your face is not covered by hair.</li>}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowGuidelines(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
