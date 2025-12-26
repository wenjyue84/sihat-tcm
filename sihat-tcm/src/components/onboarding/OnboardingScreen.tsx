'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Hand, Ear, ShieldCheck, Stethoscope, ClipboardList, HelpCircle, Share2, Wallet, Rocket, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/stores/useAppStore';
import { useOnboarding } from '@/stores/useAppStore';

// Color palette matching the app theme
const COLORS = {
    emeraldDeep: '#064E3B',
    emeraldDark: '#065F46',
    emeraldMedium: '#10B981',
    amberStart: '#F59E0B',
    amberEnd: '#D97706',
    white: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary: 'rgba(255,255,255,0.5)',
};

// Slide configurations
interface Slide {
    id: string;
    titleKey: string;
    subtitleKey: string;
    icons?: { icon: React.ElementType; label: string }[];
    bulletPoints?: string[];
    features?: { icon: React.ElementType; text: string; highlight?: boolean }[];
    isLanguageSlide?: boolean;
    mainIcon?: React.ElementType;
    trustBadge?: string;
    badgeIcon?: React.ElementType;
    badgeTextKey?: string;
}

const SLIDES: Slide[] = [
    {
        id: '1',
        titleKey: 'multiModal',
        subtitleKey: 'multiModalSub',
        icons: [
            { icon: Eye, label: 'tongueLabel' },
            { icon: Hand, label: 'pulseLabel' },
            { icon: Ear, label: 'voiceLabel' },
        ],
        trustBadge: 'chatGptCant',
    },
    {
        id: '2',
        mainIcon: ShieldCheck,
        titleKey: 'realDoctors',
        subtitleKey: 'realDoctorsSub',
        bulletPoints: ['doctorReview', 'guidedQuestions', 'notScraped'],
        badgeIcon: Stethoscope,
        badgeTextKey: 'practitionerBacked',
    },
    {
        id: '3',
        mainIcon: ClipboardList,
        titleKey: 'triage',
        subtitleKey: 'triageSub',
        features: [
            { icon: HelpCircle, text: 'triageFeature' },
            { icon: Share2, text: 'reportFeature' },
            { icon: Wallet, text: 'saveFeature', highlight: true },
        ],
    },
    {
        id: '4',
        mainIcon: Rocket,
        titleKey: 'getStarted',
        subtitleKey: 'getStartedSub',
        isLanguageSlide: true,
    },
];

// Onboarding translations
const ONBOARDING_TEXT = {
    en: {
        multiModal: "See What ChatGPT Can't",
        multiModalSub: 'AI-powered diagnosis using your tongue, pulse, and voice — not just text',
        chatGptCant: 'Beyond Text Chat',
        tongueLabel: 'Tongue',
        pulseLabel: 'Pulse',
        voiceLabel: 'Voice',
        realDoctors: 'Real Doctors. Real Trust.',
        realDoctorsSub: "Unlike generic AI, we're built WITH TCM practitioners",
        doctorReview: '✓ Real TCM doctors review edge cases',
        guidedQuestions: '✓ Guided questions prevent confusion',
        notScraped: '✓ Not scraped from random internet sources',
        practitionerBacked: 'Practitioner-Backed AI',
        triage: '"Is This Serious?"',
        triageSub: 'Get instant clarity before your clinic visit',
        triageFeature: 'AI triage in seconds',
        reportFeature: 'Shareable health reports',
        saveFeature: 'Save RM100+ per visit',
        getStarted: 'Ready to Begin?',
        getStartedSub: 'Choose your preferred language',
        skip: 'Skip',
        next: 'Next',
        start: 'Start My Diagnosis',
    },
    zh: {
        multiModal: 'ChatGPT做不到的',
        multiModalSub: 'AI智能诊断——通过舌象、脉象和声音，不仅仅是文字',
        chatGptCant: '超越文字聊天',
        tongueLabel: '舌象',
        pulseLabel: '脉象',
        voiceLabel: '声音',
        realDoctors: '真正的医生，真正的信任',
        realDoctorsSub: '与普通AI不同，我们与中医师共同打造',
        doctorReview: '✓ 真正中医师审核疑难病例',
        guidedQuestions: '✓ 引导式问诊避免遗漏',
        notScraped: '✓ 非网络随意抓取资料',
        practitionerBacked: '中医师支持的AI',
        triage: '"这严重吗？"',
        triageSub: '就诊前获得即时分诊建议',
        triageFeature: '秒级AI分诊',
        reportFeature: '可分享健康报告',
        saveFeature: '每次省下RM100+',
        getStarted: '准备好了吗？',
        getStartedSub: '选择您的首选语言',
        skip: '跳过',
        next: '下一步',
        start: '开始我的诊断',
    },
    ms: {
        multiModal: 'Apa ChatGPT Tak Boleh',
        multiModalSub: 'Diagnosis AI menggunakan lidah, nadi, dan suara — bukan sekadar teks',
        chatGptCant: 'Melangkaui Sembang Teks',
        tongueLabel: 'Lidah',
        pulseLabel: 'Nadi',
        voiceLabel: 'Suara',
        realDoctors: 'Doktor Sebenar. Kepercayaan Sebenar.',
        realDoctorsSub: 'Tidak seperti AI biasa, kami dibina BERSAMA pengamal TCM',
        doctorReview: '✓ Doktor TCM sebenar menyemak kes sukar',
        guidedQuestions: '✓ Soalan berpandu elak kekeliruan',
        notScraped: '✓ Bukan dari sumber internet rawak',
        practitionerBacked: 'AI Disokong Pengamal',
        triage: '"Adakah Ini Serius?"',
        triageSub: 'Dapatkan kejelasan segera sebelum lawatan klinik',
        triageFeature: 'Triaj AI dalam saat',
        reportFeature: 'Laporan kesihatan boleh kongsi',
        saveFeature: 'Jimat RM100+ setiap lawatan',
        getStarted: 'Sedia Bermula?',
        getStartedSub: 'Pilih bahasa pilihan anda',
        skip: 'Langkau',
        next: 'Seterusnya',
        start: 'Mula Diagnosis Saya',
    },
};

