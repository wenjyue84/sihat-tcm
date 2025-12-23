import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Utensils, Leaf, MapPin, Dumbbell, Moon, Brain, Stethoscope, AlertCircle, AlertTriangle, Calendar, Heart, Pill } from 'lucide-react'
import { HerbalFormulasSection } from '../HerbalFormulasSection'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

interface ReportRecommendationsProps {
    data: any
    reportOptions: any
    getFoodRecommendations: () => string[]
    getFoodsToAvoid: () => string[]
    getRecipes: () => string[]
    handleSectionClick: (question: string) => void
    variants: any
}

export function ReportRecommendations({
    data,
    reportOptions: opts,
    getFoodRecommendations,
    getFoodsToAvoid,
    getRecipes,
    handleSectionClick,
    variants
}: ReportRecommendationsProps) {
    return (
        <>
            {/* Recommendations - Collapsible Sections */}
            <div className="space-y-4 md:space-y-6">
                {/* Food Recommendations - Collapsible */}
                {opts.includeDietary !== false && (getFoodRecommendations().length > 0 || getFoodsToAvoid().length > 0 || getRecipes().length > 0) && (
                    <motion.div variants={variants}>
                        <CollapsibleSection
                            title="Dietary Therapy (食疗)"
                            icon={Utensils}
                            accentColor="orange"
                        >
                            <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto space-y-5">
                                {getFoodRecommendations().length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                                            <Leaf className="h-4 w-4" /> Beneficial Foods
                                        </h4>
                                        <ul className="list-disc list-inside text-stone-700 space-y-2 text-base leading-relaxed">
                                            {getFoodRecommendations().map((food, idx) => (
                                                <li key={idx}>{food}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {getRecipes().length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                                            <Utensils className="h-4 w-4" /> Therapeutic Recipes
                                        </h4>
                                        <ul className="list-disc list-inside text-stone-700 space-y-2 text-base leading-relaxed">
                                            {getRecipes().map((recipe, idx) => (
                                                <li key={idx}>{recipe}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {getFoodsToAvoid().length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> Foods to Avoid
                                        </h4>
                                        <ul className="list-disc list-inside text-stone-700 space-y-2 text-base leading-relaxed">
                                            {getFoodsToAvoid().map((food, idx) => (
                                                <li key={idx}>{food}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                    </motion.div>
                )}

                {/* Lifestyle Advice - Collapsible */}
                {opts.includeLifestyle !== false && data.recommendations?.lifestyle && data.recommendations.lifestyle.length > 0 && (
                    <motion.div variants={variants}>
                        <CollapsibleSection
                            title="Lifestyle (养生)"
                            icon={Leaf}
                            accentColor="emerald"
                        >
                            <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
                                <ul className="space-y-3">
                                    {data.recommendations.lifestyle.map((tip: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-700 text-base leading-relaxed">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CollapsibleSection>
                    </motion.div>
                )}

                {/* Acupuncture Points - Collapsible */}
                {opts.includeAcupuncture !== false && data.recommendations?.acupoints && data.recommendations.acupoints.length > 0 && (
                    <motion.div variants={variants}>
                        <CollapsibleSection
                            title="Acupressure Points (穴位)"
                            icon={MapPin}
                            accentColor="indigo"
                        >
                            <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
                                <ul className="space-y-3">
                                    {data.recommendations.acupoints.map((point: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-700 text-base leading-relaxed">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-sm text-stone-600 italic">
                                    💡 Massage each point for 1-2 minutes, 2-3 times daily
                                </p>
                            </div>
                        </CollapsibleSection>
                    </motion.div>
                )}

                {/* Exercise Recommendations - Collapsible */}
                {opts.includeExercise !== false && data.recommendations?.exercise && data.recommendations.exercise.length > 0 && (
                    <motion.div variants={variants}>
                        <CollapsibleSection
                            title="Exercise (运动)"
                            icon={Dumbbell}
                            accentColor="blue"
                        >
                            <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
                                <ul className="space-y-3">
                                    {data.recommendations.exercise.map((ex: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-700 text-base leading-relaxed">
                                            <div className="h-2 w-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                                            <span>{ex}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CollapsibleSection>
                    </motion.div>
                )}
            </div>

            {/* Sleep & Emotional Wellness - Collapsible */}
            {((opts.includeSleepAdvice && data.recommendations?.sleep_guidance) || (opts.includeEmotionalWellness && data.recommendations?.emotional_care)) && (
                <motion.div variants={variants}>
                    <CollapsibleSection
                        title="Rest & Wellness"
                        icon={Moon}
                        accentColor="purple"
                    >
                        <div className="space-y-4 w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
                            {opts.includeSleepAdvice && data.recommendations?.sleep_guidance && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Moon className="h-4 w-4 text-indigo-600" />
                                        <h4 className="font-medium text-indigo-800">Sleep Guidance</h4>
                                    </div>
                                    <p className="text-indigo-700 text-base leading-relaxed">{data.recommendations.sleep_guidance}</p>
                                </div>
                            )}
                            {opts.includeEmotionalWellness && data.recommendations?.emotional_care && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="h-4 w-4 text-rose-600" />
                                        <h4 className="font-medium text-rose-800">Emotional Wellness (情志)</h4>
                                    </div>
                                    <p className="text-rose-700 text-base leading-relaxed">{data.recommendations.emotional_care}</p>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Herbal Medicine Suggestions - Collapsible */}
            {opts.suggestMedicine && data.recommendations?.herbal_formulas && data.recommendations.herbal_formulas.length > 0 && (
                <motion.div variants={variants}>
                    <CollapsibleSection
                        title="Herbal Formulas (中药方剂)"
                        icon={Pill}
                        accentColor="amber"
                    >
                        <div className="w-full">
                            <HerbalFormulasSection
                                formulas={data.recommendations.herbal_formulas}
                                reportId={data.timestamp ? `report-${new Date(data.timestamp).getTime()}` : undefined}
                                onSectionClick={handleSectionClick}
                            />
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Doctor Consultation - Collapsible */}
            {opts.suggestDoctor && data.recommendations?.doctor_consultation && (
                <motion.div variants={variants}>
                    <CollapsibleSection
                        title="Professional Consultation"
                        icon={Stethoscope}
                        accentColor="teal"
                    >
                        <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
                            <p className="text-teal-700 text-base leading-relaxed">{data.recommendations.doctor_consultation}</p>
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Precautions - Collapsible */}
            {opts.includePrecautions && data.precautions && (
                <motion.div variants={variants}>
                    <CollapsibleSection
                        title="Precautions & Warnings"
                        icon={AlertTriangle}
                        accentColor="rose"
                    >
                        <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto space-y-4">
                            {data.precautions.warning_signs && data.precautions.warning_signs.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-700 text-sm mb-2">Warning Signs (Seek Medical Attention):</h4>
                                    <ul className="list-disc list-inside text-stone-700 text-base leading-relaxed space-y-2">
                                        {data.precautions.warning_signs.map((sign: string, idx: number) => (
                                            <li key={idx}>{sign}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.precautions.contraindications && data.precautions.contraindications.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-700 text-sm mb-2">Contraindications:</h4>
                                    <ul className="list-disc list-inside text-stone-700 text-base leading-relaxed space-y-2">
                                        {data.precautions.contraindications.map((item: string, idx: number) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.precautions.special_notes && (
                                <p className="text-base text-stone-700 italic leading-relaxed">{data.precautions.special_notes}</p>
                            )}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Follow-up Guidance - Collapsible */}
            {opts.includeFollowUp && data.follow_up && (
                <motion.div variants={variants}>
                    <CollapsibleSection
                        title="Follow-up Guidance"
                        icon={Calendar}
                        accentColor="blue"
                    >
                        <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto space-y-3">
                            {data.follow_up.timeline && (
                                <p className="text-sky-700 text-base leading-relaxed"><span className="font-medium">Timeline:</span> {data.follow_up.timeline}</p>
                            )}
                            {data.follow_up.expected_improvement && (
                                <p className="text-sky-700 text-base leading-relaxed"><span className="font-medium">Expected Improvement:</span> {data.follow_up.expected_improvement}</p>
                            )}
                            {data.follow_up.next_steps && (
                                <p className="text-sky-700 text-base leading-relaxed"><span className="font-medium">Next Steps:</span> {data.follow_up.next_steps}</p>
                            )}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}
        </>
    )
}
