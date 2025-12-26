'use client';

import { useLanguage } from '@/stores/useAppStore';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Smartphone, Stethoscope, UtensilsCrossed, Activity, Moon, Calendar, Heart, Users, ShoppingCart, Brain, CheckCircle2, Camera, Wifi, WifiOff, Fingerprint, Bell, Watch, Zap, Smartphone as MobileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileAppPage() {
    const { t } = useLanguage();

    // Mobile-exclusive features (primary focus)
    const mobileExclusiveFeatures = [
        {
            id: 'camera-ppg',
            icon: Camera,
            title: t.mobileFeatures?.cameraPPG?.title || 'Camera Pulse Measurement',
            description: t.mobileFeatures?.cameraPPG?.description || 'Revolutionary camera-based pulse measurement using photoplethysmography (PPG). Simply place your finger over the camera with flash to measure your heart rate - no additional devices needed.',
            image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80',
            gradient: 'from-red-500 to-rose-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'health-app-sync',
            icon: Activity,
            title: t.mobileFeatures?.healthAppSync?.title || 'Health App Integration',
            description: t.mobileFeatures?.healthAppSync?.description || 'Seamlessly sync with Apple Health, Google Fit, and Samsung Health. Automatically import steps, sleep, heart rate, and other vital metrics for comprehensive health tracking.',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
            gradient: 'from-blue-500 to-cyan-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'biometric-auth',
            icon: Fingerprint,
            title: t.mobileFeatures?.biometricAuth?.title || 'Biometric Security',
            description: t.mobileFeatures?.biometricAuth?.description || 'Secure your health data with Face ID, Touch ID, or fingerprint authentication. Quick and secure access to your personal health information.',
            image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&q=80',
            gradient: 'from-purple-500 to-indigo-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'offline-mode',
            icon: WifiOff,
            title: t.mobileFeatures?.offlineMode?.title || 'Offline Diagnosis',
            description: t.mobileFeatures?.offlineMode?.description || 'Complete TCM diagnosis even without internet connection. All core features work offline, with automatic sync when you reconnect.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80',
            gradient: 'from-slate-500 to-gray-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'push-notifications',
            icon: Bell,
            title: t.mobileFeatures?.pushNotifications?.title || 'Smart Notifications',
            description: t.mobileFeatures?.pushNotifications?.description || 'Personalized push notifications for medication reminders, health check-ups, seasonal TCM tips, and meridian organ clock alerts. Never miss important health moments.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80',
            gradient: 'from-amber-500 to-orange-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'wearable-integration',
            icon: Watch,
            title: t.mobileFeatures?.wearableIntegration?.title || 'Wearable Device Support',
            description: t.mobileFeatures?.wearableIntegration?.description || 'Connect with smartwatches and fitness trackers via Bluetooth. Real-time health data from your wearable devices automatically integrated into your TCM diagnosis.',
            image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=600&fit=crop&q=80',
            gradient: 'from-teal-500 to-cyan-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'enhanced-camera',
            icon: Camera,
            title: t.mobileFeatures?.enhancedCamera?.title || 'Enhanced Camera Capture',
            description: t.mobileFeatures?.enhancedCamera?.description || 'Advanced camera features for tongue, face, and body analysis with burst mode, timer, gesture controls, and quality overlays. Optimized for accurate TCM visual diagnosis.',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&q=80',
            gradient: 'from-emerald-500 to-teal-600',
            badge: 'Mobile Exclusive'
        },
        {
            id: 'haptic-feedback',
            icon: Zap,
            title: t.mobileFeatures?.hapticFeedback?.title || 'Haptic Feedback',
            description: t.mobileFeatures?.hapticFeedback?.description || 'Tactile feedback for every interaction. Feel the difference with haptic responses that enhance your mobile experience and make navigation intuitive.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80',
            gradient: 'from-violet-500 to-purple-600',
            badge: 'Mobile Exclusive'
        }
    ];

    // Features also available on web (secondary priority)
    const webAvailableFeatures = [
        {
            id: 'diagnosis',
            icon: Stethoscope,
            title: t.mobileFeatures?.diagnosis?.title || 'Four Pillars Diagnosis',
            description: t.mobileFeatures?.diagnosis?.description || 'AI-powered TCM diagnosis using Observation, Listening, Inquiry, and Pulse examination methods. Enhanced on mobile with better camera and audio capture.',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&q=80',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            id: 'snore-analysis',
            icon: Moon,
            title: t.mobileFeatures?.snoreAnalysis?.title || 'Snore Analysis',
            description: t.mobileFeatures?.snoreAnalysis?.description || 'AI-powered sleep sound recording and analysis for snoring and sleep apnea indicators. Optimized for mobile with better audio capture.',
            image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=600&fit=crop&q=80',
            gradient: 'from-indigo-500 to-purple-600'
        },
        {
            id: 'meal-planner',
            icon: UtensilsCrossed,
            title: t.mobileFeatures?.mealPlanner?.title || 'AI Meal Planner',
            description: t.mobileFeatures?.mealPlanner?.description || 'Personalized 7-day meal plans based on your TCM constitution with shopping lists and food suitability checker.',
            image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&q=80',
            gradient: 'from-amber-500 to-orange-600'
        },
        {
            id: 'health-tracking',
            icon: Activity,
            title: t.mobileFeatures?.healthTracking?.title || 'Health Tracking',
            description: t.mobileFeatures?.healthTracking?.description || 'Track your vitality scores, diagnosis patterns, and health trends over time with visual analytics.',
            image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80',
            gradient: 'from-blue-500 to-cyan-600'
        },
        {
            id: 'vitality-rhythm',
            icon: Calendar,
            title: t.mobileFeatures?.vitalityRhythm?.title || 'Vitality Rhythm',
            description: t.mobileFeatures?.vitalityRhythm?.description || 'Meridian Organ Clock, 24 Solar Terms guidance, and seasonal health tips aligned with TCM principles.',
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
            gradient: 'from-rose-500 to-pink-600'
        },
        {
            id: 'qi-dose',
            icon: Heart,
            title: t.mobileFeatures?.qiDose?.title || 'Qi Dose & Qi Garden',
            description: t.mobileFeatures?.qiDose?.description || 'Gamified TCM exercise routines (Baduanjin) and virtual herb gardening for wellness.',
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80',
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            id: 'community',
            icon: Users,
            title: t.mobileFeatures?.community?.title || 'Circle of Health',
            description: t.mobileFeatures?.community?.description || 'Constitution-based anonymous support communities for sharing wellness experiences.',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80',
            gradient: 'from-violet-500 to-purple-600'
        },
        {
            id: 'family-care',
            icon: Users,
            title: t.mobileFeatures?.familyCare?.title || 'Family Health Management',
            description: t.mobileFeatures?.familyCare?.description || 'Manage health profiles for your entire family with separate tracking and recommendations.',
            image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop&q=80',
            gradient: 'from-teal-500 to-cyan-600'
        },
        {
            id: 'herb-shop',
            icon: ShoppingCart,
            title: t.mobileFeatures?.herbShop?.title || 'One-Click Remedy',
            description: t.mobileFeatures?.herbShop?.description || 'Integrated Herb Shop for purchasing recommended herbal formulas and TCM remedies.',
            image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop&q=80',
            gradient: 'from-amber-600 to-yellow-700'
        },
        {
            id: 'digital-twin',
            icon: Brain,
            title: t.mobileFeatures?.digitalTwin?.title || 'Digital Twin',
            description: t.mobileFeatures?.digitalTwin?.description || 'Live visualization of organ health status based on your TCM diagnosis and constitution.',
            image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop&q=80',
            gradient: 'from-slate-500 to-gray-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30">
            {/* Header */}
            <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t.common?.back || 'Back'}
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">
                                    {t.mobileFeatures?.pageTitle || 'Sihat TCM Mobile App'}
                                </h1>
                                <p className="text-sm text-emerald-200">
                                    {t.mobileFeatures?.pageSubtitle || 'Your health companion, anytime, anywhere'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white py-16 md:py-24">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
                            <Smartphone className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                            {t.mobileFeatures?.heroTitle || 'Mobile-Exclusive Features'}
                        </h2>
                        <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                            {t.mobileFeatures?.heroDescription || 'Discover powerful features available only on mobile: camera pulse measurement, health app integration, biometric security, offline mode, and more. Experience TCM health management like never before.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Mobile-Exclusive Features (Primary) */}
            <section className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                        <MobileIcon className="w-4 h-4" />
                        Mobile Exclusive
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">
                        {t.mobileFeatures?.exclusiveFeaturesTitle || 'Features Only Available on Mobile'}
                    </h3>
                    <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                        {t.mobileFeatures?.exclusiveFeaturesSubtitle || 'These powerful features are designed specifically for mobile devices and take full advantage of your phone\'s capabilities.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mobileExclusiveFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-emerald-100"
                            >
                                {/* Badge */}
                                <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                                    {feature.badge}
                                </div>

                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-80`}></div>
                                    <div className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-xl z-10">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-stone-800 mb-2">
                                        {feature.title}
                                    </h4>
                                    <p className="text-stone-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Hover Effect */}
                                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Also Available on Web (Secondary) */}
            <section className="bg-stone-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-4">
                            {t.mobileFeatures?.webFeaturesTitle || 'Also Available on Web'}
                        </h3>
                        <p className="text-base text-stone-600 max-w-2xl mx-auto">
                            {t.mobileFeatures?.webFeaturesSubtitle || 'These features are available on both web and mobile, with enhanced mobile experience.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {webAvailableFeatures.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.id}
                                    className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 opacity-90"
                                >
                                    {/* Image */}
                                    <div className="relative h-40 overflow-hidden">
                                        <Image
                                            src={feature.image}
                                            alt={feature.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-70`}></div>
                                        <div className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h4 className="text-lg font-bold text-stone-800 mb-2">
                                            {feature.title}
                                        </h4>
                                        <p className="text-sm text-stone-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-3xl md:text-4xl font-bold text-center text-stone-800 mb-12">
                            {t.mobileFeatures?.benefitsTitle || 'Why Choose Sihat TCM Mobile?'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                t.mobileFeatures?.benefit1 || 'Multi-language support (English, Chinese, Malay)',
                                t.mobileFeatures?.benefit2 || 'Offline diagnosis capabilities',
                                t.mobileFeatures?.benefit3 || 'Secure cloud sync across devices',
                                t.mobileFeatures?.benefit4 || 'Real-time AI-powered insights',
                                t.mobileFeatures?.benefit5 || 'Privacy-first health data management',
                                t.mobileFeatures?.benefit6 || 'Regular updates with new features'
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-stone-700 font-medium">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Download CTA Section */}
            <section className="bg-gradient-to-br from-emerald-950 to-teal-950 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl md:text-4xl font-bold mb-4">
                            {t.mobileFeatures?.ctaTitle || 'Ready to Start Your Health Journey?'}
                        </h3>
                        <p className="text-lg text-emerald-200 mb-8">
                            {t.mobileFeatures?.ctaDescription || 'Download the Sihat TCM mobile app today and experience the future of TCM health management.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="/sihat-tcm.apk"
                                download
                                className="flex items-center gap-2 bg-white text-emerald-950 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors shadow-lg font-semibold"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.84 3.67-.84 1.54 0 2.72.63 3.45 1.77-3.11 1.66-2.57 6.47.66 7.97-.53 1.65-1.33 3.26-2.86 5.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.39-2.11 4.21-3.74 4.25z" />
                                </svg>
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider opacity-60">Download on</span>
                                    <span className="text-sm font-bold">App Store</span>
                                </div>
                            </a>
                            <a
                                href="/sihat-tcm.apk"
                                download
                                className="flex items-center gap-2 bg-transparent border-2 border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.2,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M14.63,12L4.8,1.64c0.61-0.25,1.26-0.25,1.88,0l12.87,7.15C19.86,9.15,20,9.58,20,10s-0.14,0.85-0.45,1.21l-12.87,7.15c-0.61,0.25-1.26,0.25-1.88,0L14.63,12Z" />
                                </svg>
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">Get it on</span>
                                    <span className="text-sm font-bold">Google Play</span>
                                </div>
                            </a>
                            <a
                                href="/sihat-tcm.apk"
                                download
                                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg font-semibold border border-emerald-500"
                            >
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">{t.appDownload.directDownload || 'Direct Download'}</span>
                                    <span className="text-sm font-bold">{t.appDownload.downloadApk || 'Download APK'}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