// Language options
const LANGUAGE_OPTIONS = [
    { code: 'en' as const, flag: '🇺🇸', name: 'English' },
    { code: 'zh' as const, flag: '🇨🇳', name: '中文' },
    { code: 'ms' as const, flag: '🇲🇾', name: 'Bahasa Malaysia' },
];

// Individual Slide Components
function MultiModalSlide({ t }: { t: typeof ONBOARDING_TEXT.en }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full px-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Trust Badge */}
            <motion.div
                className="flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{t.chatGptCant}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
                className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {t.multiModal}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                className="max-w-md mb-10 text-base text-white/70 md:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {t.multiModalSub}
            </motion.p>

            {/* Triple Icon Row */}
            <motion.div
                className="flex items-center justify-center gap-8 md:gap-12"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {[
                    { Icon: Eye, label: t.tongueLabel },
                    { Icon: Hand, label: t.pulseLabel },
                    { Icon: Ear, label: t.voiceLabel },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        className="flex flex-col items-center gap-3"
                        whileHover={{ scale: 1.1 }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                    >
                        <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                            <item.Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white/70">{item.label}</span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}

function TrustSlide({ t }: { t: typeof ONBOARDING_TEXT.en }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full px-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Main Icon */}
            <motion.div
                className="flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-emerald-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
            >
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </motion.div>

            {/* Title */}
            <motion.h1
                className="mb-4 text-3xl font-bold text-white md:text-4xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {t.realDoctors}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                className="max-w-md mb-8 text-base text-white/70 md:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {t.realDoctorsSub}
            </motion.p>

            {/* Bullet Points */}
            <motion.div
                className="flex flex-col gap-3 mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {[t.doctorReview, t.guidedQuestions, t.notScraped].map((point, index) => (
                    <motion.p
                        key={index}
                        className="text-sm text-white/80 md:text-base text-left"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                    >
                        {point}
                    </motion.p>
                ))}
            </motion.div>

            {/* Practitioner Badge */}
            <motion.div
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
            >
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">{t.practitionerBacked}</span>
            </motion.div>
        </motion.div>
    );
}

