import { motion } from 'framer-motion'
import { useDiagnosisProgress } from '@/stores/useAppStore'
import { Check, User, MessageCircle, Camera, Mic, Activity, FileText, Wifi } from 'lucide-react'
import { ShowPromptButton } from './ShowPromptButton'

interface ProgressStepperProps {
    currentStep: string
    steps: { id: string; label: string }[]
    promptType?: 'chat' | 'image' | 'final' | 'audio'
    maxStepIndex?: number
    onStepClick?: (stepId: string) => void
}

export function ProgressStepper({ currentStep, steps, promptType, maxStepIndex = 0, onStepClick }: ProgressStepperProps) {
    const { progress } = useDiagnosisProgress()
    const currentStepIndex = steps.findIndex(s => s.id === currentStep)
    const currentStepLabel = steps[currentStepIndex]?.label || ''

    const getStepIcon = (id: string) => {
        switch (id) {
            case 'basic_info': return <User className="w-4 h-4" />;
            case 'wen_inquiry': return <MessageCircle className="w-4 h-4" />;
            case 'wang_tongue': return <Camera className="w-4 h-4" />;
            case 'wang_face': return <User className="w-4 h-4" />; // Or another face icon
            case 'wen_audio': return <Mic className="w-4 h-4" />;
            case 'qie': return <Activity className="w-4 h-4" />;
            case 'smart_connect': return <Wifi className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    }

    // Check if a step is clickable (completed and not current)
    const isStepClickable = (index: number) => {
        return index <= maxStepIndex && index !== currentStepIndex && onStepClick
    }

    // Handle step click
    const handleStepClick = (stepId: string, index: number) => {
        if (isStepClickable(index) && onStepClick) {
            onStepClick(stepId)
        }
    }

    return (
        <div className="w-full mb-6 md:mb-10 px-2">
            {/* Mobile: Show current step indicator and percentage */}
            <div className="md:hidden text-center mb-4 flex items-center justify-center gap-2 text-sm">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Step {currentStepIndex + 1}/{steps.length}
                </span>
                <span className="font-bold text-emerald-600">
                    {progress}%
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 truncate max-w-[120px]">{currentStepLabel}</span>
                {/* Show Prompt button - development phase only */}
                {promptType && (
                    <ShowPromptButton promptType={promptType} />
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Steps container */}
                <div className="flex-1 flex justify-between items-center relative">
                    {/* Background Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-stone-100 rounded-full -z-10" />

                    {/* Active Line */}
                    <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full -z-10 shadow-sm"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />

                    {steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex
                        const isCurrent = index === currentStepIndex
                        const isClickable = isStepClickable(index)

                        return (
                            <div
                                key={step.id}
                                className="flex flex-col items-center gap-3 relative group"
                                onClick={() => handleStepClick(step.id, index)}
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault()
                                        handleStepClick(step.id, index)
                                    }
                                }}
                            >
                                <motion.div
                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${isCompleted || isCurrent
                                        ? 'bg-white border-emerald-500 text-emerald-600 shadow-emerald-100'
                                        : 'bg-white border-stone-200 text-stone-300'
                                        } ${isCurrent ? 'ring-2 md:ring-4 ring-emerald-100 scale-105 md:scale-110' : ''} ${isClickable
                                            ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-emerald-200 hover:border-emerald-600 active:scale-95'
                                            : ''}`}
                                    initial={false}
                                    animate={{ scale: isCurrent ? 1.05 : 1 }}
                                    whileHover={isClickable ? { scale: 1.15 } : {}}
                                    whileTap={isClickable ? { scale: 0.95 } : {}}
                                >
                                    {isCompleted ? (
                                        <div className="bg-emerald-500 rounded-full p-0.5 md:p-1">
                                            <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                        </div>
                                    ) : (
                                        <span className="[&>svg]:w-3 [&>svg]:h-3 md:[&>svg]:w-4 md:[&>svg]:h-4">
                                            {getStepIcon(step.id)}
                                        </span>
                                    )}
                                </motion.div>
                                {/* Hide labels on mobile, show on desktop */}
                                <span className={`hidden md:block text-xs font-semibold tracking-wide transition-colors duration-300 absolute -bottom-6 w-20 text-center ${isCurrent ? 'text-emerald-700' : 'text-stone-400'
                                    } ${isClickable ? 'group-hover:text-emerald-600' : ''}`}>
                                    {step.label}
                                </span>
                                {/* Tooltip for clickable steps */}
                                {isClickable && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        Go to {step.label}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
