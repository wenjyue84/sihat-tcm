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

// Hook to detect mobile viewport
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
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
    const isMobile = useIsMobile()
    const [currentStep, setCurrentStep] = useState(1) // For mobile wizard

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

    // Mobile Single-Page Layout (matching mobile app's step-based wizard design)
    if (isMobile) {
        // Calculate BMI for display
        const bmi = formData.height && formData.weight
            ? (parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)
            : null

        const totalSteps = 2

        // Step 1: Personal Info (Name, Gender, Age, Height, Weight)
        // Step 2: Medical History

        const handleNext = () => {
            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1)
            } else {
                // On final step, save and navigate
                handleSave(new Event('submit') as unknown as React.FormEvent)
            }
        }

        const handleBack = () => {
            if (currentStep > 1) {
                setCurrentStep(currentStep - 1)
            }
        }

        const progressPercent = Math.round((currentStep / totalSteps) * 100)

        return (
            <div className="min-h-screen bg-stone-50 flex flex-col">
                {/* Green Header Card */}
                <div className="mx-4 mt-4">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg">Patient Profile</h1>
                                <p className="text-emerald-100 text-xs">Please provide your basic details to help us diagnose you accurately.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 px-4 py-4 overflow-y-auto">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-600 font-medium">Step {currentStep} of {totalSteps}</span>
                        <span className="text-sm font-semibold text-emerald-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mb-4 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Personal Info (Name, Gender, Age, Height, Weight) */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-stone-800 mb-0.5">Tell us about yourself</h2>
                                    <p className="text-stone-500 text-sm">Your basic information for diagnosis</p>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <Label className="text-stone-700 font-medium text-sm mb-1.5 block">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="John Doe"
                                            className="pl-10 h-11 text-base border-stone-200 rounded-xl bg-white shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Gender Selection - Card Buttons */}
                                <div>
                                    <Label className="text-stone-700 font-medium text-sm mb-2 block">Gender</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'male', label: 'Male', icon: '♂' },
                                            { value: 'female', label: 'Female', icon: '♀' },
                                            { value: 'other', label: 'Other', icon: '⚧' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: option.value })}
                                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${formData.gender === option.value
                                                    ? 'border-emerald-500 bg-white shadow-md'
                                                    : 'border-stone-200 bg-white hover:border-stone-300'
                                                    }`}
                                            >
                                                {formData.gender === option.value && (
                                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                                <span className="text-xl mb-0.5">{option.icon}</span>
                                                <span className={`text-xs font-medium ${formData.gender === option.value ? 'text-stone-800' : 'text-stone-600'
                                                    }`}>
                                                    {option.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Age, Height, Weight in a row */}
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Age */}
                                    <div>
                                        <Label className="text-stone-700 font-medium text-sm mb-1.5 block">Age</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                placeholder="25"
                                                className="h-11 text-base text-center border-stone-200 rounded-xl bg-white shadow-sm pr-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">yr</span>
                                        </div>
                                    </div>
                                    {/* Height */}
                                    <div>
                                        <Label className="text-stone-700 font-medium text-sm mb-1.5 block">Height</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.height}
                                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                                placeholder="170"
                                                className="h-11 text-base text-center border-stone-200 rounded-xl bg-white shadow-sm pr-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">cm</span>
                                        </div>
                                    </div>
                                    {/* Weight */}
                                    <div>
                                        <Label className="text-stone-700 font-medium text-sm mb-1.5 block">Weight</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                placeholder="65"
                                                className="h-11 text-base text-center border-stone-200 rounded-xl bg-white shadow-sm pr-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">kg</span>
                                        </div>
                                    </div>
                                </div>

                                {/* BMI Preview */}
                                {bmi && (
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-emerald-700 font-medium text-sm">Your BMI</span>
                                            <span className="text-xl font-bold text-emerald-600">{bmi}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Medical History */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="text-xl font-bold text-stone-800 mb-0.5">Medical History</h2>
                                <p className="text-stone-500 text-sm mb-4">Any information that helps with diagnosis</p>

                                <div>
                                    <Label className="text-stone-700 font-medium text-sm mb-2 block">
                                        <FileText className="w-4 h-4 inline mr-1 text-emerald-600" />
                                        Health Background
                                    </Label>
                                    <Textarea
                                        value={formData.medical_history}
                                        onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                        placeholder="Any existing conditions, allergies, current medications, past surgeries..."
                                        className="min-h-[120px] text-base border-stone-200 rounded-xl bg-white shadow-sm resize-none"
                                    />
                                </div>

                                {/* Summary Preview */}
                                <div className="mt-4 p-4 bg-stone-100 rounded-xl">
                                    <h4 className="font-semibold text-stone-700 mb-2 text-sm">Profile Summary</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Name:</span>
                                            <span className="font-medium text-stone-700">{formData.full_name || '--'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Gender:</span>
                                            <span className="font-medium text-stone-700 capitalize">{formData.gender || '--'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Age:</span>
                                            <span className="font-medium text-stone-700">{formData.age || '--'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">BMI:</span>
                                            <span className="font-medium text-stone-700">{bmi || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${currentStep === 1
                            ? 'text-stone-300'
                            : 'text-stone-600 hover:bg-stone-100'
                            }`}
                    >
                        <span className="text-lg">‹</span>
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-1 px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                    >
                        <span className="text-sm">{currentStep === totalSteps ? 'Save & Done' : 'Next'}</span>
                        <span className="text-lg">→</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleStartDiagnosis}
                        className="flex items-center gap-1 px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <span className="text-lg">▷</span>
                        <span className="text-sm font-medium">Skip</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center gap-1 px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        {loggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span className="text-lg">→]</span>
                                <span className="text-sm font-medium">Login</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.md,.csv,.doc,.docx,application/pdf,text/markdown,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                />
            </div>
        )
    }

    // Desktop Layout (original multi-column grid)
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

                    <form onSubmit={handleSave} className="p-6 space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl transition-transform group-hover:scale-105 duration-300">
                                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'P'}
                                </div>
                                <div className="absolute -right-1 -bottom-1 p-1.5 bg-white rounded-full shadow-lg border border-stone-100 text-emerald-600">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-xl font-bold text-stone-800">{formData.full_name || 'My Profile'}</h3>
                                <p className="text-sm text-stone-500">{user?.email || 'guest@sihat.tcm'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="text-stone-600 font-medium ml-1">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600/70" />
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Enter your name"
                                        className="pl-11 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/30 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="age" className="text-stone-600 font-medium ml-1">Age</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600/70" />
                                        <Input
                                            id="age"
                                            type="number"
                                            inputMode="numeric"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="Age"
                                            className="pl-11 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/30 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-stone-600 font-medium ml-1">Gender</Label>
                                    <div className="flex gap-2 h-12">
                                        {['male', 'female', 'other'].map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: opt })}
                                                className={`flex-1 rounded-xl border transition-all duration-200 text-sm font-medium ${formData.gender.toLowerCase() === opt
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                                                    : 'bg-stone-50/50 border-stone-200 text-stone-600 hover:border-emerald-300'
                                                    }`}
                                            >
                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="height" className="text-stone-600 font-medium ml-1">Height</Label>
                                    <div className="relative">
                                        <Ruler className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600/70" />
                                        <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-medium">cm</span>
                                        <Input
                                            id="height"
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            placeholder="170"
                                            className="pl-11 pr-12 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/30 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight" className="text-stone-600 font-medium ml-1">Weight</Label>
                                    <div className="relative">
                                        <Scale className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600/70" />
                                        <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-medium">kg</span>
                                        <Input
                                            id="weight"
                                            type="number"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            placeholder="70"
                                            className="pl-11 pr-12 h-12 border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/30 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medical_history" className="text-stone-600 font-medium ml-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    Medical History
                                </Label>
                                <Textarea
                                    id="medical_history"
                                    value={formData.medical_history}
                                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                    placeholder="Any existing conditions, allergies, medications..."
                                    className="min-h-[100px] border-stone-200 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 bg-stone-50/30 rounded-xl resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-100 h-14 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                                {loading ? 'Saving Changes...' : 'Save Profile'}
                            </Button>
                            <AnimatePresence>
                                {saved && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="flex items-center justify-center p-3 bg-emerald-100 text-emerald-600 rounded-2xl"
                                    >
                                        <Check className="w-6 h-6" />
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
