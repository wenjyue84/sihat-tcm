"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { useDeveloper } from '@/contexts/DeveloperContext'
import { Home, Mail, Lock, User as UserIcon, Terminal } from 'lucide-react'

// Simple, elegant icons
const PatientIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
)

const DoctorIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.5 6.5H6.5L5 14.5m14 0l-4.5-4.091m-9 4.091L10 10.409" />
    </svg>
)

const AdminIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const DeveloperIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
)

function LoginFormContent() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    })

    const router = useRouter()
    const searchParams = useSearchParams()

    // Set initial mode from URL param
    useEffect(() => {
        const modeParam = searchParams.get('mode')
        if (modeParam === 'signup' || modeParam === 'login') {
            setMode(modeParam)
        }
    }, [searchParams])

    const { user, profile, refreshProfile } = useAuth()
    const { t } = useLanguage()
    const { isDeveloperMode, toggleDeveloperMode } = useDeveloper()

    // Redirect authenticated users to their dashboard
    useEffect(() => {
        if (user && profile) {
            router.push(`/${profile.role}`)
        }
    }, [user, profile, router])

    const handleQuickLogin = async (role: 'patient' | 'doctor' | 'admin' | 'developer') => {
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
                // Determine if we should try reset logic or just fail. 
                // For "Quick Login", the original logic tried to signup if login failed. 
                // Preserving original behavior for Quick Login buttons as requested.
                console.log('Login failed, trying signup...', error.message)
                await handleQuickSignup(role, email, password)
            } else {
                if (data.user) {
                    await handleProfileUpsert(data.user.id, role, `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`)
                    router.push(`/${role}`)
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleQuickSignup = async (role: 'patient' | 'doctor' | 'admin' | 'developer', email: string, password: string) => {
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
            await handleProfileUpsert(signUpData.user.id, role, `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`)
            router.push(`/${role}`)
        }
    }

    const handleProfileUpsert = async (userId: string, role: string, fullName: string) => {
        const newProfile = {
            id: userId,
            role: role as any,
            full_name: fullName,
        }
        const { error: upsertError } = await supabase.from('profiles').upsert(newProfile)
        if (upsertError) {
            console.error('Profile Upsert Error:', JSON.stringify(upsertError, null, 2))
            throw upsertError
        }
        await refreshProfile(userId, newProfile)
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: 'patient', // Default to patient for new signups
                        },
                    },
                })
                if (error) throw error
                if (data.user) {
                    await handleProfileUpsert(data.user.id, 'patient', formData.fullName)
                    // Optionally show success message or auto-login
                    router.push('/patient')
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })
                if (error) throw error
                if (data.user) {
                    // Fetch profile to know role
                    // Refresh profile handles fetching
                    await refreshProfile(data.user.id)
                    // We need to wait for profile to update or fetch it directly to redirect
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
                    router.push(`/${profile?.role || 'patient'}`)
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
            title: t.login.roles.patient.title,
            chinese: t.login.roles.patient.titleZh,
            description: t.login.roles.patient.description,
            icon: PatientIcon,
            color: 'emerald',
        },
        {
            id: 'doctor',
            title: t.login.roles.doctor.title,
            chinese: t.login.roles.doctor.titleZh,
            description: t.login.roles.doctor.description,
            icon: DoctorIcon,
            color: 'amber',
        },
        {
            id: 'admin',
            title: t.login.roles.admin.title,
            chinese: t.login.roles.admin.titleZh,
            description: t.login.roles.admin.description,
            icon: AdminIcon,
            color: 'slate',
        },
        {
            id: 'developer',
            title: t.login.roles.developer.title,
            chinese: t.login.roles.developer.titleZh,
            description: t.login.roles.developer.description,
            icon: DeveloperIcon,
            color: 'violet',
        },
    ]

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
            emerald: {
                bg: 'hover:bg-emerald-50',
                border: 'border-gray-200 hover:border-emerald-300',
                text: 'group-hover:text-emerald-700',
                iconBg: 'bg-emerald-600 group-hover:bg-emerald-700',
            },
            amber: {
                bg: 'hover:bg-amber-50',
                border: 'border-gray-200 hover:border-amber-300',
                text: 'group-hover:text-amber-700',
                iconBg: 'bg-amber-600 group-hover:bg-amber-700',
            },
            slate: {
                bg: 'hover:bg-slate-50',
                border: 'border-gray-200 hover:border-slate-400',
                text: 'group-hover:text-slate-700',
                iconBg: 'bg-slate-600 group-hover:bg-slate-700',
            },
            violet: {
                bg: 'hover:bg-violet-50',
                border: 'border-gray-200 hover:border-violet-300',
                text: 'group-hover:text-violet-700',
                iconBg: 'bg-violet-600 group-hover:bg-violet-700',
            },
        }
        return colors[color] || colors.slate
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center p-4">
            {/* Home Button - Top Left */}
            <Link
                href="/"
                className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">{t.nav.home}</span>
            </Link>

            {/* Language Selector - Top Right */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSelector variant="dropdown" />
            </div>

            <div className={`w-full ${mode === 'signup' ? 'max-w-4xl' : 'max-w-md'} transition-all duration-500`}>
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    {/* Breathing animation keyframes */}
                    <style jsx>{`
                        @keyframes breathing {
                            0%, 100% {
                                transform: scale(1);
                            }
                            50% {
                                transform: scale(1.05);
                            }
                        }
                        .logo-breathing {
                            animation: breathing 3.5s ease-in-out infinite;
                        }
                    `}</style>
                    <div className="logo-breathing inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 shadow-lg mb-4">
                        <span className="text-2xl text-amber-100 font-serif">中</span>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        {t.login.title}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {t.login.chineseTitle}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">

                    {/* SignUp Benefits Side Panel - Only visible in Signup Mode */}
                    {mode === 'signup' && (
                        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 text-white flex-col justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-6">{t.login.benefits.title}</h3>
                                <ul className="space-y-6">
                                    <li className="flex items-start gap-4">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-lg text-emerald-50">{t.login.benefits.saveProfile}</h4>
                                            <p className="text-emerald-200/80 text-sm">Save your data securely so you don't have to re-enter it.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-lg text-emerald-50">{t.login.benefits.saveReports}</h4>
                                            <p className="text-emerald-200/80 text-sm">Access your previous diagnosis results.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-lg text-emerald-50">{t.login.benefits.trackProgress}</h4>
                                            <p className="text-emerald-200/80 text-sm">Monitor your health improvements over time.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Main Form Content */}
                    <div className="flex-1 p-6 md:p-8 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {mode === 'login' ? t.login.signin : t.login.signup}
                            </h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setMode('login')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t.login.signin}
                                </button>
                                <button
                                    onClick={() => setMode('signup')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t.login.signup}
                                </button>
                            </div>
                        </div>

                        {/* Email/Pass Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.login.fullName}</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="John Doe"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.login.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.login.password}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {mode === 'login' ? t.login.signin : t.login.signup}
                            </button>

                            {/* Error message - positioned right after submit button for visibility */}
                            {error && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                                    <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                                </div>
                            )}
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">{t.login.or}</span>
                            </div>
                        </div>

                        {/* Quick Access Roles */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">{t.login.quickAccess}</h3>
                            <div className="space-y-3">
                                {roles.map((role) => {
                                    const colorClasses = getColorClasses(role.color)
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => handleQuickLogin(role.id as any)}
                                            disabled={loading}
                                            className={`
                                                w-full group relative
                                                bg-white hover:bg-gray-50
                                                border border-gray-200 hover:border-gray-300
                                                rounded-xl p-3
                                                transition-all duration-200
                                                flex items-center gap-4
                                            `}
                                        >
                                            <div className={`
                                                flex-shrink-0 w-8 h-8 rounded-lg
                                                ${colorClasses.iconBg}
                                                flex items-center justify-center text-white
                                            `}>
                                                <role.icon />
                                            </div>
                                            <div className="flex-grow text-left">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-700 text-sm">{role.title}</span>
                                                    <span className="text-xs text-gray-400">{role.chinese}</span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs mt-6 text-gray-400">
                    Developed by Prisma Technology Solution Sdn Bhd
                </div>
            </div>
        </div>
    )
}

export function LoginForm() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <LoginFormContent />
        </Suspense>
    )
}