function TriageSlide({ t }: { t: typeof ONBOARDING_TEXT.en }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full px-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Main Icon with Pulse Animation */}
            <motion.div
                className="flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-emerald-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2,
                }}
            >
                <ClipboardList className="w-12 h-12 text-emerald-400" />
            </motion.div>

            {/* Title with Serious Styling */}
            <motion.h1
                className="mb-4 text-3xl font-bold text-amber-400 md:text-4xl"
                style={{ textShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {t.triage}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                className="max-w-md mb-8 text-base text-white/70 md:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {t.triageSub}
            </motion.p>

            {/* Feature Cards */}
            <motion.div
                className="flex flex-col gap-3 w-full max-w-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {[
                    { Icon: HelpCircle, text: t.triageFeature, highlight: false },
                    { Icon: Share2, text: t.reportFeature, highlight: false },
                    { Icon: Wallet, text: t.saveFeature, highlight: true },
                ].map((feature, index) => (
                    <motion.div
                        key={index}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl ${feature.highlight
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : 'bg-white/5'
                            }`}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.15 }}
                    >
                        <feature.Icon
                            className={`w-6 h-6 ${feature.highlight ? 'text-amber-400' : 'text-emerald-400'
                                }`}
                        />
                        <span
                            className={`text-sm font-medium ${feature.highlight ? 'text-amber-400' : 'text-white/80'
                                }`}
                        >
                            {feature.text}
                        </span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}

function LanguageSlide({
    t,
    language,
    setLanguage,
    onStart,
}: {
    t: typeof ONBOARDING_TEXT.en;
    language: 'en' | 'zh' | 'ms';
    setLanguage: (lang: 'en' | 'zh' | 'ms') => void;
    onStart: () => void;
}) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full px-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Rocket Icon */}
            <motion.div
                className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-amber-500/20"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
            >
                <Rocket className="w-10 h-10 text-amber-400" />
            </motion.div>

            {/* Title */}
            <motion.h1
                className="mb-2 text-3xl font-bold text-white md:text-4xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {t.getStarted}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                className="max-w-md mb-8 text-base text-white/70 md:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {t.getStartedSub}
            </motion.p>

            {/* Language Options */}
            <motion.div
                className="flex flex-col gap-3 w-full max-w-sm mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {LANGUAGE_OPTIONS.map((lang, index) => (
                    <motion.button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${language === lang.code
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                    >
                        <span className="text-2xl">{lang.flag}</span>
                        <span
                            className={`flex-1 text-left text-base font-medium ${language === lang.code ? 'text-emerald-400' : 'text-white'
                                }`}
                        >
                            {lang.name}
                        </span>
                        {language === lang.code && (
                            <Check className="w-5 h-5 text-emerald-400" />
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Start Button */}
            <motion.button
                onClick={onStart}
                className="relative w-full max-w-sm overflow-hidden rounded-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, scale: [1, 1.02, 1] }}
                transition={{
                    y: { delay: 0.9 },
                    opacity: { delay: 0.9 },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 },
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
            >
                {/* Button Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600" />

                {/* Inner Highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 rounded-t-full" />

                {/* Button Content */}
                <div className="relative flex items-center justify-center gap-3 px-8 py-4">
                    <span className="text-lg font-bold tracking-wide text-emerald-900 uppercase">
                        {t.start}
                    </span>
                    <ArrowRight className="w-6 h-6 text-emerald-900" />
                </div>
            </motion.button>
        </motion.div>
    );
}

// Pagination Dots Component
function PaginationDots({ currentIndex, total }: { currentIndex: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2">
            {Array.from({ length: total }).map((_, index) => (
                <motion.div
                    key={index}
                    className="h-2 rounded-full bg-white"
                    animate={{
                        width: currentIndex === index ? 24 : 8,
                        opacity: currentIndex === index ? 1 : 0.4,
                        backgroundColor: currentIndex === index ? COLORS.emeraldMedium : COLORS.white,
                    }}
                    transition={{ duration: 0.3 }}
                />
            ))}
        </div>
    );
}

// Main Onboarding Screen Component
export function OnboardingScreen() {
    const { language, setLanguage } = useLanguage();
    const { completeOnboarding } = useOnboarding();
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT.en;
    const isLastSlide = currentIndex === SLIDES.length - 1;

    const handleNext = useCallback(() => {
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex]);

    const handleSkip = useCallback(() => {
        completeOnboarding();
    }, [completeOnboarding]);

    const handleStart = useCallback(() => {
        completeOnboarding();
    }, [completeOnboarding]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && currentIndex < SLIDES.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            } else if (e.key === 'Escape') {
                handleSkip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, handleSkip]);

    // Render current slide
    const renderSlide = () => {
        switch (currentIndex) {
            case 0:
                return <MultiModalSlide t={t} />;
            case 1:
                return <TrustSlide t={t} />;
            case 2:
                return <TriageSlide t={t} />;
            case 3:
                return (
                    <LanguageSlide
                        t={t}
                        language={language}
                        setLanguage={setLanguage}
                        onStart={handleStart}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(to bottom, ${COLORS.emeraldDeep}, ${COLORS.emeraldDark}, #000000)`,
            }}
        >
            {/* Skip Button */}
            <AnimatePresence>
                {!isLastSlide && (
                    <motion.button
                        onClick={handleSkip}
                        className="absolute top-8 right-6 z-10 px-4 py-2 text-white/60 hover:text-white transition-colors"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {t.skip}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main Slide Content */}
            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        {renderSlide()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <div className="flex flex-col items-center gap-6 px-8 py-8 md:py-12">
                {/* Pagination Dots */}
                <PaginationDots currentIndex={currentIndex} total={SLIDES.length} />

                {/* Next Button (hidden on last slide) */}
                <AnimatePresence>
                    {!isLastSlide && (
                        <motion.button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/15 hover:bg-white/20 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="text-white font-medium">{t.next}</span>
                            <ArrowRight className="w-5 h-5 text-white" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
