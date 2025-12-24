"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type Role = 'admin' | 'doctor' | 'patient'

export interface Profile {
    id: string
    role: Role
    full_name?: string
    age?: number
    gender?: string
    height?: number
    weight?: number
    medical_history?: string
    preferred_language?: 'en' | 'zh' | 'ms'
}

interface AuthContextType {
    user: User | null
    session: Session | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: (userId?: string, initialData?: Profile) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('Error getting session:', error)
                setLoading(false)
                return
            }
            const session = data?.session
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        }).catch((err) => {
            console.error('Unexpected error getting session:', err)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                setLoading(true) // Ensure loading is true while fetching profile
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', JSON.stringify(error, null, 2))
            } else {
                setProfile(data)

                // If user doesn't have a preferred language saved, sync from localStorage
                // This captures language selected during onboarding before login
                if (!data.preferred_language && typeof window !== 'undefined') {
                    const localLanguage = localStorage.getItem('sihat-tcm-language') as 'en' | 'zh' | 'ms' | null
                    if (localLanguage && ['en', 'zh', 'ms'].includes(localLanguage)) {
                        // Save to database in background (non-blocking)
                        supabase
                            .from('profiles')
                            .update({ preferred_language: localLanguage })
                            .eq('id', userId)
                            .then(({ error: updateError }) => {
                                if (updateError) {
                                    console.warn('Failed to sync language preference:', updateError)
                                } else {
                                    // Update local profile state
                                    setProfile(prev => prev ? { ...prev, preferred_language: localLanguage } : prev)
                                }
                            })
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
        setUser(null)
        setSession(null)
    }

    const refreshProfile = async (userId?: string, initialData?: Profile) => {
        if (initialData) {
            setProfile(initialData)
            // Still fetch in background to ensure consistency? Maybe not needed if we trust the source.
            // But let's just set it and be done to be fast.
            return
        }
        const idToFetch = userId || user?.id
        if (idToFetch) {
            await fetchProfile(idToFetch)
        }
    }

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
