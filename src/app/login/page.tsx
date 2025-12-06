"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'

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

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { user, profile, refreshProfile } = useAuth()
    const { t } = useLanguage()

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
        }
        return colors[color] || colors.slate
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center p-4">
            {/* Language Selector - Top Right */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSelector variant="dropdown" />
            </div>

            <div className="w-full max-w-sm">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    {/* Simple TCM-inspired logo mark */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 shadow-lg mb-4">
                        <span className="text-2xl text-amber-100 font-serif">中</span>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        {t.login.title}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {t.login.chineseTitle}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-sm font-medium text-gray-700 text-center">
                            {t.login.subtitle}
                        </h2>
                    </div>

                    {/* Role Buttons */}
                    <div className="p-4 space-y-3">
                        {roles.map((role) => {
                            const colorClasses = getColorClasses(role.color)
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => handleQuickLogin(role.id as 'patient' | 'doctor' | 'admin')}
                                    disabled={loading}
                                    className={`
                                        w-full group relative
                                        bg-white ${colorClasses.bg}
                                        border ${colorClasses.border}
                                        rounded-xl p-4
                                        transition-all duration-200
                                        hover:shadow-md
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`
                                            flex-shrink-0 w-10 h-10 rounded-lg
                                            ${colorClasses.iconBg}
                                            flex items-center justify-center text-white
                                            transition-colors duration-200
                                        `}>
                                            <role.icon />
                                        </div>

                                        {/* Text */}
                                        <div className="flex-grow text-left">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium text-gray-900 ${colorClasses.text} transition-colors`}>
                                                    {role.title}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {role.chinese}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {role.description}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    {/* Loading state */}
                                    {loading && (
                                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="px-4 pb-4">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    {t.login.devMode}
                </p>
            </div>
        </div>
    )
}
