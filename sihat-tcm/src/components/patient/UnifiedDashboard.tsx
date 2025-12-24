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
    Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPatientHistory, getHealthTrends, DiagnosisSession, seedPatientHistory } from '@/lib/actions'
import { supabase } from '@/lib/supabase/client'
import { TrendWidget } from './TrendWidget'
import { HistoryCard } from './HistoryCard'
import { MealPlanWizard } from '../meal-planner/MealPlanWizard'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLanguageSync } from '@/hooks/useLanguageSync'

interface Report {
    name: string
    date: string
    size: string
    type: string
}

export function UnifiedDashboard() {
    const { user, profile, signOut, refreshProfile } = useAuth()
    const router = useRouter()
    const { language, setLanguage, languageNames } = useLanguage()

    // Sync language from profile on login
    useLanguageSync()

    // Health Journey State
    const [sessions, setSessions] = useState<DiagnosisSession[]>([])
    const [trendData, setTrendData] = useState<any>(null)
    const [loadingSessions, setLoadingSessions] = useState(true)

    // View & Sort State
    type ViewType = 'table' | 'list' | 'gallery'
    type SortField = 'date' | 'score' | 'diagnosis'
    type SortDirection = 'asc' | 'desc'

    const [viewType, setViewType] = useState<ViewType>('table')
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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
    const [reports, setReports] = useState<Report[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [seeding, setSeeding] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Active Section (for mobile)
    const [activeSection, setActiveSection] = useState<'journey' | 'profile' | 'documents' | 'meals' | 'settings'>('journey')

    // Settings State
    const [savingLanguage, setSavingLanguage] = useState(false)

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

    // Load documents from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('patientReports')
        if (saved) {
            setReports(JSON.parse(saved))
        }
        setIsLoaded(true)
    }, [])

    // Save documents to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('patientReports', JSON.stringify(reports))
        }
    }, [reports, isLoaded])

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
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const newReport: Report = {
            name: file.name,
            date: new Date().toISOString().split('T')[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type
        }

        setReports([newReport, ...reports])
        e.target.value = ''
    }

    // Handle document delete
    const handleDeleteReport = (index: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            setReports(reports.filter((_, i) => i !== index))
        }
    }

    // Handle logout
    const handleLogout = async () => {
        await signOut()
        router.push('/')
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo / Brand */}
                        <div
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => router.push('/')}
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <FileHeart className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Sihat TCM
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center gap-6">
                            <button
                                onClick={() => router.push('/')}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => router.push('/patient')}
                                className="text-emerald-600 font-medium border-b-2 border-emerald-600 pb-1"
                            >
                                Dashboard
                            </button>
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-slate-800">
                                    {profile?.full_name || user?.email || 'Patient'}
                                </p>
                                <p className="text-xs text-slate-500">Patient Account</p>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <FileHeart className="w-8 h-8" />
                                Patient Dashboard
                            </h1>
                            <p className="text-emerald-100 text-sm mt-1">
                                Welcome back, {profile?.full_name || user?.email || 'Patient'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push('/')}
                                className="bg-white text-emerald-600 hover:bg-emerald-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Diagnosis
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Visible on all screen sizes */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto">
                        {[
                            { id: 'journey', label: 'Health Journey', icon: FileHeart },
                            { id: 'meals', label: 'AI Meal Planner', icon: UtensilsCrossed },
                            { id: 'profile', label: 'Profile', icon: User },
                            { id: 'documents', label: 'Documents', icon: FileText },
                            { id: 'settings', label: 'Settings', icon: Settings }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`flex-1 min-w-[120px] py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === tab.id
                                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 mx-auto mb-1" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Health Journey Section */}
                <div className={`${activeSection !== 'journey' ? 'hidden' : ''} mb-8`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Trend Widget */}
                        <TrendWidget trendData={trendData} loading={loadingSessions && !trendData} />
                    </motion.div>

                    {/* History Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-8"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Your Health Journey</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    {sessions.length > 0
                                        ? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} recorded`
                                        : 'Start your wellness journey today'}
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
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="score">Score</SelectItem>
                                                <SelectItem value="diagnosis">Diagnosis</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <button
                                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
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
                            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
                                <div className="max-w-md mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                        <FileHeart className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">
                                        Your wellness journey starts here
                                    </h3>
                                    <p className="text-slate-600 mb-6">
                                        Complete your first TCM diagnosis to track your health and wellness over time.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/')}
                                        size="lg"
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Start First Diagnosis
                                    </Button>

                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 mb-2">Can't find your previous test data?</p>
                                        <Button
                                            onClick={handleRestoreData}
                                            variant="outline"
                                            size="sm"
                                            disabled={seeding}
                                            className="text-slate-500 hover:text-emerald-600"
                                        >
                                            {seeding ? (
                                                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Restoring...</>
                                            ) : (
                                                'Restore Mock Data'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Sorted Sessions */}
                        {sessions.length > 0 && (() => {
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

                            // Helper functions for table/list views
                            const formatDate = (dateString: string): string => {
                                const date = new Date(dateString)
                                return new Intl.DateTimeFormat('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                }).format(date)
                            }

                            const extractDiagnosisTitle = (value: string | undefined | null): string => {
                                if (!value) return 'TCM Health Assessment'
                                if (value.startsWith('{') && value.endsWith('}')) {
                                    try {
                                        const parsed = JSON.parse(value)
                                        return parsed.primary_pattern || parsed.pattern || parsed.diagnosis || 'TCM Health Assessment'
                                    } catch {
                                        const match = value.match(/"primary_pattern"\s*:\s*"([^"]+)"/)
                                        if (match) return match[1]
                                    }
                                }
                                return value.length > 60 ? value.substring(0, 57) + '...' : value
                            }

                            const getScoreBadge = (score?: number) => {
                                if (score === undefined || score === null) return null
                                if (score >= 75) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Good', Icon: TrendingUp }
                                if (score >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Fair', Icon: Minus }
                                return { bg: 'bg-red-100', text: 'text-red-700', label: 'Needs Attention', Icon: TrendingDown }
                            }

                            return (
                                <>
                                    {/* TABLE VIEW */}
                                    {viewType === 'table' && (
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Diagnosis</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                                                            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Score</th>
                                                            <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {sortedSessions.map((session) => {
                                                            const badge = getScoreBadge(session.overall_score)
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
                                                                                        {session.constitution}
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
                                                                            View
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* LIST VIEW */}
                                    {viewType === 'list' && (
                                        <div className="space-y-3">
                                            {sortedSessions.map((session, index) => {
                                                const badge = getScoreBadge(session.overall_score)
                                                return (
                                                    <motion.div
                                                        key={session.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                                    >
                                                        <Card
                                                            className="group p-4 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200/60"
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
                                                                                    • {session.constitution}
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
                                    {viewType === 'gallery' && (
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
                                </>
                            )
                        })()}
                    </motion.div>
                </div>

                {/* Meal Planner Section */}
                <div className={`${activeSection !== 'meals' ? 'hidden' : ''} mb-8`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Meal Planner</h2>
                            <p className="text-sm text-slate-600">
                                Personalized 7-day meal plans based on your TCM constitution
                            </p>
                        </div>

                        <MealPlanWizard latestDiagnosis={sessions.length > 0 ? sessions[0].full_report || sessions[0] : null} />
                    </motion.div>
                </div>

                {/* Profile Section */}
                <div className={`${activeSection !== 'profile' ? 'hidden' : ''} mb-8`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">My Profile</h2>
                            <p className="text-sm text-slate-600">
                                Manage your personal information
                            </p>
                        </div>
                        <Card className="p-6 bg-white/80 backdrop-blur-sm max-w-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <User className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                                        <p className="text-sm text-slate-600">Your profile details</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={editingProfile ? 'ghost' : 'outline'}
                                    onClick={() => setEditingProfile(!editingProfile)}
                                >
                                    {editingProfile ? 'Cancel' : <><Edit className="w-4 h-4 mr-2" />Edit</>}
                                </Button>
                            </div>

                            {editingProfile ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Full Name</Label>
                                        <Input
                                            value={profileData.full_name}
                                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Age</Label>
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
                                        <Label>Medical History</Label>
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
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm text-slate-600">Name:</span>
                                        <span className="text-sm font-medium">{profileData.full_name || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm text-slate-600">Age:</span>
                                        <span className="text-sm font-medium">{profileData.age || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm text-slate-600">Gender:</span>
                                        <span className="text-sm font-medium capitalize">{profileData.gender || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm text-slate-600">Height:</span>
                                        <span className="text-sm font-medium">{profileData.height ? `${profileData.height} cm` : 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm text-slate-600">Weight:</span>
                                        <span className="text-sm font-medium">{profileData.weight ? `${profileData.weight} kg` : 'Not set'}</span>
                                    </div>
                                    {profileData.medical_history && (
                                        <div className="pt-2">
                                            <span className="text-sm text-slate-600 block mb-2">Medical History:</span>
                                            <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                                                {profileData.medical_history}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </div>

                {/* Documents Section */}
                <div className={`${activeSection !== 'documents' ? 'hidden' : ''} mb-8`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Medical Documents</h2>
                            <p className="text-sm text-slate-600">
                                Upload and manage your medical reports and documents
                            </p>
                        </div>
                        <Card className="p-6 bg-white/80 backdrop-blur-sm max-w-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Your Documents</h3>
                                        <p className="text-sm text-slate-600">{reports.length} files uploaded</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Documents List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {reports.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500">No documents uploaded yet</p>
                                    </div>
                                ) : (
                                    reports.map((report, index) => (
                                        <div
                                            key={index}
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
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteReport(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Settings Section */}
                <div className={`${activeSection !== 'settings' ? 'hidden' : ''} mb-8`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Settings</h2>
                            <p className="text-sm text-slate-600">
                                Manage your preferences and account settings
                            </p>
                        </div>

                        {/* Language Settings */}
                        <Card className="p-6 bg-white/80 backdrop-blur-sm max-w-2xl mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Language Preference</h3>
                                    <p className="text-sm text-slate-600">Choose your preferred language for the app</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { code: 'en' as const, flag: '🇬🇧', name: 'English' },
                                    { code: 'zh' as const, flag: '🇨🇳', name: '中文 (Chinese)' },
                                    { code: 'ms' as const, flag: '🇲🇾', name: 'Bahasa Malaysia' }
                                ].map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={async () => {
                                            if (language === lang.code) return
                                            setSavingLanguage(true)
                                            setLanguage(lang.code)

                                            // Save to database if logged in
                                            if (user) {
                                                try {
                                                    const { error } = await supabase
                                                        .from('profiles')
                                                        .update({ preferred_language: lang.code })
                                                        .eq('id', user.id)

                                                    if (error) {
                                                        console.error('Failed to save language preference:', error)
                                                    } else {
                                                        // Refresh profile to sync state
                                                        refreshProfile()
                                                    }
                                                } catch (err) {
                                                    console.error('Error saving language:', err)
                                                }
                                            }
                                            setSavingLanguage(false)
                                        }}
                                        disabled={savingLanguage}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${language === lang.code
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{lang.flag}</span>
                                            <div className="text-left">
                                                <p className={`font-medium ${language === lang.code ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                    {lang.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {languageNames[lang.code].english}
                                                </p>
                                            </div>
                                        </div>
                                        {language === lang.code && (
                                            <div className="flex items-center gap-2">
                                                {savingLanguage ? (
                                                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                                                ) : (
                                                    <Check className="w-5 h-5 text-emerald-600" />
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                                <span className="text-emerald-500">✓</span>
                                Your language preference is automatically saved
                            </p>
                        </Card>

                        {/* Account Information */}
                        <Card className="p-6 bg-white/80 backdrop-blur-sm max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Account Information</h3>
                                    <p className="text-sm text-slate-600">Your account details</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Email:</span>
                                    <span className="text-sm font-medium text-slate-800">{user?.email || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Account Type:</span>
                                    <span className="text-sm font-medium text-slate-800 capitalize">{profile?.role || 'Patient'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-slate-600">Member Since:</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

