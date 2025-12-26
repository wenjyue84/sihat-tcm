'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/useAppStore'
import { useLanguage } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
    Globe,
    Check,
    Loader2,
    Sparkles,
    Zap,
    List,
    User,
    LogOut,
    Shield,
    ChevronRight,
    Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function PatientSettings() {
    const { user, profile, updatePreferences, signOut, refreshProfile } = useAuth()
    const router = useRouter()
    const { language, setLanguage, languageNames, t } = useLanguage()
    const [savingLanguage, setSavingLanguage] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            router.push('/')
        } catch (error) {
            setLoggingOut(false)
        }
    }

    const handleLanguageChange = async (langCode: 'en' | 'zh' | 'ms') => {
        if (language === langCode) return
        setSavingLanguage(true)
        setLanguage(langCode)

        // Save to database if logged in
        if (user) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ preferred_language: langCode })
                    .eq('id', user.id)

                if (!error) {
                    refreshProfile()
                }
            } catch (err) {
                console.error('Error saving language:', err)
            }
        }
        setSavingLanguage(false)
    }

    const currentMode = profile?.preferences?.diagnosisMode || 'simple'

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t.patientDashboard.tabs.settings}</h2>
                    <p className="text-slate-500">{t.patientDashboard.settings.accountDetails}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Appearance / Mode Settings */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900">
                                        {t.patientDashboard.settings.diagnosisMode}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {t.patientDashboard.settings.diagnosisModeDesc}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                {[
                                    {
                                        id: 'simple',
                                        title: t.patientDashboard.settings.simpleMode,
                                        desc: t.patientDashboard.settings.simpleModeDesc,
                                        icon: Zap
                                    },
                                    {
                                        id: 'advanced',
                                        title: t.patientDashboard.settings.advancedMode,
                                        desc: t.patientDashboard.settings.advancedModeDesc,
                                        icon: List
                                    }
                                ].map((mode) => {
                                    const isSelected = currentMode === mode.id
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => updatePreferences({ diagnosisMode: mode.id })}
                                            className={`relative flex flex-col items-start p-6 text-left transition-all hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/30' : ''
                                                }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-3">
                                                <div className={`p-2 rounded-md ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <mode.icon className="w-4 h-4" />
                                                </div>
                                                {isSelected && (
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className={`font-semibold mb-1 ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{mode.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-4">{mode.desc}</p>

                                            <div className="mt-auto pt-3 w-full border-t border-slate-100/50">
                                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                                                    {mode.id === 'simple' ? t.patientDashboard.settings.hiddenPages : t.patientDashboard.settings.includedPages}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                                                        {t.patientDashboard.settings.stepInquirySummary}
                                                    </span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                                                        {t.patientDashboard.settings.stepPulse}
                                                    </span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                                                        +1
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Language Settings - Compact Grid */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900">
                                        {t.patientDashboard.settings.languagePreference}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {t.patientDashboard.settings.chooseLanguage}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { code: 'en' as const, flag: '🇬🇧', name: 'English' },
                                    { code: 'zh' as const, flag: '🇨🇳', name: '中文' },
                                    { code: 'ms' as const, flag: '🇲🇾', name: 'Bahasa' }
                                ].map((lang) => {
                                    const isActive = language === lang.code
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            disabled={savingLanguage}
                                            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${isActive
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 ring-offset-0'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <span className="text-xl shrink-0">{lang.flag}</span>
                                            <span className="font-medium text-sm">{lang.name}</span>
                                            {isActive && (
                                                <div className="ml-auto">
                                                    {savingLanguage ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                                    ) : (
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Account & Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900">
                                        {t.patientDashboard.settings.accountInfo}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex items-center p-4 border-b border-slate-50">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                    {(profile?.full_name?.[0] || user?.email?.[0] || 'P').toUpperCase()}
                                </div>
                                <div className="ml-3 overflow-hidden">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {profile?.full_name || 'Patient'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="p-2">
                                <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                                    <span className="text-xs text-slate-500">{t.patientDashboard.settings.accountType}</span>
                                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded-full capitalize">
                                        {profile?.role || 'Patient'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                                    <span className="text-xs text-slate-500">{t.patientDashboard.settings.memberSince}</span>
                                    <span className="text-xs font-medium text-slate-700">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        variant="outline"
                        className="w-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-10"
                    >
                        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                        {t.patientDashboard.settings.signOut}
                    </Button>
                </div>
            </div>
        </div>
    )
}
