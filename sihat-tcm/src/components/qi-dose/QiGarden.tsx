'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Droplets,
    Leaf,
    Flame,
    Sparkles,
    Trophy,
    Clock,
    Gift,
    Store,
    Backpack,
    AlertCircle,
    Info,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/stores/useAppStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Herb {
    id: string
    name: string
    growth: number
    level: number
    type: 'ginseng' | 'reishi' | 'goji'
    status: 'healthy' | 'thirsty' | 'withering'
}

export function QiGarden() {
    const { t } = useLanguage()
    const tg = t.qiGarden

    // State for garden data
    const [essence, setEssence] = useState(120)
    const [water, setWater] = useState(5)
    const [herb, setHerb] = useState<Herb>({
        id: '1',
        name: tg.herbGinseng,
        growth: 65,
        level: 3,
        type: 'ginseng',
        status: 'healthy'
    })

    const [showEarnedEffect, setShowEarnedEffect] = useState(false)
    const [lastAction, setLastAction] = useState<string | null>(null)

    // Growth stage calculation
    const getGrowthStage = (growth: number) => {
        if (growth < 20) return 'Seedling'
        if (growth < 50) return 'Sprout'
        if (growth < 80) return 'Growing'
        return 'Mature'
    }

    const handleWater = () => {
        if (water > 0) {
            setWater(prev => prev - 1)
            setHerb(prev => ({
                ...prev,
                growth: Math.min(100, prev.growth + 5),
                status: 'healthy'
            }))
            setLastAction('water')
            setTimeout(() => setLastAction(null), 2000)
        }
    }

    const handleNurture = () => {
        if (essence >= 20) {
            setEssence(prev => prev - 20)
            setHerb(prev => ({
                ...prev,
                growth: Math.min(100, prev.growth + 10)
            }))
            setLastAction('nurture')
            setTimeout(() => setLastAction(null), 2000)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-700">
            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/50 backdrop-blur-md border-emerald-100 shadow-sm overflow-hidden relative">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                            <Flame className="w-6 h-6 fill-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tg.essence}</p>
                            <p className="text-xl font-black text-slate-800">{essence}</p>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-1">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-3 h-3 text-amber-400 opacity-50" />
                        </motion.div>
                    </div>
                </Card>

                <Card className="bg-white/50 backdrop-blur-md border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                            <Droplets className="w-6 h-6 fill-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tg.water}</p>
                            <p className="text-xl font-black text-slate-800">{water}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/50 backdrop-blur-md border-emerald-100 shadow-sm hidden lg:block">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tg.level}</p>
                            <p className="text-xl font-black text-slate-800">{herb.level}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/50 backdrop-blur-md border-purple-100 shadow-sm hidden lg:block">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards</p>
                            <p className="text-xl font-black text-slate-800">2 Active</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Garden View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="relative h-[450px] overflow-hidden border-none shadow-2xl rounded-3xl group">
                        {/* Garden Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-emerald-50 to-emerald-100/50" />

                        {/* Animated Mist */}
                        <motion.div
                            animate={{ x: [-10, 10, -10], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-white/20 blur-3xl pointer-events-none"
                        />

                        {/* Garden Floor */}
                        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-800/20 to-transparent" />

                        {/* The Herb Container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                {/* Floating Island Base (Pure CSS) */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                >
                                    <div className="w-64 h-16 bg-slate-800/10 rounded-[100%] blur-xl absolute -bottom-8 left-1/2 -translate-x-1/2" />

                                    {/* Virtual Herb Representation */}
                                    <div className="relative w-48 h-64 flex items-end justify-center pb-8">
                                        {/* Glow Effect */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute w-40 h-40 bg-emerald-400 rounded-full blur-[80px] -bottom-10"
                                        />

                                        {/* CSS-based Ginseng Representation */}
                                        <div className="relative z-20 flex flex-col items-center">
                                            {/* Leaves */}
                                            <div className="flex gap-2 -mb-2">
                                                <motion.div
                                                    animate={{ rotate: [-2, 2, -2] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                    className="w-12 h-16 bg-emerald-500 rounded-full rounded-tr-none rotate-45 transform-gpu shadow-lg border border-emerald-400/30"
                                                />
                                                <motion.div
                                                    animate={{ rotate: [2, -2, 2] }}
                                                    transition={{ duration: 3.5, repeat: Infinity }}
                                                    className="w-14 h-20 bg-emerald-600 rounded-full rounded-tl-none -rotate-45 transform-gpu shadow-lg border border-emerald-500/30"
                                                />
                                            </div>
                                            {/* Stem */}
                                            <div className="w-3 h-16 bg-emerald-800/80 rounded-full shadow-inner" />
                                            {/* Root (Simplified) */}
                                            <div className="w-16 h-24 bg-amber-100/90 rounded-2xl rounded-t-full border-2 border-amber-200/50 shadow-xl flex items-center justify-center backdrop-blur-sm">
                                                <Leaf className="w-8 h-8 text-amber-500/30" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Action Feedback Animations */}
                                <AnimatePresence>
                                    {lastAction === 'water' && (
                                        <motion.div
                                            initial={{ y: -40, opacity: 0 }}
                                            animate={{ y: 20, opacity: 1 }}
                                            exit={{ y: 40, opacity: 0 }}
                                            className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
                                        >
                                            <Droplets className="w-12 h-12 text-blue-400 fill-blue-500/20" />
                                        </motion.div>
                                    )}
                                    {lastAction === 'nurture' && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 2, opacity: 1 }}
                                            exit={{ scale: 3, opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                                        >
                                            <Sparkles className="w-12 h-12 text-amber-400" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Top Left Info Overlay */}
                        <div className="absolute top-6 left-6 p-4 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl z-20 max-w-[180px]">
                            <h4 className="font-extrabold text-slate-800 leading-tight mb-1">{herb.name}</h4>
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] border-none">LVL {herb.level}</Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{getGrowthStage(herb.growth)}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                    <span>{tg.growth}</span>
                                    <span>{herb.growth}%</span>
                                </div>
                                <Progress value={herb.growth} className="h-1.5 bg-slate-200/50" indicatorClassName="bg-emerald-500" />
                            </div>
                        </div>

                        {/* Status Alert */}
                        {herb.status === 'withering' && (
                            <div className="absolute top-6 right-6 z-20">
                                <div className="px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg shadow-red-200">
                                    <AlertCircle className="w-4 h-4" />
                                    {tg.witherWarning}
                                </div>
                            </div>
                        )}

                        {/* Bottom Actions Overlay */}
                        <div className="absolute bottom-6 inset-x-6 flex items-center justify-center gap-3 z-20">
                            <Button
                                onClick={handleWater}
                                disabled={water === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Droplets className="w-5 h-5" />
                                {tg.waterPlant}
                            </Button>
                            <Button
                                onClick={handleNurture}
                                disabled={essence < 20}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12 rounded-2xl shadow-lg shadow-amber-200 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Flame className="w-5 h-5" />
                                {tg.nurture}
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-white/60 backdrop-blur-md h-12 w-12 rounded-2xl border-none shadow-lg hover:bg-white"
                                onClick={() => setHerb(prev => ({ ...prev, status: prev.status === 'healthy' ? 'withering' : 'healthy' }))}
                            >
                                <Info className="w-5 h-5 text-slate-500" />
                            </Button>
                        </div>
                    </Card>

                    {/* How to Earn Section */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Get More Essence
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: tg.habits.logMeal, icon: Backpack, reward: '+15 Essence', color: 'bg-orange-50 text-orange-600' },
                                { title: tg.habits.doExercise, icon: Clock, reward: '+25 Essence', color: 'bg-emerald-50 text-emerald-600' },
                                { title: tg.habits.checkIn, icon: CheckCircle2, reward: '+10 Essence', color: 'bg-blue-50 text-blue-600' }
                            ].map((habit, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2 group cursor-pointer"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${habit.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <habit.icon className="w-6 h-6" />
                                    </div>
                                    <h5 className="font-bold text-slate-800 text-sm">{habit.title}</h5>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-emerald-600">{habit.reward}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar: Shop & Inventory */}
                <div className="space-y-6">
                    {/* Herb Shop */}
                    <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Store className="w-5 h-5 text-emerald-400" />
                                {tg.shop}
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">Trade essence for rare seeds</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <Leaf className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{tg.herbReishi}</p>
                                        <p className="text-[10px] text-slate-400">Rare • High Vitality</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-400">200</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-black">ESSENCE</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{tg.herbGoji}</p>
                                        <p className="text-[10px] text-slate-400">Epic • Anti-Oxidant</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-500">500</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-black">LOCKED</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unlocked Coupons */}
                    <Card className="border-none shadow-sm bg-amber-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
                                <Gift className="w-5 h-5" />
                                Rewards
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-amber-200 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <Badge className="bg-amber-500 mb-2">{tg.couponUnlocked}</Badge>
                                    <h5 className="font-black text-slate-800 text-lg">10% OFF</h5>
                                    <p className="text-xs text-slate-500 mb-4 italic">"Harvest your digital Ginseng for a real discount"</p>
                                    <Button className="w-full bg-slate-900 text-white font-bold rounded-xl h-10 text-xs">
                                        {tg.redeemCoupon}
                                    </Button>
                                </div>
                                {/* Torn edge effect */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-100" />
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-100" />
                            </div>

                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                                Harvest progress: {herb.growth}/100
                            </p>
                        </CardContent>
                    </Card>

                    {/* Inventory Brief */}
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm italic">
                                <Backpack className="w-4 h-4" />
                                {tg.inventory}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full whitespace-nowrap">8 Slots Used</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-slate-200 rounded-sm animate-pulse" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                +
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
