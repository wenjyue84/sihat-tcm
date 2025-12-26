'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    Leaf,
    Sun,
    Wind,
    Snowflake,
} from 'lucide-react';
import {
    getCurrentSolarTerm,
    getSolarTermsForYear,
    getSeasonColor,
    getSeasonGradient,
    hasSolarTermPassed,
    isCurrentSolarTerm,
    type SolarTerm,
    type Season,
} from '@/lib/solar-terms';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SolarTermsTimelineProps {
    className?: string;
}

export function SolarTermsTimeline({ className = '' }: SolarTermsTimelineProps) {
    const { language, t } = useLanguage();
    const [currentTerm, setCurrentTerm] = useState<SolarTerm | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [allTerms, setAllTerms] = useState<SolarTerm[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const term = getCurrentSolarTerm();
        setCurrentTerm(term);
        setAllTerms(getSolarTermsForYear(new Date().getFullYear()));
    }, []);

    useEffect(() => {
        // Scroll to current term on mount
        if (scrollContainerRef.current && currentTerm) {
            const currentIndex = allTerms.findIndex((term) =>
                isCurrentSolarTerm(term)
            );
            if (currentIndex !== -1) {
                const cardWidth = 280; // Width of each card + gap
                scrollContainerRef.current.scrollLeft = currentIndex * cardWidth - 200;
            }
        }
    }, [allTerms, currentTerm]);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
    };

    const getSeasonIcon = (season: Season) => {
        switch (season) {
            case 'spring':
                return <Leaf className="w-4 h-4" />;
            case 'summer':
                return <Sun className="w-4 h-4" />;
            case 'autumn':
                return <Wind className="w-4 h-4" />;
            case 'winter':
                return <Snowflake className="w-4 h-4" />;
        }
    };

    const getTermName = (term: SolarTerm) => {
        switch (language) {
            case 'zh':
                return term.nameZh;
            case 'ms':
                return term.nameMs;
            default:
                return term.name;
        }
    };

    const getHealthFocus = (term: SolarTerm) => {
        switch (language) {
            case 'zh':
                return term.healthFocus.zh;
            case 'ms':
                return term.healthFocus.ms;
            default:
                return term.healthFocus.en;
        }
    };

    const getRecommendedFoods = (term: SolarTerm) => {
        switch (language) {
            case 'zh':
                return term.recommendedFoods.zh;
            case 'ms':
                return term.recommendedFoods.ms;
            default:
                return term.recommendedFoods.en;
        }
    };

    const getLifestyleAdvice = (term: SolarTerm) => {
        switch (language) {
            case 'zh':
                return term.lifestyleAdvice.zh;
            case 'ms':
                return term.lifestyleAdvice.ms;
            default:
                return term.lifestyleAdvice.en;
        }
    };

    if (!currentTerm) return null;

    return (
        <div className={`relative ${className}`}>
            {/* Current Solar Term Banner */}
            <Card
                className="mb-6 overflow-hidden border-none shadow-lg"
                style={{
                    background: `linear-gradient(135deg, ${getSeasonColor(currentTerm.season)}15 0%, ${getSeasonColor(currentTerm.season)}05 100%)`,
                }}
            >
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 rounded-lg bg-gradient-to-br ${getSeasonGradient(currentTerm.season)} text-white`}
                            >
                                {getSeasonIcon(currentTerm.season)}
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 mb-1">
                                    {t.solarTerms?.currentTerm || 'Current Solar Term'}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {getTermName(currentTerm)}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {currentTerm.date.toLocaleDateString(
                                        language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US',
                                        { month: 'long', day: 'numeric' }
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCalendar(true)}
                            className="gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            {t.solarTerms?.viewCalendar || 'View Calendar'}
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Health Focus */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {t.solarTerms?.healthFocus || 'Health Focus'}
                            </h4>
                            <p className="text-sm text-slate-700 font-medium">
                                {getHealthFocus(currentTerm)}
                            </p>
                        </div>

                        {/* Recommended Foods */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {t.solarTerms?.recommendedFoods || 'Recommended Foods'}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {getRecommendedFoods(currentTerm).map((food, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200"
                                    >
                                        {food}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Lifestyle Advice */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {t.solarTerms?.lifestyleAdvice || 'Lifestyle Advice'}
                            </h4>
                            <p className="text-sm text-slate-700">
                                {getLifestyleAdvice(currentTerm)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Timeline */}
            <div className="relative">
                <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-12 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allTerms.map((term, index) => {
                        const isPast = hasSolarTermPassed(term);
                        const isCurrent = isCurrentSolarTerm(term);

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex-shrink-0 w-64 ${isPast && !isCurrent ? 'opacity-50' : ''}`}
                            >
                                <Card
                                    className={`relative overflow-hidden transition-all duration-300 ${isCurrent
                                            ? 'ring-2 ring-offset-2 shadow-xl scale-105'
                                            : 'hover:shadow-lg'
                                        }`}
                                    style={{
                                        borderColor: isCurrent ? getSeasonColor(term.season) : undefined,
                                    }}
                                >
                                    {/* Season indicator */}
                                    <div
                                        className={`h-1.5 bg-gradient-to-r ${getSeasonGradient(term.season)}`}
                                    />

                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className={`p-1.5 rounded-md bg-gradient-to-br ${getSeasonGradient(term.season)} text-white`}
                                            >
                                                {getSeasonIcon(term.season)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 truncate">
                                                    {getTermName(term)}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    {term.date.toLocaleDateString(
                                                        language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US',
                                                        { month: 'short', day: 'numeric' }
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            <div>
                                                <span className="font-semibold text-slate-600">
                                                    {t.solarTerms?.focus || 'Focus'}:{' '}
                                                </span>
                                                <span className="text-slate-700">
                                                    {getHealthFocus(term).split('，')[0].split(',')[0]}
                                                </span>
                                            </div>
                                        </div>

                                        {isCurrent && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <span
                                                    className="text-xs font-bold uppercase tracking-wider"
                                                    style={{ color: getSeasonColor(term.season) }}
                                                >
                                                    {t.solarTerms?.current || 'Current'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            {/* Calendar Modal */}
            <AnimatePresence>
                {showCalendar && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowCalendar(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {t.solarTerms?.fullCalendarTitle || '24 Solar Terms Calendar'}
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {new Date().getFullYear()}{' '}
                                        {t.solarTerms?.year || 'Year'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCalendar(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allTerms.map((term, index) => {
                                        const isPast = hasSolarTermPassed(term);
                                        const isCurrent = isCurrentSolarTerm(term);

                                        return (
                                            <Card
                                                key={index}
                                                className={`overflow-hidden ${isCurrent ? 'ring-2 ring-offset-2' : ''
                                                    } ${isPast && !isCurrent ? 'opacity-60' : ''}`}
                                                style={{
                                                    borderColor: isCurrent
                                                        ? getSeasonColor(term.season)
                                                        : undefined,
                                                }}
                                            >
                                                <div
                                                    className={`h-2 bg-gradient-to-r ${getSeasonGradient(term.season)}`}
                                                />
                                                <div className="p-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div
                                                            className={`p-2 rounded-lg bg-gradient-to-br ${getSeasonGradient(term.season)} text-white`}
                                                        >
                                                            {getSeasonIcon(term.season)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-slate-800">
                                                                {getTermName(term)}
                                                            </h4>
                                                            <p className="text-sm text-slate-600">
                                                                {term.date.toLocaleDateString(
                                                                    language === 'zh'
                                                                        ? 'zh-CN'
                                                                        : language === 'ms'
                                                                            ? 'ms-MY'
                                                                            : 'en-US',
                                                                    {
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        weekday: 'short',
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-semibold text-slate-600">
                                                                {t.solarTerms?.healthFocus || 'Health Focus'}:
                                                            </span>
                                                            <p className="text-slate-700 mt-0.5">
                                                                {getHealthFocus(term)}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span className="font-semibold text-slate-600">
                                                                {t.solarTerms?.recommendedFoods || 'Foods'}:
                                                            </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {getRecommendedFoods(term).map((food, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700"
                                                                    >
                                                                        {food}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isCurrent && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                                            <span
                                                                className="text-xs font-bold uppercase tracking-wider"
                                                                style={{ color: getSeasonColor(term.season) }}
                                                            >
                                                                ✨ {t.solarTerms?.current || 'Current'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
