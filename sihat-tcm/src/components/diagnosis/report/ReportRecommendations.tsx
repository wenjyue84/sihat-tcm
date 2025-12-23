import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Utensils, Leaf, MapPin, Dumbbell, Moon, Brain, Stethoscope, AlertCircle, AlertTriangle, Calendar } from 'lucide-react'
import { HerbalFormulasSection } from '../HerbalFormulasSection'

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
            {/* Recommendations Grid */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Food Recommendations */}
                {opts.includeDietary !== false && (getFoodRecommendations().length > 0 || getFoodsToAvoid().length > 0 || getRecipes().length > 0) && (
                    <motion.div variants={variants} className="space-y-6">
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-stone-800">
                                    <button
                                        onClick={() => handleSectionClick("Please elaborate on the Dietary Therapy recommendations. Why are these foods beneficial for me?")}
                                        className="flex items-center gap-2 hover:text-emerald-600 transition-colors text-left"
                                    >
                                        <Utensils className="h-5 w-5 text-orange-500" />
                                        <span className="underline decoration-dotted underline-offset-4 decoration-stone-400 hover:decoration-emerald-500">
                                            Dietary Therapy (食疗)
                                        </span>
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {getFoodRecommendations().length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                                            <Leaf className="h-4 w-4" /> Beneficial Foods
                                        </h4>
                                        <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
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
                                        <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
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
                                        <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                                            {getFoodsToAvoid().map((food, idx) => (
                                                <li key={idx}>{food}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Lifestyle Advice */}
                {opts.includeLifestyle !== false && data.recommendations?.lifestyle && data.recommendations.lifestyle.length > 0 && (
                    <motion.div variants={variants}>
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-stone-800">
                                    <button
                                        onClick={() => handleSectionClick("Please explain the Lifestyle recommendations in more detail. How will these changes help my condition?")}
                                        className="flex items-center gap-2 hover:text-emerald-600 transition-colors text-left"
                                    >
                                        <Leaf className="h-5 w-5 text-green-600" />
                                        <span className="underline decoration-dotted underline-offset-4 decoration-stone-400 hover:decoration-emerald-500">
                                            Lifestyle (养生)
                                        </span>
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data.recommendations.lifestyle.map((tip: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-600 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Acupuncture Points */}
                {opts.includeAcupuncture !== false && data.recommendations?.acupoints && data.recommendations.acupoints.length > 0 && (
                    <motion.div variants={variants}>
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-stone-800">
                                    <button
                                        onClick={() => handleSectionClick("Can you explain these Acupressure Points? Where exactly are they located and how should I massage them?")}
                                        className="flex items-center gap-2 hover:text-emerald-600 transition-colors text-left"
                                    >
                                        <MapPin className="h-5 w-5 text-indigo-500" />
                                        <span className="underline decoration-dotted underline-offset-4 decoration-stone-400 hover:decoration-emerald-500">
                                            Acupressure Points (穴位)
                                        </span>
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data.recommendations.acupoints.map((point: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-600 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Exercise Recommendations */}
                {opts.includeExercise !== false && data.recommendations?.exercise && data.recommendations.exercise.length > 0 && (
                    <motion.div variants={variants}>
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-stone-800">
                                    <button
                                        onClick={() => handleSectionClick("What kind of Exercise is best for me? Please explain the recommended exercises.")}
                                        className="flex items-center gap-2 hover:text-emerald-600 transition-colors text-left"
                                    >
                                        <Dumbbell className="h-5 w-5 text-blue-500" />
                                        <span className="underline decoration-dotted underline-offset-4 decoration-stone-400 hover:decoration-emerald-500">
                                            Exercise (运动)
                                        </span>
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data.recommendations.exercise.map((ex: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-stone-600 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                            <span>{ex}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Sleep & Emotional Wellness Row */}
            {((opts.includeSleepAdvice && data.recommendations?.sleep_guidance) || (opts.includeEmotionalWellness && data.recommendations?.emotional_care)) && (
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    {opts.includeSleepAdvice && data.recommendations?.sleep_guidance && (
                        <motion.div variants={variants}>
                            <Card className="h-full border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-indigo-800">
                                        <Moon className="h-5 w-5" />
                                        Sleep & Rest
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-indigo-700 text-sm">{data.recommendations.sleep_guidance}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                    {opts.includeEmotionalWellness && data.recommendations?.emotional_care && (
                        <motion.div variants={variants}>
                            <Card className="h-full border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-rose-800">
                                        <Brain className="h-5 w-5" />
                                        Emotional Wellness (情志)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-rose-700 text-sm">{data.recommendations.emotional_care}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Herbal Medicine Suggestions */}
            {opts.suggestMedicine && data.recommendations?.herbal_formulas && data.recommendations.herbal_formulas.length > 0 && (
                <motion.div variants={variants}>
                    <HerbalFormulasSection
                        formulas={data.recommendations.herbal_formulas}
                        reportId={data.timestamp ? `report-${new Date(data.timestamp).getTime()}` : undefined}
                        onSectionClick={handleSectionClick}
                    />
                </motion.div>
            )}

            {/* Doctor Consultation */}
            {opts.suggestDoctor && data.recommendations?.doctor_consultation && (
                <motion.div variants={variants}>
                    <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-teal-800">
                                <Stethoscope className="h-5 w-5" />
                                Professional Consultation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-teal-700">{data.recommendations.doctor_consultation}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Precautions */}
            {opts.includePrecautions && data.precautions && (
                <motion.div variants={variants}>
                    <Card className="border-red-100 bg-gradient-to-br from-red-50 to-orange-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="h-5 w-5" />
                                Precautions & Warnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.precautions.warning_signs && data.precautions.warning_signs.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-700 text-sm mb-1">Warning Signs (Seek Medical Attention):</h4>
                                    <ul className="list-disc list-inside text-stone-600 text-sm space-y-1">
                                        {data.precautions.warning_signs.map((sign: string, idx: number) => (
                                            <li key={idx}>{sign}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.precautions.contraindications && data.precautions.contraindications.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-700 text-sm mb-1">Contraindications:</h4>
                                    <ul className="list-disc list-inside text-stone-600 text-sm space-y-1">
                                        {data.precautions.contraindications.map((item: string, idx: number) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.precautions.special_notes && (
                                <p className="text-sm text-stone-600 italic">{data.precautions.special_notes}</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Follow-up Guidance */}
            {opts.includeFollowUp && data.follow_up && (
                <motion.div variants={variants}>
                    <Card className="border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sky-800">
                                <Calendar className="h-5 w-5" />
                                Follow-up Guidance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.follow_up.timeline && (
                                <p className="text-sky-700 text-sm"><span className="font-medium">Timeline:</span> {data.follow_up.timeline}</p>
                            )}
                            {data.follow_up.expected_improvement && (
                                <p className="text-sky-700 text-sm"><span className="font-medium">Expected Improvement:</span> {data.follow_up.expected_improvement}</p>
                            )}
                            {data.follow_up.next_steps && (
                                <p className="text-sky-700 text-sm"><span className="font-medium">Next Steps:</span> {data.follow_up.next_steps}</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </>
    )
}
