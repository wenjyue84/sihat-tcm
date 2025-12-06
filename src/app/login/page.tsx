"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'

// Traditional Chinese Medicine themed icons as SVG components
const YinYangIcon = () => (
    <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-4 animate-spin-slow">
        <defs>
            <linearGradient id="yinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#16213e" />
            </linearGradient>
            <linearGradient id="yangGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5e6d3" />
                <stop offset="100%" stopColor="#e8d4b8" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#yangGradient)" stroke="#8B4513" strokeWidth="2" />
        <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="url(#yinGradient)" />
        <circle cx="50" cy="26" r="8" fill="url(#yangGradient)" />
        <circle cx="50" cy="74" r="8" fill="url(#yinGradient)" />
    </svg>
)

const PatientIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-3m0 0l-2-2m2 2l2-2" opacity="0.6" />
    </svg>
)

const DoctorIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.5 6.5H6.5L5 14.5m14 0l-4.5-4.091m-9 4.091L10 10.409" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
)

const AdminIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

// Decorative corner pattern
const CornerPattern = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none">
        <path d="M0 0 L30 0 Q15 15 0 30 Z" fill="currentColor" opacity="0.1" />
        <path d="M5 0 L50 0 Q20 20 0 50" stroke="currentColor" strokeWidth="1" opacity="0.2" fill="none" />
        <path d="M10 0 L70 0 Q25 25 0 70" stroke="currentColor" strokeWidth="0.5" opacity="0.15" fill="none" />
        <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="25" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="25" cy="8" r="2" fill="currentColor" opacity="0.2" />
    </svg>
)

