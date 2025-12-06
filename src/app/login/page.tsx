"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { user, profile, refreshProfile } = useAuth()

    if (user && profile) {
        // Redirect based on role if already logged in
        router.push(`/${profile.role}`)
    }

    const handleQuickLogin = async (role: 'patient' | 'doctor' | 'admin') => {
        setLoading(true)
        setError(null)
        const email = `${role}@sihat.com`
        const password = 'password123'

        try {
            // Try login first
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // If login fails, try signup
                console.log('Login failed, trying signup...', error.message)
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                            role: role,
                        },
                    },
                })

                if (signUpError) throw signUpError

                if (signUpData.user) {
                    // Check if we have a session (email confirmation might be required)
                    if (!signUpData.session) {
                        alert('Please check your email to confirm your account, or disable "Confirm email" in your Supabase Authentication settings.')
                        return
                    }

                    // Create profile
                    const newProfile = {
                        id: signUpData.user.id,
                        role: role,
                        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    }
                    const { error: upsertError } = await supabase.from('profiles').upsert(newProfile)
                    if (upsertError) {
                        console.error('Signup Upsert Error:', JSON.stringify(upsertError, null, 2))
                        throw upsertError
                    }

                    // Refresh profile in context to ensure we have the latest data
                    await refreshProfile(signUpData.user.id, newProfile)
                    router.push(`/${role}`)
                }
            } else {
                // Login success
                if (data.user) {
                    // Ensure profile exists even for existing users
                    const newProfile = {
                        id: data.user.id,
                        role: role,
                        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    }
                    const { error: upsertError } = await supabase.from('profiles').upsert(newProfile)
                    if (upsertError) {
                        console.error('Login Upsert Error:', JSON.stringify(upsertError, null, 2))
                        throw upsertError
                    }

                    // Refresh profile in context to ensure we have the latest data
                    await refreshProfile(data.user.id, newProfile)
                    router.push(`/${role}`)
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Welcome to Sihat TCM</CardTitle>
                    <CardDescription>Select a role to login (Dev Mode)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Button
                            variant="outline"
                            className="h-12 text-lg"
                            onClick={() => handleQuickLogin('patient')}
                            disabled={loading}
                        >
                            Login as Patient
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 text-lg"
                            onClick={() => handleQuickLogin('doctor')}
                            disabled={loading}
                        >
                            Login as Doctor
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 text-lg"
                            onClick={() => handleQuickLogin('admin')}
                            disabled={loading}
                        >
                            Login as Admin
                        </Button>
                    </div>
                    {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
                </CardContent>
            </Card>
        </div >
    )
}
