'use client'

import DiagnosisWizard from '@/components/diagnosis/DiagnosisWizard'
import { useEffect, useState } from 'react'
import { FlaskConical, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'

export default function Home() {
  const [isDev, setIsDev] = useState(false)
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    // Check if running on localhost (development)
    setIsDev(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }, [])

  const handleTestClick = () => {
    // Dispatch custom event to fill test data in BasicInfoForm
    window.dispatchEvent(new CustomEvent('fill-test-data'))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30 text-stone-800 font-sans selection:bg-emerald-100">
      <header className="relative overflow-hidden bg-emerald-900 text-white py-16 px-6 text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        {/* Top left - Language Selector */}
        <div className="absolute top-4 left-4 z-20">
          <LanguageSelector variant="compact" className="text-white" />
        </div>

        {/* Top right buttons */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {isDev && (
            <button
              onClick={handleTestClick}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FlaskConical className="w-4 h-4" />
              {t.nav.test}
            </button>
          )}
          {!loading && (
            user ? (
              <Link href={`/${profile?.role || 'patient'}`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105">
                  <User className="w-4 h-4" />
                  {t.nav.dashboard}
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium transition-all border border-white/20">
                  {t.nav.login}
                </button>
              </Link>
            )
          )}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-800 text-emerald-100 text-sm font-medium mb-2">
            {t.common.appTagline}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-100">
            {t.common.appName}
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            {t.common.appDescription}
          </p>
        </div>
      </header>

      <section className="container mx-auto py-12 px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          <DiagnosisWizard />
        </div>
      </section>

      <footer className="text-center py-8 text-stone-500 text-sm">
        <p>{t.common.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
      </footer>
    </main>
  )
}
