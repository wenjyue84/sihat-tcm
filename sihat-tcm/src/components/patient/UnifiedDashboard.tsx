'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import {
    FileHeart,
    User,
    Upload,
    Plus,
    LogOut,
    Loader2,
    Edit,
    FileText,
    Download,
    Eye,
    Trash2,
    UtensilsCrossed,
    Settings,
    Globe,
    Check,
    Grid3X3,
    List,
    LayoutGrid,
    ArrowUp,
    ArrowDown,
    Calendar,
    TrendingUp,
    TrendingDown,
    Minus,
    Home,
    ExternalLink,
    Activity,
    Heart,
    Moon,
    Utensils,
    Sparkles,
    Wind,
    ArrowRight,
    Users,
    Zap,
    Menu,
    X,
    Pill,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    getPatientHistory,
    getHealthTrends,
    DiagnosisSession,
    seedPatientHistory,
    getMedicalReports,
    saveMedicalReport,
    deleteMedicalReport,
    seedMedicalReports,
    MedicalReport
} from '@/lib/actions'
import { supabase } from '@/lib/supabase/client'
import { TrendWidget } from './TrendWidget'
import { HistoryCard } from './HistoryCard'
import { MealPlanWizard } from '../meal-planner/MealPlanWizard'
import { SnoreAnalysisTab } from './snore-analysis/SnoreAnalysisTab'
import { VitalityRhythmTab } from './VitalityRhythmTab'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLanguageSync } from '@/hooks/useLanguageSync'
import { TCMFoodChecker } from '../meal-planner/TCMFoodChecker'
import { QiDose } from '../qi-dose/QiDose'
import { extractDiagnosisTitle, extractConstitutionType } from '@/lib/tcm-utils'

import { DocumentViewerModal } from './DocumentViewerModal'
import { CircleOfHealth } from './CircleOfHealth'
import { FamilyManagement } from './FamilyManagement'
import { PatientSettings } from './PatientSettings'

