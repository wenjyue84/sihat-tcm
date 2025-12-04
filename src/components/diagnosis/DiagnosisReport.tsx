import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Utensils, AlertCircle, HeartPulse, Leaf, Info } from 'lucide-react'

interface DiagnosisReportProps {
    data: {
        diagnosis: string;
        constitution: string;
        analysis: string;
        recommendations: {
            food: string[];
            avoid: string[];
            lifestyle: string[];
        };
    };
    onRestart: () => void;
}

export function DiagnosisReport({ data, onRestart }: DiagnosisReportProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 max-w-3xl mx-auto"
        >
            {/* Header Section */}
            <motion.div variants={item} className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-emerald-900">Diagnosis Report</h2>
                <p className="text-stone-600">Based on your Wang, Wen, Wen, and Qie analysis</p>
            </motion.div>

            {/* Main Diagnosis Card */}
            <motion.div variants={item}>
                <Card className="border-emerald-100 bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-emerald-800">
                            <Activity className="h-5 w-5" />
                            Main Diagnosis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-emerald-900 mb-1">
                            {data.diagnosis}
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 font-medium">
                            <HeartPulse className="h-4 w-4" />
                            Constitution: {data.constitution}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Detailed Analysis */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-stone-800">
                            <Info className="h-5 w-5 text-stone-600" />
                            Detailed Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                            {data.analysis}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recommendations Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Food Recommendations */}
                <motion.div variants={item} className="space-y-6">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-stone-800">
                                <Utensils className="h-5 w-5 text-orange-500" />
                                Dietary Advice
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                                    <Leaf className="h-4 w-4" /> Recommended
                                </h4>
                                <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                                    {data.recommendations.food.map((food, idx) => (
                                        <li key={idx}>{food}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Avoid
                                </h4>
                                <ul className="list-disc list-inside text-stone-600 space-y-1 text-sm">
                                    {data.recommendations.avoid.map((food, idx) => (
                                        <li key={idx}>{food}</li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Lifestyle Advice */}
                <motion.div variants={item}>
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-stone-800">
                                <Leaf className="h-5 w-5 text-green-600" />
                                Lifestyle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {data.recommendations.lifestyle.map((tip, idx) => (
                                    <li key={idx} className="flex gap-3 text-stone-600 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div variants={item} className="flex justify-center pt-6">
                <button
                    onClick={onRestart}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                >
                    Start New Consultation
                </button>
            </motion.div>
        </motion.div>
    )
}
