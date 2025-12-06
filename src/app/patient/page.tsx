"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { User, Calendar, Scale, Ruler, FileText, Check, Sparkles, ClipboardList, History, LogOut, Eye, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Type for inquiries from Supabase
interface Inquiry {
    id: string
    symptoms: string | null
    diagnosis_report: {
        mainComplaint?: string
        tcmDiagnosis?: string
        syndromePattern?: string
        [key: string]: unknown
    } | null
    created_at: string
}

export default function PatientDashboard() {
    const { user, profile, loading: authLoading, signOut } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [loadingInquiries, setLoadingInquiries] = useState(true)
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        medical_history: ''
    })

    // REMOVED: Auto-redirect to home.
    // Instead, we will show an access denied message if the role doesn't match.

    // Fetch profile data
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

    // Fetch diagnosis history from Supabase
    useEffect(() => {
        async function fetchInquiries() {
            if (!user?.id) {
                setLoadingInquiries(false)
                return
            }

            try {
                const { data, error } = await supabase
                    .from('inquiries')
                    .select('id, symptoms, diagnosis_report, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching inquiries:', error)
                } else {
                    setInquiries(data || [])
                }
            } catch (error) {
                console.error('Error fetching inquiries:', error)
            } finally {
                setLoadingInquiries(false)
            }
        }

        fetchInquiries()
    }, [user?.id])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSaved(false)

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
            setSaved(true)
            // Auto-hide the saved message after 3 seconds
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    const handleStartDiagnosis = () => {
        // Store profile data in localStorage to pre-fill the BasicInfoForm
        const profileData = {
            name: formData.full_name,
            age: formData.age,
            gender: formData.gender.toLowerCase(),
            weight: formData.weight,
            height: formData.height,
            symptoms: '',
            symptomDuration: ''
        }
        localStorage.setItem('patientProfileData', JSON.stringify(profileData))
        router.push('/')
    }

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    if (authLoading) return <div className="p-8">Loading...</div>

    if (!profile || profile.role !== 'patient') {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="mb-4">You are logged in as: <strong>{profile?.role || 'Unknown'}</strong></p>
                <p className="mb-4">This page is for Patients only.</p>
                <Button onClick={() => router.push('/')}>Go Home</Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Patient Dashboard</h1>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* My Profile Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">My Profile</h2>
                        </div>
                        <p className="text-emerald-50 opacity-90">Update your personal information. This will be used to pre-fill your diagnosis forms.</p>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-stone-600 font-medium">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Enter your name"
                                    className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age" className="text-stone-600 font-medium">Age</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                                    <Input
                                        id="age"
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        max="120"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        placeholder="Age"
                                        className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-stone-600 font-medium">Gender</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 h-4 w-4 text-emerald-600/70 z-10 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    </div>
                                    <Select
                                        value={formData.gender.toLowerCase()}
                                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                                    >
                                        <SelectTrigger id="gender" className="pl-10 h-12 border-stone-200 focus:ring-emerald-500/50 focus:border-emerald-500 bg-stone-50/50">
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="height" className="text-stone-600 font-medium">Height (cm)</Label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                                    <Input
                                        id="height"
                                        type="number"
                                        inputMode="decimal"
                                        min="1"
                                        max="300"
                                        step="0.1"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        placeholder="cm"
                                        className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-stone-600 font-medium">Weight (kg)</Label>
                                <div className="relative">
                                    <Scale className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600/70" />
                                    <Input
                                        id="weight"
                                        type="number"
                                        inputMode="decimal"
                                        min="1"
                                        max="500"
                                        step="0.1"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        placeholder="kg"
                                        className="pl-10 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medical_history" className="text-stone-600 font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                Medical History
                            </Label>
                            <Textarea
                                id="medical_history"
                                value={formData.medical_history}
                                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                placeholder="Any existing conditions, allergies, etc."
                                className="min-h-[100px] border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/50 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 h-12 px-6 font-medium rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </Button>
                            <AnimatePresence>
                                {saved && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex items-center gap-2 text-emerald-600 font-medium"
                                    >
                                        <div className="p-1 bg-emerald-100 rounded-full">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        Saved
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </Card>

                {/* My Inquiries Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">My Inquiries</h2>
                        </div>
                        <p className="text-amber-50 opacity-90">View your past diagnosis history.</p>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Loading State */}
                        {loadingInquiries && (
                            <div className="flex items-center justify-center gap-3 text-stone-500 py-8">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <p>Loading history...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loadingInquiries && inquiries.length === 0 && (
                            <div className="flex flex-col items-center gap-3 text-stone-500 py-8">
                                <History className="w-10 h-10 text-stone-300" />
                                <p className="text-center">No diagnosis history yet.<br />Start your first consultation!</p>
                            </div>
                        )}

                        {/* Inquiries List */}
                        {!loadingInquiries && inquiries.length > 0 && (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {inquiries.map((inquiry, index) => {
                                    const date = new Date(inquiry.created_at)
                                    const formattedDate = date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    const formattedTime = date.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })

                                    // Extract diagnosis info
                                    const report = inquiry.diagnosis_report
                                    const mainComplaint = report?.mainComplaint || inquiry.symptoms || 'General Consultation'
                                    const diagnosis = report?.tcmDiagnosis || report?.syndromePattern || 'Pending review'

                                    return (
                                        <motion.div
                                            key={inquiry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-stone-50 rounded-xl p-4 border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formattedDate} at {formattedTime}</span>
                                                    </div>
                                                    <h4 className="font-medium text-stone-800 truncate">
                                                        {mainComplaint.length > 50 ? mainComplaint.substring(0, 50) + '...' : mainComplaint}
                                                    </h4>
                                                    <p className="text-sm text-stone-600 mt-1 truncate">
                                                        {diagnosis}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Store the report in localStorage and navigate to view it
                                                        if (inquiry.diagnosis_report) {
                                                            localStorage.setItem('viewDiagnosisReport', JSON.stringify(inquiry.diagnosis_report))
                                                            router.push('/test-report')
                                                        }
                                                    }}
                                                    className="shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Start New Diagnosis Button */}
                        <Button
                            variant="outline"
                            onClick={handleStartDiagnosis}
                            className="w-full h-12 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-medium rounded-xl transition-all duration-300"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Start New Diagnosis
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