// Chinese Cloud Pattern
const CloudPattern = () => (
    <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0,80 Q50,60 100,80 T200,80 T300,80 T400,80 L400,100 L0,100 Z" fill="currentColor" />
        <path d="M0,85 Q75,65 150,85 T300,85 T400,85" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
)

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hoveredRole, setHoveredRole] = useState<string | null>(null)
    const router = useRouter()
    const { user, profile, refreshProfile } = useAuth()
    const { t, language } = useLanguage()

    if (user && profile) {
        router.push(`/${profile.role}`)
    }

    const handleQuickLogin = async (role: 'patient' | 'doctor' | 'admin') => {
        setLoading(true)
        setError(null)
        const email = `${role}@sihat.com`
        const password = 'password123'

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.log('Login failed, trying signup...', error.message)
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                            role: role,
                        },
                    },
                })

                if (signUpError) throw signUpError

                if (signUpData.user) {
                    if (!signUpData.session) {
                        alert('Please check your email to confirm your account, or disable "Confirm email" in your Supabase Authentication settings.')
                        return
                    }

                    const newProfile = {
                        id: signUpData.user.id,
                        role: role,
                        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    }
                    const { error: upsertError } = await supabase.from('profiles').upsert(newProfile)
                    if (upsertError) {
                        console.error('Signup Upsert Error:', JSON.stringify(upsertError, null, 2))
                        throw upsertError
                    }

                    await refreshProfile(signUpData.user.id, newProfile)
                    router.push(`/${role}`)
                }
            } else {
                if (data.user) {
                    const newProfile = {
                        id: data.user.id,
                        role: role,
                        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    }
                    const { error: upsertError } = await supabase.from('profiles').upsert(newProfile)
                    if (upsertError) {
                        console.error('Login Upsert Error:', JSON.stringify(upsertError, null, 2))
                        throw upsertError
                    }

                    await refreshProfile(data.user.id, newProfile)
                    router.push(`/${role}`)
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const roles = [
        {
            id: 'patient',
            title: t.login.roles.patient.titleZh,
            subtitle: t.login.roles.patient.title,
            description: t.login.roles.patient.description,
            icon: PatientIcon,
            gradient: 'from-emerald-600 to-teal-700',
            hoverGradient: 'from-emerald-500 to-teal-600',
            borderColor: 'border-emerald-200',
            shadowColor: 'shadow-emerald-200/50',
        },
        {
            id: 'doctor',
            title: t.login.roles.doctor.titleZh,
            subtitle: t.login.roles.doctor.title,
            description: t.login.roles.doctor.description,
            icon: DoctorIcon,
            gradient: 'from-amber-600 to-orange-700',
            hoverGradient: 'from-amber-500 to-orange-600',
            borderColor: 'border-amber-200',
            shadowColor: 'shadow-amber-200/50',
        },
        {
            id: 'admin',
            title: t.login.roles.admin.titleZh,
            subtitle: t.login.roles.admin.title,
            description: t.login.roles.admin.description,
            icon: AdminIcon,
            gradient: 'from-rose-600 to-red-700',
            hoverGradient: 'from-rose-500 to-red-600',
            borderColor: 'border-rose-200',
            shadowColor: 'shadow-rose-200/50',
        },
    ]

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Gradient Background with traditional colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />

            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%238B4513' fill-opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-700 via-amber-600 to-rose-700" />

            {/* Language Selector - Top Right */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSelector variant="dropdown" />
            </div>

            {/* Corner decorations */}
            <CornerPattern className="absolute top-4 left-4 w-24 h-24 text-amber-800" />
            <CornerPattern className="absolute top-4 right-4 w-24 h-24 text-amber-800 -scale-x-100" />
            <CornerPattern className="absolute bottom-4 left-4 w-24 h-24 text-amber-800 -scale-y-100" />
            <CornerPattern className="absolute bottom-4 right-4 w-24 h-24 text-amber-800 scale-[-1]" />

            {/* Cloud pattern at bottom */}
            <CloudPattern />

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header Card with traditional styling */}
                    <div className="text-center mb-8">
                        {/* Yin Yang Symbol */}
                        <YinYangIcon />

                        {/* Main Title with Chinese Characters */}
                        <h1 className="text-4xl font-bold text-amber-900 mb-2 tracking-wide">
                            <span className="block text-5xl mb-1 font-serif">{t.login.chineseTitle}</span>
                            <span className="text-xl font-normal text-amber-700">{t.login.title}</span>
                        </h1>

                        {/* Decorative divider */}
                        <div className="flex items-center justify-center gap-3 my-4">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
                            <div className="w-2 h-2 rotate-45 bg-amber-500" />
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
                        </div>

                        <p className="text-amber-700 text-sm italic">
                            {t.login.quote}
                        </p>
                    </div>

                    {/* Login Cards */}
                    <div className="space-y-4">
                        {/* Section Title */}
                        <div className="text-center mb-6">
                            <span className="inline-block px-4 py-1 bg-amber-100/80 rounded-full text-amber-800 text-sm font-medium border border-amber-200">
                                {t.login.chineseSubtitle} · {t.login.subtitle}
                            </span>
                        </div>

                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleQuickLogin(role.id as 'patient' | 'doctor' | 'admin')}
                                disabled={loading}
                                onMouseEnter={() => setHoveredRole(role.id)}
                                onMouseLeave={() => setHoveredRole(null)}
                                className={`
                                    w-full group relative overflow-hidden
                                    bg-white/80 backdrop-blur-sm
                                    border-2 ${role.borderColor}
                                    rounded-xl p-4
                                    transition-all duration-300 ease-out
                                    hover:shadow-xl ${role.shadowColor}
                                    hover:scale-[1.02] hover:-translate-y-1
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                                    focus:outline-none focus:ring-4 focus:ring-amber-200
                                `}
                            >
                                {/* Gradient overlay on hover */}
                                <div
                                    className={`
                                        absolute inset-0 opacity-0 group-hover:opacity-10 
                                        bg-gradient-to-r ${role.gradient}
                                        transition-opacity duration-300
                                    `}
                                />

                                <div className="relative flex items-center gap-4">
                                    {/* Icon container */}
                                    <div className={`
                                        flex-shrink-0 w-14 h-14 rounded-lg
                                        bg-gradient-to-br ${hoveredRole === role.id ? role.hoverGradient : role.gradient}
                                        flex items-center justify-center text-white
                                        shadow-lg transition-all duration-300
                                        group-hover:shadow-xl group-hover:scale-110
                                    `}>
                                        <role.icon />
                                    </div>

                                    {/* Text content */}
                                    <div className="flex-grow text-left">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-gray-800 font-serif">
                                                {role.title}
                                            </span>
                                            <span className="text-sm font-medium text-gray-600">
                                                {role.subtitle}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {role.description}
                                        </p>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:translate-x-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Loading overlay */}
                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    {/* Footer note */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-amber-600/70">
                            {t.login.devMode} · {t.login.devModeZh}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-500/60">
                            <span>{t.login.balanceZh}</span>
                            <span>·</span>
                            <span>{t.login.balance}</span>
                            <span>·</span>
                            <span>{t.login.harmonyZh}</span>
                            <span>·</span>
                            <span>{t.login.harmony}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom animation styles */}
            <style jsx>{`
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                :global(.animate-spin-slow) {
                    animation: spin-slow 20s linear infinite;
                }
            `}</style>
        </div>
    )
}