export function UnifiedDashboard() {
    const { user, profile, updatePreferences, signOut, refreshProfile } = useAuth()
    const router = useRouter()
    const { language, setLanguage, languageNames, t } = useLanguage()

    // Sync language from profile on login
    useLanguageSync()

    // Health Journey State
    const [sessions, setSessions] = useState<DiagnosisSession[]>([])
    const [trendData, setTrendData] = useState<any>(null)
    const [loadingSessions, setLoadingSessions] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)

    // View & Sort State
    type ViewType = 'table' | 'list' | 'gallery'
    type SortField = 'date' | 'score' | 'diagnosis'
    type SortDirection = 'asc' | 'desc'

    const [viewType, setViewTypeState] = useState<ViewType>('table')
    const [sortField, setSortFieldState] = useState<SortField>('date')
    const [sortDirection, setSortDirectionState] = useState<SortDirection>('desc')

    // Profile State
    const [profileData, setProfileData] = useState({
        full_name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        medical_history: ''
    })
    const [editingProfile, setEditingProfile] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    // Documents State
    const [reports, setReports] = useState<MedicalReport[]>([])
    const [loadingReports, setLoadingReports] = useState(true)
    const [uploadingReport, setUploadingReport] = useState(false)
    const [seeding, setSeeding] = useState(false)
    const [seedingReports, setSeedingReports] = useState(false)
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Active Section
    const [activeSection, setActiveSectionState] = useState<'journey' | 'profile' | 'documents' | 'meals' | 'snore' | 'qi-dose' | 'vitality' | 'community' | 'family' | 'settings'>('journey')
    const [mealSubSection, setMealSubSection] = useState<'plan' | 'checker'>('plan')

    // Settings State
    const [savingLanguage, setSavingLanguage] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Initialize from profile preferences
    useEffect(() => {
        if (profile?.preferences) {
            if (profile.preferences.viewType) setViewTypeState(profile.preferences.viewType as ViewType)
            if (profile.preferences.sortField) setSortFieldState(profile.preferences.sortField as SortField)
            if (profile.preferences.sortDirection) setSortDirectionState(profile.preferences.sortDirection as SortDirection)
            if (profile.preferences.activeSection) setActiveSectionState(profile.preferences.activeSection as any)
        }
    }, [profile])

    // Wrappers to update state and sync preferences
    const setViewType = (type: ViewType) => {
        setViewTypeState(type)
        updatePreferences({ viewType: type })
    }

    const setSortField = (field: SortField) => {
        setSortFieldState(field)
        updatePreferences({ sortField: field })
    }

    const setSortDirection = (dir: SortDirection) => {
        setSortDirectionState(dir)
        updatePreferences({ sortDirection: dir })
    }

    const setActiveSection = (section: 'journey' | 'profile' | 'documents' | 'meals' | 'snore' | 'qi-dose' | 'vitality' | 'community' | 'family' | 'settings') => {
        setActiveSectionState(section)
        updatePreferences({ activeSection: section })
    }

    // Load health journey data
    useEffect(() => {
        async function loadHealthData() {
            if (!user) return

            try {
                setLoadingSessions(true)
                const [historyResult, trendsResult] = await Promise.all([
                    getPatientHistory(50, 0),
                    getHealthTrends(30)
                ])

                if (historyResult.success && historyResult.data) {
                    setSessions(historyResult.data)
                }

                if (trendsResult.success && trendsResult.data) {
                    setTrendData(trendsResult.data)
                }
            } catch (err) {
                console.error('[UnifiedDashboard] Error loading health data:', err)
            } finally {
                setLoadingSessions(false)
            }
        }

        loadHealthData()
    }, [user])

    // Load profile data
    useEffect(() => {
        if (profile) {
            setProfileData({
                full_name: profile.full_name || '',
                age: profile.age?.toString() || '',
                gender: profile.gender || '',
                height: profile.height?.toString() || '',
                weight: profile.weight?.toString() || '',
                medical_history: profile.medical_history || ''
            })
        }
    }, [profile])

    // Load documents from Supabase
    useEffect(() => {
        async function loadReports() {
            if (!user) return
            try {
                setLoadingReports(true)
                const result = await getMedicalReports()
                if (result.success && result.data) {
                    setReports(result.data)
                }
            } catch (err) {
                console.error('[UnifiedDashboard] Error loading reports:', err)
            } finally {
                setLoadingReports(false)
            }
        }

        loadReports()
    }, [user])

    // Handle profile save
    const handleSaveProfile = async () => {
        if (!user) return

        try {
            setSavingProfile(true)

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.full_name,
                    age: parseInt(profileData.age) || null,
                    gender: profileData.gender,
                    height: parseFloat(profileData.height) || null,
                    weight: parseFloat(profileData.weight) || null,
                    medical_history: profileData.medical_history
                })
                .eq('id', user.id)

            if (error) throw error

            setEditingProfile(false)
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Failed to save profile. Please try again.')
        } finally {
            setSavingProfile(false)
        }
    }

    // Handle document upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        try {
            setUploadingReport(true)

            // Optional: Upload to Supabase Storage
            let file_url = undefined
            try {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('medical-reports')
                    .upload(filePath, file)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('medical-reports')
                        .getPublicUrl(filePath)
                    file_url = publicUrl
                } else {
                    console.warn('Storage upload failed (bucket might not exist), falling back to metadata only:', uploadError.message)
                }
            } catch (storageErr) {
                console.warn('Storage error, falling back to metadata only:', storageErr)
            }

            const newReport = {
                name: file.name,
                date: new Date().toISOString().split('T')[0],
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                type: file.type,
                file_url
            }

            const result = await saveMedicalReport(newReport)

            if (result.success && result.data) {
                setReports([result.data, ...reports])
            } else if (!result.success) {
                alert('Failed to save report: ' + result.error)
            }
        } catch (error) {
            console.error('Error in handleFileChange:', error)
            alert('An error occurred while uploading the report.')
        } finally {
            setUploadingReport(false)
            e.target.value = ''
        }
    }

    // Handle document delete
    const handleDeleteReport = async (reportId: string) => {
        if (confirm(t.patientDashboard.documents.deleteConfirm)) {
            try {
                const result = await deleteMedicalReport(reportId)
                if (result.success) {
                    setReports(reports.filter(r => r.id !== reportId))
                } else {
                    alert('Failed to delete report: ' + result.error)
                }
            } catch (error) {
                console.error('Error deleting report:', error)
            }
        }
    }

    // Handle logout
    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            router.push('/')
        } catch (error) {
            setLoggingOut(false)
        }
    }

    const handleRestoreData = async () => {
        if (!confirm('This will add mocked data to your history. Proceed?')) return
        try {
            setSeeding(true)
            const result = await seedPatientHistory()
            if (result.success) {
                alert('Mock data restored successfully!')
                window.location.reload()
            } else {
                if (result.error && (result.error.includes('does not exist') || result.error.includes('relation "public.diagnosis_sessions"'))) {
                    alert('Database Error: The "diagnosis_sessions" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.')
                } else {
                    alert('Failed to restore mock data: ' + result.error)
                }
            }
        } catch (error) {
            console.error('Error restoring mock data:', error)
            alert('An unexpected error occurred.')
        } finally {
            setSeeding(false)
        }
    }

    const handleRestoreMedicalReports = async () => {
        if (!confirm('This will add sample medical reports to your documents. Proceed?')) return
        try {
            setSeedingReports(true)
            const result = await seedMedicalReports()
            if (result?.success) {
                alert('Sample medical reports added successfully!')
                window.location.reload()
            } else {
                if (result?.error && (result.error.includes('does not exist') || result.error.includes('relation "public.medical_reports"'))) {
                    alert('Database Error: The "medical_reports" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.')
                } else {
                    alert('Failed to add sample reports: ' + (result?.error || 'Unknown error'))
                }
            }
        } catch (error) {
            console.error('Error adding sample reports:', error)
            alert('An unexpected error occurred.')
        } finally {
            setSeedingReports(false)
        }
    }

    // Helper functions for views
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        const localeMap: Record<string, string> = {
            en: 'en-US',
            zh: 'zh-CN',
            ms: 'ms-MY'
        }
        return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date)
    }


    const getScoreBadge = (score?: number) => {
        if (score === undefined || score === null) return null
        if (score >= 75) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t.patientDashboard.historyTable.good, Icon: TrendingUp }
        if (score >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', label: t.patientDashboard.historyTable.fair, Icon: Minus }
        return { bg: 'bg-red-100', text: 'text-red-700', label: t.patientDashboard.historyTable.needsAttention, Icon: TrendingDown }
    }

    // Sort sessions
    const sortedSessions = [...sessions].sort((a, b) => {
        let comparison = 0
        switch (sortField) {
            case 'date':
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                break
            case 'score':
                comparison = (a.overall_score || 0) - (b.overall_score || 0)
                break
            case 'diagnosis':
                comparison = (a.primary_diagnosis || '').localeCompare(b.primary_diagnosis || '')
                break
        }
        return sortDirection === 'asc' ? comparison : -comparison
    })

    // Section title helper
    const getSectionTitle = () => {
        switch (activeSection) {
            case 'journey': return t.patientDashboard.tabs.healthJourney
            case 'meals': return t.patientDashboard.tabs.mealPlanner
            case 'snore': return t.patientDashboard.snoreAnalysis.title
            case 'qi-dose': return t.qiDose?.title || 'Qi Dose'
            case 'vitality': return t.patientDashboard.tabs.vitalityRhythm
            case 'community': return t.patientDashboard.tabs.community
            case 'family': return t.familyManagement?.title || t.patientDashboard.tabs.family || 'Family Care'
            case 'profile': return t.patientDashboard.tabs.profile
            case 'documents': return t.patientDashboard.tabs.documents
            case 'settings': return t.patientDashboard.tabs.settings
            default: return t.patientDashboard.tabs.healthJourney
        }
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-sm transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                            <Heart className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Patient <span className="text-emerald-600">Portal</span></span>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Health</p>
                        <button
                            onClick={() => { setActiveSection('journey'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'journey' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Activity className="w-4 h-4" />
                            {t.patientDashboard.tabs.healthJourney}
                        </button>
                        <button
                            onClick={() => { setActiveSection('meals'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'meals' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            {t.patientDashboard.tabs.mealPlanner}
                        </button>
                        <button
                            onClick={() => { setActiveSection('snore'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'snore' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Moon className="w-4 h-4" />
                            {t.patientDashboard.snoreAnalysis.title}
                        </button>
                        <button
                            onClick={() => { setActiveSection('vitality'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'vitality' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            {t.patientDashboard.tabs.vitalityRhythm}
                        </button>
                        <button
                            onClick={() => { setActiveSection('qi-dose'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'qi-dose' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Wind className="w-4 h-4" />
                            {t.qiDose?.title || 'Qi Dose'}
                        </button>
                        <button
                            onClick={() => { setActiveSection('community'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'community' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Users className="w-4 h-4" />
                            {t.patientDashboard.tabs.community}
                        </button>
                        <button
                            onClick={() => { setActiveSection('family'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'family' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Heart className="w-4 h-4" />
                            {t.familyManagement?.title || t.patientDashboard.tabs.family || 'Family Care'}
                        </button>
                    </div>

                    <div className="mt-6 space-y-1">
                        <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
                        <button
                            onClick={() => { setActiveSection('profile'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <User className="w-4 h-4" />
                            {t.patientDashboard.tabs.profile}
                        </button>
                        <button
                            onClick={() => { setActiveSection('documents'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'documents' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <FileText className="w-4 h-4" />
                            {t.patientDashboard.tabs.documents}
                        </button>
                        <button
                            onClick={() => { setActiveSection('settings'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeSection === 'settings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Settings className="w-4 h-4" />
                            {t.patientDashboard.tabs.settings}
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        {t.patientDashboard.navigation.logout}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{getSectionTitle()}</h1>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 hidden sm:flex">
                                {t.patientDashboard.welcomeBack}, {profile?.full_name || user?.email || 'Patient'}
                                {profile?.full_name === 'Test Patient' && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-wider">Demo Mode</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex gap-2"
                            onClick={() => router.push('/')}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t.patientDashboard.newDiagnosis}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex gap-2"
                            onClick={() => window.open('/', '_blank')}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {t.patientDashboard.navigation.home}
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white border border-emerald-200">
                            <span className="text-xs font-bold">{(profile?.full_name?.[0] || user?.email?.[0] || 'P').toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto pb-20">
                        {/* Health Journey Section */}
                        {activeSection === 'journey' && (
                            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                {/* Trend Widget */}
                                <TrendWidget
                                    trendData={trendData}
                                    sessions={sessions}
                                    loading={loadingSessions && !trendData}
                                />

                                {/* Qi Dose Promotion Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="relative overflow-hidden group cursor-pointer"
                                    onClick={() => setActiveSection('qi-dose')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                                    <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-center md:text-left">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                                    <Wind className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.qiDose?.title || 'Qi Dose'}</span>
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 tracking-tight">Ready for your daily 8-minute movement?</h3>
                                            <p className="text-emerald-50 text-sm max-w-xl">
                                                Based on your TCM constitution, we've prepared a micro-dose of vitality to regulate your inner energy. No equipment needed.
                                            </p>
                                        </div>
                                        <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 rounded-2xl h-auto shadow-xl border-none">
                                            START FLOW <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>

                                {/* History Section */}
                                <div className="mt-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">{t.patientDashboard.healthJourney.title}</h2>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {sessions.length > 0
                                                    ? `${sessions.length} ${sessions.length === 1 ? t.patientDashboard.healthJourney.sessionRecorded : t.patientDashboard.healthJourney.sessionsRecorded}`
                                                    : t.patientDashboard.healthJourney.startJourneyToday}
                                            </p>
                                        </div>

                                        {/* View Controls */}
                                        {sessions.length > 0 && (
                                            <div className="flex items-center gap-3">
                                                {/* View Type Switcher */}
                                                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                                    {[
                                                        { id: 'table' as ViewType, icon: Grid3X3, label: 'Table' },
                                                        { id: 'list' as ViewType, icon: List, label: 'List' },
                                                        { id: 'gallery' as ViewType, icon: LayoutGrid, label: 'Gallery' },
                                                    ].map(view => (
                                                        <button
                                                            key={view.id}
                                                            onClick={() => setViewType(view.id)}
                                                            className={`p-2 rounded-md transition-all duration-200 ${viewType === view.id
                                                                ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                                }`}
                                                            title={view.label}
                                                        >
                                                            <view.icon className="w-4 h-4" />
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Sort Controls */}
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={sortField}
                                                        onValueChange={(value: SortField) => setSortField(value)}
                                                    >
                                                        <SelectTrigger className="w-[130px] bg-white border-slate-200 shadow-sm h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="date">{t.patientDashboard.historyTable.sortByDate}</SelectItem>
                                                            <SelectItem value="score">{t.patientDashboard.historyTable.sortByScore}</SelectItem>
                                                            <SelectItem value="diagnosis">{t.patientDashboard.historyTable.sortByDiagnosis}</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <button
                                                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                                        className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                                                        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                                    >
                                                        {sortDirection === 'asc' ? (
                                                            <ArrowUp className="w-4 h-4 text-slate-600" />
                                                        ) : (
                                                            <ArrowDown className="w-4 h-4 text-slate-600" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Empty State */}
                                    {sessions.length === 0 && !loadingSessions && (
                                        <Card className="p-12 text-center bg-white border-none shadow-md">
                                            <div className="max-w-md mx-auto">
                                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                                    <FileHeart className="w-10 h-10 text-emerald-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 mb-3">
                                                    {t.patientDashboard.healthJourney.noSessionsYet}
                                                </h3>
                                                <p className="text-slate-600 mb-6">
                                                    {t.patientDashboard.healthJourney.noSessionsDesc}
                                                </p>
                                                <Button
                                                    onClick={() => router.push('/')}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                                                >
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    {t.patientDashboard.healthJourney.startFirstDiagnosis}
                                                </Button>

                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 mb-2">{t.patientDashboard.healthJourney.cantFindData}</p>
                                                    <Button
                                                        onClick={handleRestoreData}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={seeding}
                                                        className="text-slate-500 hover:text-emerald-600"
                                                    >
                                                        {seeding ? (
                                                            <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> {t.patientDashboard.healthJourney.restoring}</>
                                                        ) : (
                                                            t.patientDashboard.healthJourney.restoreMockData
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )}

                                    {/* TABLE VIEW */}
                                    {sessions.length > 0 && viewType === 'table' && (
                                        <Card className="border-none shadow-md bg-white overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.diagnosis}</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.date}</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.symptoms}</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.medicines}</th>
                                                            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.score}</th>
                                                            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.status}</th>
                                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">{t.patientDashboard.historyTable.action}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {sortedSessions.map((session) => {
                                                            const badge = getScoreBadge(session.overall_score ?? undefined)
                                                            return (
                                                                <tr
                                                                    key={session.id}
                                                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                                    onClick={() => router.push(`/patient/history/${session.id}`)}
                                                                >
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-2xl">🏥</span>
                                                                            <div>
                                                                                <p className="font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                                                                                    {extractDiagnosisTitle(session.primary_diagnosis)}
                                                                                </p>
                                                                                {session.constitution && (
                                                                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                                                                        {extractConstitutionType(session.constitution)}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {formatDate(session.created_at)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        {session.symptoms && session.symptoms.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {session.symptoms.slice(0, 3).map((symptom, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-amber-50 text-amber-700 border border-amber-200"
                                                                                    >
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        {symptom}
                                                                                    </span>
                                                                                ))}
                                                                                {session.symptoms.length > 3 && (
                                                                                    <span className="text-xs text-slate-500">
                                                                                        +{session.symptoms.length - 3}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-400 italic">No symptoms recorded</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        {session.medicines && session.medicines.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {session.medicines.slice(0, 2).map((medicine, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                                    >
                                                                                        <Pill className="w-3 h-3" />
                                                                                        <span className="truncate max-w-[120px]">{medicine}</span>
                                                                                    </span>
                                                                                ))}
                                                                                {session.medicines.length > 2 && (
                                                                                    <span className="text-xs text-slate-500">
                                                                                        +{session.medicines.length - 2}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-400 italic">No medicines recorded</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        {session.overall_score !== undefined && (
                                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${badge?.bg} ${badge?.text}`}>
                                                                                {session.overall_score}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        {badge && (
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                                                <badge.Icon className="w-3 h-3" />
                                                                                {badge.label}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                router.push(`/patient/history/${session.id}`)
                                                                            }}
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-1" />
                                                                            {t.patientDashboard.historyTable.view}
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    )}

                                    {/* LIST VIEW */}
                                    {sessions.length > 0 && viewType === 'list' && (
                                        <div className="space-y-3">
                                            {sortedSessions.map((session, index) => {
                                                const badge = getScoreBadge(session.overall_score ?? undefined)
                                                return (
                                                    <motion.div
                                                        key={session.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                                    >
                                                        <Card
                                                            className="group p-4 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer border-none shadow-sm"
                                                            onClick={() => router.push(`/patient/history/${session.id}`)}
                                                        >
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <span className="text-3xl">🏥</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                                                            {extractDiagnosisTitle(session.primary_diagnosis)}
                                                                        </h3>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                                <Calendar className="w-3.5 h-3.5" />
                                                                                {formatDate(session.created_at)}
                                                                            </span>
                                                                            {session.constitution && (
                                                                                <span className="text-sm text-slate-400 truncate max-w-[150px]">
                                                                                    • {extractConstitutionType(session.constitution)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    {badge && (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
                                                                                <badge.Icon className="w-3.5 h-3.5" />
                                                                                {session.overall_score}
                                                                            </span>
                                                                            <span className={`text-[10px] mt-0.5 font-medium ${badge.text}`}>
                                                                                {badge.label}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`/patient/history/${session.id}`)
                                                                        }}
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* GALLERY VIEW */}
                                    {sessions.length > 0 && viewType === 'gallery' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sortedSessions.map((session, index) => (
                                                <HistoryCard
                                                    key={session.id}
                                                    session={session}
                                                    onClick={() => router.push(`/patient/history/${session.id}`)}
                                                    index={index}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Meal Planner Section */}
                        {activeSection === 'meals' && (
                            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-slate-800 mb-1">{t.patientDashboard.mealPlanner.title}</h2>
                                        <p className="text-sm text-slate-600">
                                            {t.patientDashboard.mealPlanner.subtitle}
                                        </p>
                                    </div>

                                    <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl w-fit border border-slate-200">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`rounded-lg px-4 transition-all duration-200 ${mealSubSection === 'plan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setMealSubSection('plan')}
                                        >
                                            <Utensils className="w-4 h-4 mr-2" />
                                            7-Day Plan
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`rounded-lg px-4 transition-all duration-200 ${mealSubSection === 'checker' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setMealSubSection('checker')}
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Food Checker
                                        </Button>
                                    </div>
                                </div>

                                {mealSubSection === 'plan' ? (
                                    <MealPlanWizard latestDiagnosis={sessions.length > 0 ? sessions[0].full_report || sessions[0] : null} />
                                ) : (
                                    <TCMFoodChecker
                                        latestDiagnosis={sessions.length > 0 ? sessions[0].full_report || sessions[0] : null}
                                        onBack={() => setMealSubSection('plan')}
                                    />
                                )}
                            </div>
                        )}

                        {/* Snore Analysis Section */}
                        {activeSection === 'snore' && <SnoreAnalysisTab sessions={sessions} />}

                        {/* Qi Dose Section */}
                        {activeSection === 'qi-dose' && (
                            <QiDose />
                        )}

                        {/* Vitality Rhythm Section */}
                        {activeSection === 'vitality' && <VitalityRhythmTab sessions={sessions} />}

                        {/* Circle of Health / Community Section */}
                        {activeSection === 'community' && (
                            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <p className="text-slate-600 mb-6">{t.circleOfHealth.subtitle}</p>
                                <CircleOfHealth />
                            </div>
                        )}

                        {/* Family Health Management Section */}
                        {activeSection === 'family' && <FamilyManagement />}

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-none shadow-md bg-white max-w-2xl">
                                    <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl pb-6">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="w-5 h-5 text-white/90" />
                                            {t.patientDashboard.profile.personalInfo}
                                        </CardTitle>
                                        <CardDescription className="text-emerald-100">
                                            {t.patientDashboard.profile.yourProfileDetails}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">{profileData.full_name || 'Patient'}</h3>
                                                    <p className="text-sm text-slate-600">{user?.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={editingProfile ? 'ghost' : 'outline'}
                                                onClick={() => setEditingProfile(!editingProfile)}
                                            >
                                                {editingProfile ? t.common.cancel : <><Edit className="w-4 h-4 mr-2" />{t.common.edit}</>}
                                            </Button>
                                        </div>

                                        {editingProfile ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>{t.patientDashboard.profile.fullName}</Label>
                                                    <Input
                                                        value={profileData.full_name}
                                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>{t.patientDashboard.profile.age}</Label>
                                                        <Input
                                                            type="number"
                                                            value={profileData.age}
                                                            onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Gender</Label>
                                                        <Select
                                                            value={profileData.gender}
                                                            onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Height (cm)</Label>
                                                        <Input
                                                            type="number"
                                                            value={profileData.height}
                                                            onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Weight (kg)</Label>
                                                        <Input
                                                            type="number"
                                                            value={profileData.weight}
                                                            onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>{t.patientDashboard.profile.medicalHistory}</Label>
                                                    <Textarea
                                                        value={profileData.medical_history}
                                                        onChange={(e) => setProfileData({ ...profileData, medical_history: e.target.value })}
                                                        rows={4}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleSaveProfile}
                                                    disabled={savingProfile}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    {savingProfile ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.patientDashboard.profile.saving}</>
                                                    ) : (
                                                        t.patientDashboard.profile.saveChanges
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b">
                                                    <span className="text-sm text-slate-600">{t.patientDashboard.profile.name}:</span>
                                                    <span className="text-sm font-medium">{profileData.full_name || t.patientDashboard.profile.notSet}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b">
                                                    <span className="text-sm text-slate-600">{t.patientDashboard.profile.age}:</span>
                                                    <span className="text-sm font-medium">{profileData.age || t.patientDashboard.profile.notSet}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b">
                                                    <span className="text-sm text-slate-600">{t.patientDashboard.profile.gender}:</span>
                                                    <span className="text-sm font-medium capitalize">{profileData.gender || t.patientDashboard.profile.notSet}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b">
                                                    <span className="text-sm text-slate-600">{t.patientDashboard.profile.height}:</span>
                                                    <span className="text-sm font-medium">{profileData.height ? `${profileData.height} cm` : t.patientDashboard.profile.notSet}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b">
                                                    <span className="text-sm text-slate-600">{t.patientDashboard.profile.weight}:</span>
                                                    <span className="text-sm font-medium">{profileData.weight ? `${profileData.weight} kg` : t.patientDashboard.profile.notSet}</span>
                                                </div>
                                                {profileData.medical_history && (
                                                    <div className="pt-2">
                                                        <span className="text-sm text-slate-600 block mb-2">{t.patientDashboard.profile.medicalHistory}:</span>
                                                        <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                                                            {profileData.medical_history}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Documents Section */}
                        {activeSection === 'documents' && (
                            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-none shadow-md bg-white max-w-2xl">
                                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-white/90" />
                                                    {t.patientDashboard.documents.yourDocuments}
                                                </CardTitle>
                                                <CardDescription className="text-blue-100">
                                                    {loadingReports ? (
                                                        <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                                                    ) : (
                                                        reports.length
                                                    )} {t.patientDashboard.documents.filesUploaded}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-white text-blue-600 hover:bg-blue-50"
                                                disabled={uploadingReport}
                                            >
                                                {uploadingReport ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4 mr-2" />
                                                )}
                                                {t.patientDashboard.documents.upload}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {/* Documents List */}
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {loadingReports ? (
                                                <div className="text-center py-12">
                                                    <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
                                                    <p className="text-sm text-slate-500">Loading your reports...</p>
                                                </div>
                                            ) : reports.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                    <p className="text-sm text-slate-500 mb-4">{t.patientDashboard.documents.noDocumentsYet}</p>
                                                    <div className="pt-4 border-t border-slate-100">
                                                        <p className="text-xs text-slate-400 mb-2">Want to see sample documents?</p>
                                                        <Button
                                                            onClick={handleRestoreMedicalReports}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={seedingReports}
                                                            className="text-slate-500 hover:text-blue-600"
                                                        >
                                                            {seedingReports ? (
                                                                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Adding samples...</>
                                                            ) : (
                                                                'Add Sample Reports'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                reports.map((report) => (
                                                    <div
                                                        key={report.id}
                                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-800 truncate">
                                                                    {report.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {report.date} • {report.size}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => setSelectedReport(report)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteReport(report.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <DocumentViewerModal
                                    isOpen={!!selectedReport}
                                    onClose={() => setSelectedReport(null)}
                                    report={selectedReport}
                                />
                            </div>
                        )}

                        {/* Settings Section */}
                        {activeSection === 'settings' && (
                            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <PatientSettings />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
