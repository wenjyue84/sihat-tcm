"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/')
        }
    }, [profile, authLoading, router])

    useEffect(() => {
        fetchSystemPrompt()
    }, [])

    const fetchSystemPrompt = async () => {
        try {
            const { data, error } = await supabase
                .from('system_prompts')
                .select('prompt_text')
                .eq('role', 'doctor')
                .single()

            if (data) {
                setPrompt(data.prompt_text)
            }
        } catch (error) {
            console.error('Error fetching prompt:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Check if exists first
            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('role', 'doctor')
                .single()

            if (existing) {
                await supabase
                    .from('system_prompts')
                    .update({ prompt_text: prompt, updated_at: new Date() })
                    .eq('role', 'doctor')
            } else {
                await supabase
                    .from('system_prompts')
                    .insert([{ role: 'doctor', prompt_text: prompt }])
            }
            alert('System prompt updated successfully!')
        } catch (error) {
            console.error('Error saving prompt:', error)
            alert('Failed to save prompt.')
        } finally {
            setSaving(false)
        }
    }

    if (authLoading || loading) return <div className="p-8">Loading...</div>

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Doctor AI System Prompt</CardTitle>
                    <CardDescription>
                        Configure the system prompt that guides the AI Doctor's behavior and diagnosis style.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter system prompt here..."
                        className="min-h-[300px] font-mono"
                    />
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
