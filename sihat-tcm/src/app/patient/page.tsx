'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { UnifiedDashboard } from '@/components/patient/UnifiedDashboard'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function PatientDashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/patient')
        }
    }, [user, authLoading, router])

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-emerald-600" />
                    <p className="text-slate-600">Loading your dashboard...</p>
                </Card>
            </div>
        )
    }

    // Not authenticated
    if (!user) {
        return null // Will redirect
    }

    // Render the unified dashboard
    return <UnifiedDashboard />
}
