'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPatientHistory, getHealthTrends, DiagnosisSession } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HistoryCard } from '@/components/patient/HistoryCard'
import { TrendWidget } from '@/components/patient/TrendWidget'
import { 
    ArrowLeft, 
    Sparkles, 
    Loader2, 
    Plus,
    FileHeart,
    AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function HealthPassportPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    
    // Redirect to unified dashboard
    useEffect(() => {
        if (!authLoading) {
            router.replace('/patient')
        }
    }, [authLoading, router])
    
    const [sessions, setSessions] = useState<DiagnosisSession[]>([])
    const [trendData, setTrendData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/patient/dashboard')
        }
    }, [user, authLoading, router])

    // Load patient history and trends
    useEffect(() => {
        async function loadData() {
            if (!user) return

            try {
                setLoading(true)
                setError(null)

                // Fetch history and trends in parallel
                const [historyResult, trendsResult] = await Promise.all([
                    getPatientHistory(50, 0),
                    getHealthTrends(30)
                ])

                if (historyResult.success && historyResult.data) {
                    setSessions(historyResult.data)
                } else {
                    setError(historyResult.error || 'Failed to load history')
                }

                if (trendsResult.success && trendsResult.data) {
                    setTrendData(trendsResult.data)
                }
            } catch (err: any) {
                console.error('[Dashboard] Error loading data:', err)
                setError(err.message || 'An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            loadData()
        }
    }, [user])

    // Handle session click
    const handleSessionClick = (sessionId: string) => {
        router.push(`/patient/history/${sessionId}`)
    }

    // Handle new diagnosis
    const handleNewDiagnosis = () => {
        router.push('/')
    }

    // Loading state
    if (authLoading || (loading && !sessions.length)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-emerald-600" />
                    <p className="text-slate-600">Loading your health passport...</p>
                </Card>
            </div>
        )
    }

    // Not authenticated
    if (!user) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="text-white hover:bg-white/20"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                            <div className="h-8 w-px bg-white/30" />
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                    <FileHeart className="w-8 h-8" />
                                    My Health Passport
                                </h1>
                                <p className="text-emerald-100 text-sm mt-1">
                                    Welcome back, {profile?.full_name || user.email}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleNewDiagnosis}
                            className="bg-white text-emerald-600 hover:bg-emerald-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Diagnosis
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <Card className="p-4 bg-red-50 border-red-200">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-900">Error loading data</p>
                                    <p className="text-xs text-red-700 mt-0.5">{error}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Trend Widget */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <TrendWidget trendData={trendData} loading={loading && !trendData} sessions={sessions} />
                </motion.div>

                {/* History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                                Your Diagnosis History
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {sessions.length > 0 
                                    ? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} recorded`
                                    : 'No sessions yet'}
                            </p>
                        </div>
                    </div>

                    {/* Empty State */}
                    {sessions.length === 0 && !loading && (
                        <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-slate-200">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <FileHeart className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">
                                    Your journey to wellness begins here
                                </h3>
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    Complete your first TCM diagnosis to start tracking your health patterns, 
                                    view personalized recommendations, and monitor your progress over time.
                                </p>
                                <Button
                                    onClick={handleNewDiagnosis}
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Start Your First Diagnosis
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* History Grid */}
                    {sessions.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sessions.map((session, index) => (
                                <HistoryCard
                                    key={session.id}
                                    session={session}
                                    onClick={() => handleSessionClick(session.id)}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

