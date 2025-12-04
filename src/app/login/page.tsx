"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { user } = useAuth()

    if (user) {
        // Redirect based on role if already logged in (handled by AuthContext or separate logic usually, but here for safety)
        // For now, just show a message or redirect to home
        router.push('/')
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Fetch profile to check role and redirect
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profile) {
                router.push(`/${profile.role}`)
            } else {
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            })

            if (error) throw error

            if (data.user) {
                // Create profile record
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            role: role,
                            full_name: fullName,
                        },
                    ])

                if (profileError) throw profileError

                // Auto login or ask to verify email
                // For simplicity, assuming auto-confirm is off or we just redirect
                router.push(`/${role}`)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                    // Create profile
                    await supabase.from('profiles').upsert({
                        id: signUpData.user.id,
                        role: role,
                        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    })
                    router.push(`/${role}`)
                }
            } else {
                // Login success
                router.push(`/${role}`)
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
                    <CardDescription>Login or create an account to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullname">Full Name</Label>
                                    <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="patient">Patient</SelectItem>
                                            <SelectItem value="doctor">Doctor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing up...' : 'Sign Up'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Or Quick Login (Dev)</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <Button variant="outline" onClick={() => handleQuickLogin('patient')} disabled={loading}>
                                Patient
                            </Button>
                            <Button variant="outline" onClick={() => handleQuickLogin('doctor')} disabled={loading}>
                                Doctor
                            </Button>
                            <Button variant="outline" onClick={() => handleQuickLogin('admin')} disabled={loading}>
                                Admin
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
