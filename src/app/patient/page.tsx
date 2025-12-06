"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { User, Calendar, Scale, Ruler, FileText, Check, Sparkles, ClipboardList, History, LogOut, Eye, Loader2, Download, Upload } from 'lucide-react'
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

interface Report {
    name: string
    date: string
    size: string
    type: string
}

export default function PatientDashboard() {
    const { user, profile, loading: authLoading, signOut } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
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
    const [reports, setReports] = useState<Report[]>([
        { name: "Blood Test Result.pdf", date: "2023-11-15", size: "1.2 MB", type: "application/pdf" },
        { name: "X-Ray Report - Chest.pdf", date: "2023-10-20", size: "2.5 MB", type: "application/pdf" },
        { name: "Annual Health Checkup.pdf", date: "2023-08-12", size: "3.1 MB", type: "application/pdf" },
        { name: "MRI Scan Report.pdf", date: "2023-06-05", size: "5.8 MB", type: "application/pdf" },
        { name: "Prescription History.pdf", date: "2023-05-20", size: "0.5 MB", type: "application/pdf" }
    ])
    const [isLoaded, setIsLoaded] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load reports from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('patientReports')
        if (saved) {
            setReports(JSON.parse(saved))
        }
        setIsLoaded(true)
    }, [])

    // Save reports to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('patientReports', JSON.stringify(reports))
        }
    }, [reports, isLoaded])

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create a new report object
        const newReport: Report = {
            name: file.name,
            date: new Date().toISOString().split('T')[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type
        }

        setReports([newReport, ...reports])

        // Reset input
        e.target.value = ''
    }

    // REMOVED: Auto-redirect to home.
    // Instead, we will show an access denied message if the role doesn't match.

    // Fetch profile data
    useEffect(() => {
        const getRandomProfile = () => {
            const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
            const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
            const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

            return {
                full_name: randomName,
                age: Math.floor(Math.random() * (60 - 20) + 20).toString(),
                gender: Math.random() > 0.5 ? 'male' : 'female',
                height: (Math.floor(Math.random() * (190 - 150) + 150)).toString(),
                weight: (Math.floor(Math.random() * (100 - 50) + 50)).toString(),
                medical_history: "No significant medical history. Occasional seasonal allergies."
            };
        };

        const random = getRandomProfile();

        if (profile) {
            setFormData({
                full_name: profile.full_name || random.full_name,
                age: profile.age?.toString() || random.age,
                gender: profile.gender || random.gender,
                height: profile.height?.toString() || random.height,
                weight: profile.weight?.toString() || random.weight,
                medical_history: profile.medical_history || random.medical_history
            })
        } else {
            setFormData(random);
        }
    }, [profile])

    // Fetch diagnosis history from Supabase
    useEffect(() => {
        async function fetchInquiries() {
            // Generate 10 mock inquiries
            const generateMockInquiries = (): Inquiry[] => {
                const mockInquiries: Inquiry[] = [];
                const symptomsList = [
                    "Headache, dizziness, and fatigue",
                    "Stomach pain and bloating after eating",
                    "Insomnia and anxiety at night",
                    "Chronic cough with phlegm",
                    "Lower back pain and knee weakness",
                    "Dry eyes and blurred vision",
                    "Palpitations and shortness of breath",
                    "Skin rash and itching",
                    "Constipation and dry stool",
                    "Cold hands and feet"
                ];
                const diagnosesList = [
                    "Liver Fire Uprising",
                    "Spleen Qi Deficiency",
                    "Heart Yin Deficiency",
                    "Lung Qi Deficiency",
                    "Kidney Yang Deficiency",
                    "Liver Blood Deficiency",
                    "Heart Qi Deficiency",
                    "Wind-Heat attacking the Lungs",
                    "Large Intestine Dryness",
                    "Spleen Yang Deficiency"
                ];

                for (let i = 0; i < 10; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - (i * 3 + 1)); // Spread out over days

                    mockInquiries.push({
                        id: `mock-${i}`,
                        symptoms: symptomsList[i],
                        diagnosis_report: {
                            mainComplaint: symptomsList[i],
                            tcmDiagnosis: diagnosesList[i],
                            syndromePattern: diagnosesList[i]
                        },
                        created_at: date.toISOString()
                    });
                }
                return mockInquiries;
            };

            const mockData = generateMockInquiries();

            if (!user?.id) {
                setInquiries(mockData);
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
                    setInquiries(mockData)
                } else {
                    const combined = [...(data || []), ...mockData]
                    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    setInquiries(combined)
                }
            } catch (error) {
                console.error('Error fetching inquiries:', error)
                setInquiries(mockData)
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

    const handleStartDiagnosis = async () => {
        setLoading(true)
        try {
            // Auto-save profile to Supabase first
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

            if (error) {
                console.error('Error auto-saving profile:', error)
                // Continue anyway, as we rely on localStorage for the immediate diagnosis
            }

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
        } catch (error) {
            console.error('Error in start diagnosis:', error)
            // Fallback: just redirect
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            router.push('/')
        } catch (error) {
            console.error('Error logging out:', error)
            setLoggingOut(false)
        }
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Patient Dashboard</h1>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full md:w-auto justify-center"
                >
                    {loggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    {loggingOut ? 'Logging out...' : 'Logout'}
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* My Profile Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5 md:col-span-1 lg:col-span-1">
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
                <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5 md:col-span-1 lg:col-span-1">
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

                {/* Medical Reports Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-stone-900/5 md:col-span-2 lg:col-span-1">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">Medical Reports</h2>
                        </div>
                        <p className="text-blue-50 opacity-90">Manage your uploaded medical documents.</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {reports.map((file, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-stone-800 truncate">{file.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                                <span>{file.date}</span>
                                                <span>•</span>
                                                <span>{file.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-stone-400 hover:text-blue-600 hover:bg-blue-100/50 shrink-0">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleUploadClick}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl shadow-lg shadow-blue-200/50 transition-all"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload New Report
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.md,.csv,.doc,.docx,application/pdf,text/markdown,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
