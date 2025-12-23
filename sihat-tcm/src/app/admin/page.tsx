"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Info, MessageSquare, Eye, FileText, Check, Loader2, ChevronDown, ChevronUp, Mic, Users, Settings, Shield, Key } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PractitionerManager } from '@/components/admin/PractitionerManager'
import { SecuritySettings } from '@/components/admin/SecuritySettings'
import { ApiKeySettings } from '@/components/admin/ApiKeySettings'
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
        chat: '',
        tongue: '',
        face: '',
        body: '',
        listening: '',
        inquiry_summary: '',
        final: '',
    })
    const [doctorLevel, setDoctorLevel] = useState<keyof typeof DOCTOR_MODEL_MAPPING>('Physician')
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)
    const [saving, setSaving] = useState<PromptType | 'config' | null>(null)
    const [saved, setSaved] = useState<PromptType | 'config' | null>(null)
    const [expandedPrompts, setExpandedPrompts] = useState<Record<PromptType, boolean>>({
        chat: false,
        tongue: false,
        face: false,
        body: false,
        listening: false,
        inquiry_summary: false,
        final: false,
    })
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
    }, [])

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
                    if (item.role === 'doctor_chat') {
                        newPrompts.chat = item.prompt_text || ''
                    } else if (item.role === 'doctor_tongue') {
                        newPrompts.tongue = item.prompt_text || ''
                    } else if (item.role === 'doctor_face') {
                        newPrompts.face = item.prompt_text || ''
                    } else if (item.role === 'doctor_body') {
                        newPrompts.body = item.prompt_text || ''
                    } else if (item.role === 'doctor_listening') {
                        newPrompts.listening = item.prompt_text || ''
                    } else if (item.role === 'doctor_inquiry_summary') {
                        newPrompts.inquiry_summary = item.prompt_text || ''
                    } else if (item.role === 'doctor_final') {
                        newPrompts.final = item.prompt_text || ''
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

            <Tabs defaultValue="prompts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
                    <TabsTrigger value="prompts" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Prompts
                    </TabsTrigger>
                    <TabsTrigger value="apikeys" className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="practitioners" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Practitioners
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    {/* Default Doctor Level Configuration */}
                    <Card className="mb-6">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Default Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="space-y-2 flex-1 min-w-[200px]">
                                    <Label>Default Doctor Level</Label>
                                    <Select value={doctorLevel} onValueChange={(v) => setDoctorLevel(v as keyof typeof DOCTOR_MODEL_MAPPING)}>
                                        <SelectTrigger className="w-full max-w-md">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Physician">💊 医师 Physician (gemini-2.0-flash)</SelectItem>
                                            <SelectItem value="Expert">🩺 专家 Expert (gemini-2.5-pro)</SelectItem>
                                            <SelectItem value="Master">👨‍⚕️ 名医 Master (gemini-3-pro-preview)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleSaveConfig}
                                    disabled={saving === 'config'}
                                    className="h-10"
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

                    {/* Three System Prompts */}
                    <div className="space-y-6">
                        {(Object.entries(PROMPT_TYPES) as [PromptType, typeof PROMPT_TYPES[PromptType]][]).map(([type, config]) => {
                            const colors = colorClasses[config.color as keyof typeof colorClasses]
                            const Icon = config.icon

                            const isExpanded = expandedPrompts[type]

                            return (
                                <Card key={type} className={`${colors.border} border-2 overflow-hidden`}>
                                    <CardHeader
                                        className={`${colors.bg} ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'} cursor-pointer transition-all duration-200 hover:opacity-90`}
                                        onClick={() => togglePrompt(type)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-3">
                                                <Icon className={`w-6 h-6 ${colors.icon}`} />
                                                {config.title}
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`${colors.icon} hover:bg-white/50`}
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
                                        <CardDescription className="text-gray-600">
                                            {config.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <div
                                        className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                                            }`}
                                    >
                                        <CardContent className="pt-4 space-y-4">
                                            <Textarea
                                                value={prompts[type]}
                                                onChange={(e) => setPrompts(prev => ({ ...prev, [type]: e.target.value }))}
                                                placeholder={`Enter ${config.title} here... (Leave empty to use default)`}
                                                className="min-h-[250px] font-mono text-sm"
                                            />
                                            <div className="flex items-center justify-between gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleResetToDefault(type)}
                                                    className="text-gray-600"
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
                                            {!prompts[type] && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Info className="w-4 h-4" />
                                                    Currently using default prompt. Edit above to customize.
                                                </p>
                                            )}
                                        </CardContent>
                                    </div>
                                </Card>
                            )
                        })}
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

                <TabsContent value="apikeys" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <ApiKeySettings />
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="practitioners" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <PractitionerManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}

