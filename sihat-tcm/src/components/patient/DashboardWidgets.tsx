'use client'

import { motion } from 'framer-motion'
import {
    Users,
    UtensilsCrossed,
    Moon,
    Wind,
    ArrowRight,
    Activity,
    Clock,
    Heart,
    ChevronRight,
    Sparkles,
    Leaf
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface DashboardWidgetsProps {
    onNavigate: (section: 'journey' | 'profile' | 'documents' | 'meals' | 'snore' | 'qi-dose' | 'vitality' | 'community' | 'family' | 'settings') => void
    familyMembersCount?: number
    nextMealName?: string
}

export function DashboardGrid({ onNavigate, familyMembersCount = 0, nextMealName }: DashboardWidgetsProps) {
    const { t } = useLanguage()

    const widgets = [
        {
            id: 'vitality',
            title: t.patientDashboard.tabs.vitalityRhythm,
            icon: Activity,
            color: 'from-orange-500 to-amber-500',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                        <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-orange-800 uppercase tracking-wider">Current Meridian</p>
                        <p className="font-bold text-slate-800">Heart Channel</p>
                    </div>
                </div>
            ),
            action: () => onNavigate('vitality')
        },
        {
            id: 'meals',
            title: t.patientDashboard.tabs.mealPlanner,
            icon: UtensilsCrossed,
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                        <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Next Suggestion</p>
                        <p className="font-bold text-slate-800 truncate max-w-[120px]">{nextMealName || 'Ginger Tea'}</p>
                    </div>
                </div>
            ),
            action: () => onNavigate('meals')
        },
        {
            id: 'family',
            title: t.familyManagement?.title || 'Family Care',
            icon: Heart,
            color: 'from-rose-500 to-pink-500',
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[...Array(Math.min(3, Math.max(1, familyMembersCount)))].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-medium">
                                {familyMembersCount > 0 ? String.fromCharCode(65 + i) : <Users className="w-4 h-4 text-slate-400" />}
                            </div>
                        ))}
                        {familyMembersCount > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                                +{familyMembersCount - 3}
                            </div>
                        )}
                    </div>
                    {familyMembersCount === 0 && <span className="text-xs text-slate-500">Add members</span>}
                </div>
            ),
            action: () => onNavigate('family')
        },
        {
            id: 'community',
            title: t.patientDashboard.tabs.community,
            icon: Users,
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-blue-800 uppercase tracking-wider">Circle</p>
                        <p className="font-bold text-slate-800">Damp Heat</p>
                    </div>
                </div>
            ),
            action: () => onNavigate('community')
        },
        {
            id: 'snore',
            title: t.patientDashboard.tabs.snoreAnalysis,
            icon: Moon,
            color: 'from-violet-500 to-purple-500',
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                        <Activity className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-violet-800 uppercase tracking-wider">Last Night</p>
                        <p className="font-bold text-slate-800">Good Sleep</p>
                    </div>
                </div>
            ),
            action: () => onNavigate('snore')
        },
        {
            id: 'qi-dose',
            title: t.patientDashboard.tabs.qiDose,
            icon: Wind,
            color: 'from-cyan-500 to-sky-500',
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600',
            content: (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                        <Activity className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-cyan-800 uppercase tracking-wider">Exercise</p>
                        <p className="font-bold text-slate-800">8 Movements</p>
                    </div>
                </div>
            ),
            action: () => onNavigate('qi-dose')
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {widgets.map((widget, idx) => (
                <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <Card
                        className={`border-none shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group h-full ${widget.bgColor}`}
                        onClick={widget.action}
                    >
                        <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg bg-white shadow-sm ${widget.iconColor}`}>
                                    <widget.icon className="w-4 h-4" />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-white/50"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </Button>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-700 mb-2">{widget.title}</h3>
                                {widget.content}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
