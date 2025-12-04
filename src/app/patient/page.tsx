"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function PatientDashboard() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        medical_history: ''
    })

    useEffect(() => {
        if (!authLoading && profile?.role !== 'patient') {
            router.push('/')
        }
    }, [profile, authLoading, router])

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                age: profile.age?.toString() || '',
                gender: profile.gender || '',
                height: profile.height?.toString() || '',
                weight: profile.weight?.toString() || '',
                medical_history: profile.medical_history || ''
            })
        }
    }, [profile])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    age: parseInt(formData.age) || null,
                    gender: formData.gender,
                    height: parseFloat(formData.height) || null,
                    weight: parseFloat(formData.weight) || null,
                    medical_history: formData.medical_history
                })
                .eq('id', user?.id)

            if (error) throw error
            alert('Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return <div className="p-8">Loading...</div>

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Patient Dashboard</h1>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Profile</CardTitle>
                        <CardDescription>
                            Update your personal information. This will be used to pre-fill your diagnosis forms.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Input
                                        id="gender"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (cm)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="medical_history">Medical History</Label>
                                <Textarea
                                    id="medical_history"
                                    value={formData.medical_history}
                                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                    placeholder="Any existing conditions, allergies, etc."
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Inquiries</CardTitle>
                        <CardDescription>
                            View your past diagnosis history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">History feature coming soon.</p>
                        <Button className="mt-4" variant="outline" onClick={() => router.push('/')}>
                            Start New Diagnosis
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
