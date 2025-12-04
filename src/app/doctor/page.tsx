"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Inquiry {
    id: string
    created_at: string
    symptoms: string
    diagnosis_report: any
    profiles: {
        full_name: string
        age: number
        gender: string
    }[] | {
        full_name: string
        age: number
        gender: string
    }
}

export default function DoctorDashboard() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [loading, setLoading] = useState(true)
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && profile?.role !== 'doctor') {
            router.push('/')
        }
    }, [profile, authLoading, router])

    useEffect(() => {
        fetchInquiries()
    }, [])

    const fetchInquiries = async () => {
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select(`
          id,
          created_at,
          symptoms,
          diagnosis_report,
          profiles (
            full_name,
            age,
            gender
          )
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setInquiries(data || [])
        } catch (error) {
            console.error('Error fetching inquiries:', error)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || loading) return <div className="p-8">Loading...</div>

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>

            <div className="grid gap-6">
                {inquiries.map((inquiry) => {
                    const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles
                    return (
                        <Card key={inquiry.id}>
                            <CardHeader>
                                <CardTitle>{profile?.full_name || 'Anonymous Patient'}</CardTitle>
                                <CardDescription>
                                    {profile?.gender}, {profile?.age} years old • {format(new Date(inquiry.created_at), 'PPP p')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Symptoms</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{inquiry.symptoms}</p>
                                    </div>
                                    {inquiry.diagnosis_report && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Diagnosis Summary</h3>
                                            <div className="text-sm text-gray-600">
                                                {/* Display a summary or link to full report */}
                                                <p>Report generated. (Expand to view details implementation pending)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {inquiries.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                        No patient inquiries found.
                    </div>
                )}
            </div>
        </div>
    )
}
