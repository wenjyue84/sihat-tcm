"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Info, MessageSquare, Eye, FileText, Check, Loader2, ChevronDown, ChevronUp, Mic, Users, Settings, Shield, Key, UserCog, Music } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PractitionerManager } from '@/components/admin/PractitionerManager'
import { SecuritySettings } from '@/components/admin/SecuritySettings'
import { UserManager } from '@/components/admin/UserManager'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
    INTERACTIVE_CHAT_PROMPT,
    TONGUE_ANALYSIS_PROMPT,
    FACE_ANALYSIS_PROMPT,
    BODY_ANALYSIS_PROMPT,
    LISTENING_ANALYSIS_PROMPT,
    INQUIRY_SUMMARY_PROMPT,
    FINAL_ANALYSIS_PROMPT
} from '@/lib/systemPrompts'
import { ClipboardList } from 'lucide-react'

// Doctor Level → LLM Model mapping (same as DoctorContext)
const DOCTOR_MODEL_MAPPING = {
    Master: { model: 'gemini-3.0-preview', label: 'Gemini 3.0 Preview (Master)' },
    Expert: { model: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Expert)' },
    Physician: { model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
} as const

// Prompt types with their default values
const PROMPT_TYPES = {
    chat: {
        role: 'doctor_chat',
        title: '问诊 Interactive Chat Prompt',
        description: 'Used during Step 2 patient inquiry. Guides how the AI conducts the diagnostic conversation.',
        icon: MessageSquare,
        color: 'blue',
        defaultPrompt: INTERACTIVE_CHAT_PROMPT,
    },
    tongue: {
        role: 'doctor_tongue',
        title: '舌诊 Tongue Analysis Prompt',
        description: 'Used for tongue visual inspection. Guides how AI analyzes tongue images.',
        icon: Eye,
        color: 'red',
        defaultPrompt: TONGUE_ANALYSIS_PROMPT,
    },
    face: {
        role: 'doctor_face',
        title: '面诊 Face Analysis Prompt',
        description: 'Used for face visual inspection. Guides how AI analyzes face images.',
        icon: Eye,
        color: 'orange',
        defaultPrompt: FACE_ANALYSIS_PROMPT,
    },
    body: {
        role: 'doctor_body',
        title: '体诊 Body Analysis Prompt',
        description: 'Used for body visual inspection. Guides how AI analyzes body images.',
        icon: Eye,
        color: 'emerald',
        defaultPrompt: BODY_ANALYSIS_PROMPT,
    },
    listening: {
        role: 'doctor_listening',
        title: '闻诊 Listening Analysis Prompt',
        description: 'Used for voice and sound analysis. Guides how AI analyzes audio recordings for diagnostic insights.',
        icon: Mic,
        color: 'purple',
        defaultPrompt: LISTENING_ANALYSIS_PROMPT,
    },
    inquiry_summary: {
        role: 'doctor_inquiry_summary',
        title: '问诊总结 Inquiry Summary Prompt',
        description: 'Used to summarize the patient inquiry into a structured clinical summary. This is the step that\'s failing in your screenshot.',
        icon: ClipboardList,
        color: 'teal',
        defaultPrompt: INQUIRY_SUMMARY_PROMPT,
    },
    final: {
        role: 'doctor_final',
        title: '综合诊断 Final Analysis Prompt',
        description: 'Used for the final diagnosis synthesis. Guides how AI generates the comprehensive diagnosis report.',
        icon: FileText,
        color: 'amber',
        defaultPrompt: FINAL_ANALYSIS_PROMPT,
    },
} as const

type PromptType = keyof typeof PROMPT_TYPES

export default function AdminDashboard() {
    const [prompts, setPrompts] = useState<Record<PromptType, string>>({
        chat: PROMPT_TYPES.chat.defaultPrompt,
        tongue: PROMPT_TYPES.tongue.defaultPrompt,
        face: PROMPT_TYPES.face.defaultPrompt,
        body: PROMPT_TYPES.body.defaultPrompt,
        listening: PROMPT_TYPES.listening.defaultPrompt,
        inquiry_summary: PROMPT_TYPES.inquiry_summary.defaultPrompt,
        final: PROMPT_TYPES.final.defaultPrompt,
    })
    const [doctorLevel, setDoctorLevel] = useState<keyof typeof DOCTOR_MODEL_MAPPING>('Physician')
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)
    const [saving, setSaving] = useState<PromptType | 'config' | 'config_music' | null>(null)
    const [saved, setSaved] = useState<PromptType | 'config' | 'config_music' | null>(null)
    const [expandedPrompts, setExpandedPrompts] = useState<Record<PromptType, boolean>>({
        chat: false,
        tongue: false,
        face: false,
        body: false,
        listening: false,
        inquiry_summary: false,
        final: false,
    })
    const [musicEnabled, setMusicEnabled] = useState(false)
    const [musicUrl, setMusicUrl] = useState('https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3')
    const [musicVolume, setMusicVolume] = useState(0.5)
    const [isTestPlaying, setIsTestPlaying] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('prompts')
    const testAudioRef = useRef<HTMLAudioElement | null>(null)
    const { profile, loading: authLoading, signOut } = useAuth()
    const router = useRouter()

    const togglePrompt = (type: PromptType) => {
        setExpandedPrompts(prev => ({
            ...prev,
            [type]: !prev[type]
        }))
    }

    useEffect(() => {
        fetchAllPrompts()
        fetchAdminSettings()

        // Restore active tab from localStorage
        const savedTab = localStorage.getItem('admin-active-tab')
        if (savedTab) {
            setActiveTab(savedTab)
        }
    }, [])

    // Update test audio volume when slider changes
    useEffect(() => {
        if (testAudioRef.current) {
            testAudioRef.current.volume = musicVolume
        }
    }, [musicVolume])

    const fetchAdminSettings = async () => {
        try {
            // Use API route which has fallback support
            const response = await fetch('/api/admin/settings')
            if (response.ok) {
                const settings = await response.json()
                setMusicEnabled(settings.backgroundMusicEnabled || false)
                setMusicUrl(settings.backgroundMusicUrl || 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3')
                setMusicVolume(settings.backgroundMusicVolume ?? 0.5)
            } else {
                // Fallback: try direct Supabase call
                const { data, error } = await supabase
                    .from('admin_settings')
                    .select('*')
                    .single()

                if (data) {
                    setMusicEnabled(data.background_music_enabled || false)
                    setMusicUrl(data.background_music_url || 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3')
                    setMusicVolume(data.background_music_volume ?? 0.5)
                }
            }
        } catch (error) {
            console.error('Error fetching admin settings:', error)
            // Set defaults on error
            setMusicEnabled(false)
            setMusicUrl('https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3')
            setMusicVolume(0.5)
        }
    }

    const fetchAllPrompts = async () => {
        try {
            // Fetch all prompts
            const { data, error } = await supabase
                .from('system_prompts')
                .select('role, prompt_text, config')
                .in('role', ['doctor_chat', 'doctor_tongue', 'doctor_face', 'doctor_body', 'doctor_listening', 'doctor_inquiry_summary', 'doctor_final', 'doctor'])

            if (data) {
                const newPrompts = { ...prompts }
                data.forEach((item) => {
                    const text = item.prompt_text

                    if (item.role === 'doctor_chat') {
                        newPrompts.chat = text || PROMPT_TYPES.chat.defaultPrompt
                    } else if (item.role === 'doctor_tongue') {
                        newPrompts.tongue = text || PROMPT_TYPES.tongue.defaultPrompt
                    } else if (item.role === 'doctor_face') {
                        newPrompts.face = text || PROMPT_TYPES.face.defaultPrompt
                    } else if (item.role === 'doctor_body') {
                        newPrompts.body = text || PROMPT_TYPES.body.defaultPrompt
                    } else if (item.role === 'doctor_listening') {
                        newPrompts.listening = text || PROMPT_TYPES.listening.defaultPrompt
                    } else if (item.role === 'doctor_inquiry_summary') {
                        newPrompts.inquiry_summary = text || PROMPT_TYPES.inquiry_summary.defaultPrompt
                    } else if (item.role === 'doctor_final') {
                        newPrompts.final = text || PROMPT_TYPES.final.defaultPrompt
                    } else if (item.role === 'doctor' && item.config) {
                        // Legacy config for doctor level
                        setDoctorLevel(item.config.default_level || 'Physician')
                    }
                })
                setPrompts(newPrompts)
            }
        } catch (error) {
            console.error('Error fetching prompts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSavePrompt = async (type: PromptType) => {
        setSaving(type)
        const promptConfig = PROMPT_TYPES[type]

        try {
            // Check if exists first
            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('role', promptConfig.role)
                .single()

            if (existing) {
                await supabase
                    .from('system_prompts')
                    .update({
                        prompt_text: prompts[type],
                        updated_at: new Date()
                    })
                    .eq('role', promptConfig.role)
            } else {
                await supabase
                    .from('system_prompts')
                    .insert([{
                        role: promptConfig.role,
                        prompt_text: prompts[type],
                    }])
            }

            setSaved(type)
            setTimeout(() => setSaved(null), 2000)
        } catch (error) {
            console.error('Error saving prompt:', error)
            alert('Failed to save prompt.')
        } finally {
            setSaving(null)
        }
    }

    const handleTestMusic = () => {
        if (!musicUrl) {
            alert('Please enter a music URL first')
            return
        }

        if (!testAudioRef.current) {
            testAudioRef.current = new Audio(musicUrl)
            testAudioRef.current.loop = true
            testAudioRef.current.volume = musicVolume
        } else {
            testAudioRef.current.src = musicUrl
            testAudioRef.current.volume = musicVolume
        }

        if (isTestPlaying) {
            testAudioRef.current.pause()
            setIsTestPlaying(false)
        } else {
            testAudioRef.current.play().catch(err => {
                console.error('Failed to play audio:', err)
                alert('Failed to play audio. Make sure the URL is valid and accessible.')
            })
            setIsTestPlaying(true)
        }
    }

    const handleSaveMusicConfig = async () => {
        setSaving('config_music')
        try {
            // Get the session token to send with the request
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = { 'Content-Type': 'application/json' }

            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }

            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    backgroundMusicEnabled: musicEnabled,
                    backgroundMusicUrl: musicUrl,
                    backgroundMusicVolume: musicVolume
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(errorData.error || 'Failed to save music settings')
            }

            setSaved('config_music')
            setTimeout(() => setSaved(null), 2000)
        } catch (error) {
            console.error('Error saving music config:', error)
            alert(error instanceof Error ? error.message : 'Failed to save music settings.')
        } finally {
            setSaving(null)
        }
    }

    const handleSaveConfig = async () => {
        setSaving('config')
        try {
            // Check if exists first
            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('role', 'doctor')
                .single()

            const config = {
                default_level: doctorLevel,
                model: DOCTOR_MODEL_MAPPING[doctorLevel].model
            }

            if (existing) {
                await supabase
                    .from('system_prompts')
                    .update({
                        config,
                        updated_at: new Date()
                    })
                    .eq('role', 'doctor')
            } else {
                await supabase
                    .from('system_prompts')
                    .insert([{
                        role: 'doctor',
                        prompt_text: '',
                        config
                    }])
            }

            setSaved('config')
            setTimeout(() => setSaved(null), 2000)
        } catch (error) {
            console.error('Error saving config:', error)
            alert('Failed to save configuration.')
        } finally {
            setSaving(null)
        }
    }

    const handleResetToDefault = (type: PromptType) => {
        if (confirm('Reset this prompt to the default? This will overwrite your custom prompt.')) {
            setPrompts(prev => ({
                ...prev,
                [type]: PROMPT_TYPES[type].defaultPrompt
            }))
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

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        localStorage.setItem('admin-active-tab', value)
    }

    if (authLoading || loading) return <div className="p-8">Loading...</div>

    if (!profile || profile.role !== 'admin') {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="mb-4">You are logged in as: <strong>{profile?.role || 'Unknown'}</strong></p>
                <p className="mb-4">This page is for Admins only.</p>
                <Button onClick={() => router.push('/')}>Go Home</Button>
            </div>
        )
    }

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
        },
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            icon: 'text-orange-600',
            button: 'bg-orange-600 hover:bg-orange-700',
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            icon: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700',
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            icon: 'text-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700',
        },
        teal: {
            bg: 'bg-teal-50',
            border: 'border-teal-200',
            icon: 'text-teal-600',
            button: 'bg-teal-600 hover:bg-teal-700',
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            icon: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700',
        },
    }

    return (
        <div className="container mx-auto p-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Configure AI Doctor System Prompts</p>
                </div>
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

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto mb-8">
                    <TabsTrigger value="prompts" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Prompts
                    </TabsTrigger>

                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="practitioners" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Practitioners
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    {/* Default Doctor Level Configuration */}
                    {/* Doctor Level Configuration */}
                    <Card className="mb-6 border-blue-100 bg-blue-50/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                                <UserCog className="w-5 h-5 text-blue-600" />
                                AI Persona Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="space-y-2 flex-1 min-w-[200px]">
                                    <Label className="text-blue-900">Default Doctor Expertise Level</Label>
                                    <Select value={doctorLevel} onValueChange={(v) => setDoctorLevel(v as keyof typeof DOCTOR_MODEL_MAPPING)}>
                                        <SelectTrigger className="w-full max-w-md bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Physician">💊 医师 Physician (Standard)</SelectItem>
                                            <SelectItem value="Expert">🩺 专家 Expert (Advanced)</SelectItem>
                                            <SelectItem value="Master">👨‍⚕️ 名医 Master (Premium)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleSaveConfig}
                                    disabled={saving === 'config'}
                                    className="h-10 bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving === 'config' ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                    ) : saved === 'config' ? (
                                        <><Check className="w-4 h-4 mr-2" /> Saved!</>
                                    ) : (
                                        'Save Config'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grouped System Prompts */}
                    <div className="space-y-8">
                        {[
                            {
                                id: 'step1',
                                title: 'Step 1: Patient Inquiry (问诊)',
                                description: 'Conversational assessment and symptom gathering',
                                icon: MessageSquare,
                                color: 'text-blue-600',
                                prompts: ['chat', 'inquiry_summary'] as PromptType[]
                            },
                            {
                                id: 'step2',
                                title: 'Step 2: AI Analysis (望闻问切)',
                                description: 'Visual and audio analysis of physical indicators',
                                icon: Eye,
                                color: 'text-emerald-600',
                                prompts: ['tongue', 'face', 'body', 'listening'] as PromptType[]
                            },
                            {
                                id: 'step3',
                                title: 'Step 3: Diagnosis & Treatment (辨证论治)',
                                description: 'Final synthesis and treatment recommendations',
                                icon: FileText,
                                color: 'text-amber-600',
                                prompts: ['final'] as PromptType[]
                            }
                        ].map((group) => (
                            <div key={group.id} className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <group.icon className={`w-5 h-5 ${group.color}`} />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{group.title}</h3>
                                        <p className="text-sm text-gray-500">{group.description}</p>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    {group.prompts.map((type) => {
                                        const config = PROMPT_TYPES[type]
                                        const colors = colorClasses[config.color as keyof typeof colorClasses]
                                        const Icon = config.icon
                                        const isExpanded = expandedPrompts[type]

                                        return (
                                            <Card key={type} className={`${colors.border} border-2 overflow-hidden shadow-sm`}>
                                                <CardHeader
                                                    className={`${colors.bg} ${isExpanded ? 'rounded-t-lg pb-3' : 'rounded-lg'} cursor-pointer transition-all duration-200 hover:opacity-95`}
                                                    onClick={() => togglePrompt(type)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`p-2 rounded-full bg-white/50 ${colors.icon}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                                    {config.title}
                                                                </CardTitle>
                                                                <CardDescription className="text-gray-600 mt-1">
                                                                    {config.description}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`${colors.icon} hover:bg-white/50 shrink-0 ml-4`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                togglePrompt(type)
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <div
                                                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                                                        }`}
                                                >
                                                    <CardContent className="pt-4 space-y-4 bg-white">
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 px-1">
                                                            <span>System Role: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{config.role}</code></span>
                                                            {prompts[type] !== config.defaultPrompt && (
                                                                <span className="text-amber-600 font-medium">Modified</span>
                                                            )}
                                                        </div>
                                                        <Textarea
                                                            value={prompts[type]}
                                                            onChange={(e) => setPrompts(prev => ({ ...prev, [type]: e.target.value }))}
                                                            placeholder={`Enter ${config.title} here... (Leave empty to use default)`}
                                                            className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                        />
                                                        <div className="flex items-center justify-between gap-3 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleResetToDefault(type)}
                                                                className="text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                                                            >
                                                                Reset to Default
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleSavePrompt(type)}
                                                                disabled={saving === type}
                                                                className={colors.button}
                                                            >
                                                                {saving === type ? (
                                                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                                                ) : saved === type ? (
                                                                    <><Check className="w-4 h-4 mr-2" /> Saved!</>
                                                                ) : (
                                                                    'Save Prompt'
                                                                )}
                                                            </Button>
                                                        </div>
                                                        {!prompts[type] || prompts[type] === config.defaultPrompt && (
                                                            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-muted-foreground flex items-start gap-2">
                                                                <Info className="w-4 h-4 mt-0.5" />
                                                                <div>
                                                                    <span className="font-semibold block mb-1">Using Default System Prompt</span>
                                                                    The system will use the built-in optimized prompt for this task. Edit the text area above and save to override.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Model Mapping Reference Card */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Doctor Level → AI Model Mapping Reference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200">
                                    <span>👨‍⚕️ 名医 Master</span>
                                    <code className="bg-amber-100 px-2 py-0.5 rounded">gemini-3.0-preview</code>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-200">
                                    <span>🩺 专家 Expert</span>
                                    <code className="bg-emerald-100 px-2 py-0.5 rounded">gemini-2.5-pro</code>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <span>💊 医师 Physician</span>
                                    <code className="bg-blue-100 px-2 py-0.5 rounded">gemini-2.0-flash</code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>



                <TabsContent value="security" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="users" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <UserManager />
                </TabsContent>

                <TabsContent value="practitioners" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <PractitionerManager />
                </TabsContent>

                <TabsContent value="config" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Music className="w-5 h-5 text-pink-500" />
                                Background Music Settings
                            </CardTitle>
                            <CardDescription>
                                Configure gentle background music for the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Background Music</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Turn music on or off for all users
                                    </p>
                                </div>
                                <Switch
                                    checked={musicEnabled}
                                    onCheckedChange={setMusicEnabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Music URL (MP3/WAV)</Label>
                                <div className="flex gap-2">
                                    <Textarea
                                        value={musicUrl}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMusicUrl(e.target.value)}
                                        placeholder="https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3"
                                        className="font-mono text-sm min-h-[40px] h-[40px] resize-none overflow-hidden py-2"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload your file to Supabase Storage manually and paste the public URL here, or use an external URL.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleTestMusic}
                                    disabled={!musicUrl}
                                    className="mt-2 flex items-center gap-2"
                                >
                                    {isTestPlaying ? (
                                        <>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Stop Test
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                            Test Music
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Default Volume ({Math.round(musicVolume * 100)}%)</Label>
                                </div>
                                <Slider
                                    value={[musicVolume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(vals: number[]) => setMusicVolume(vals[0] / 100)}
                                    className="w-full max-w-md"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSaveMusicConfig}
                                    disabled={saving === 'config_music'}
                                    className="bg-pink-600 hover:bg-pink-700"
                                >
                                    {saving === 'config_music' ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                    ) : saved === 'config_music' ? (
                                        <><Check className="w-4 h-4 mr-2" /> Saved!</>
                                    ) : (
                                        'Save Music Settings'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

