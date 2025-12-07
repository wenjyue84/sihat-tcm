import { motion } from 'framer-motion'
import { Check, User, MessageCircle, Camera, Mic, Activity, FileText, Wifi } from 'lucide-react'

interface ProgressStepperProps {
    currentStep: string
    steps: { id: string; label: string }[]
}

// Circular Progress Ring Component
function CircularProgress({ percentage, size = 56 }: { percentage: number; size?: number }) {
    const strokeWidth = 4
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Background circle */}
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-stone-100"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    className="text-sm font-bold text-emerald-600"
                    key={percentage}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {percentage}%
                </motion.span>
            </div>
        </div>
    )
}

export function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
    const currentStepIndex = steps.findIndex(s => s.id === currentStep)
    const currentStepLabel = steps[currentStepIndex]?.label || ''

    // Calculate percentage based on completed steps
    // At step 0 (first step), progress is 0%. After completing all steps, it's 100%.
    const progressPercentage = Math.round((currentStepIndex / steps.length) * 100)

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

    return (
        <div className="w-full mb-6 md:mb-10 px-2">
            {/* Mobile: Show current step indicator with percentage */}
            <div className="md:hidden flex items-center justify-center gap-3 mb-4">
                <div className="flex-shrink-0">
                    <CircularProgress percentage={progressPercentage} size={44} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-emerald-700">
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    <span className="text-xs text-stone-500">{currentStepLabel}</span>
                </div>
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

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 relative group">
                                <motion.div
                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${isCompleted || isCurrent
                                        ? 'bg-white border-emerald-500 text-emerald-600 shadow-emerald-100'
                                        : 'bg-white border-stone-200 text-stone-300'
                                        } ${isCurrent ? 'ring-2 md:ring-4 ring-emerald-100 scale-105 md:scale-110' : ''}`}
                                    initial={false}
                                    animate={{ scale: isCurrent ? 1.05 : 1 }}
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
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Desktop: Circular progress on the right */}
                <div className="hidden md:flex flex-shrink-0">
                    <CircularProgress percentage={progressPercentage} size={56} />
                </div>
            </div>
        </div>
    )
}
