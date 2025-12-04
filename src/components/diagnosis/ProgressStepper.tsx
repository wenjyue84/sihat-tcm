import { motion } from 'framer-motion'
import { Check, User, MessageCircle, Camera, Mic, Activity, FileText } from 'lucide-react'

interface ProgressStepperProps {
    currentStep: string
    steps: { id: string; label: string }[]
}

export function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
    const currentStepIndex = steps.findIndex(s => s.id === currentStep)

    const getStepIcon = (id: string) => {
        switch (id) {
            case 'basic_info': return <User className="w-4 h-4" />;
            case 'wen_inquiry': return <MessageCircle className="w-4 h-4" />;
            case 'wang_tongue': return <Camera className="w-4 h-4" />;
            case 'wang_face': return <User className="w-4 h-4" />; // Or another face icon
            case 'wen_audio': return <Mic className="w-4 h-4" />;
            case 'qie': return <Activity className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    }

    return (
        <div className="w-full mb-10 px-2">
            <div className="flex justify-between items-center relative">
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
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${isCompleted || isCurrent
                                        ? 'bg-white border-emerald-500 text-emerald-600 shadow-emerald-100'
                                        : 'bg-white border-stone-200 text-stone-300'
                                    } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                                initial={false}
                                animate={{ scale: isCurrent ? 1.1 : 1 }}
                            >
                                {isCompleted ? (
                                    <div className="bg-emerald-500 rounded-full p-1">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                ) : (
                                    getStepIcon(step.id)
                                )}
                            </motion.div>
                            <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 absolute -bottom-6 w-20 text-center ${isCurrent ? 'text-emerald-700' : 'text-stone-400'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
