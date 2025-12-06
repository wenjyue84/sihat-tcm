'use client'

import DiagnosisWizard from '@/components/diagnosis/DiagnosisWizard'
import { useEffect, useState } from 'react'
import { FlaskConical, User, Check, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import Image from 'next/image'

export default function Home() {
  const [isDev, setIsDev] = useState(false)
  /**
   * ============================================================================
   * TEST BUTTON CLICK FEEDBACK FEATURE
   * ============================================================================
   * This state controls the visual feedback when the Test button is clicked.
   * When clicked:
   * - Button changes from amber to emerald green
   * - Icon changes from FlaskConical to Check with bounce animation
   * - Button scales down slightly (pressed effect)
   * - A ring glow appears around the button
   * - Text changes to "Filled!" (localized)
   * - Reverts back after 1.5 seconds
   * 
   * DO NOT REMOVE: This is an intentional UX feature requested by the user.
   * Translation key: t.common.filled (en: 'Filled!', zh: '已填入!', ms: 'Diisi!')
   * ============================================================================
   */
  const [testClicked, setTestClicked] = useState(false)
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    // Check if running on localhost (development)
    setIsDev(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }, [])

  /**
   * Handle Test button click with visual feedback
   * - Sets testClicked to true to trigger UI changes
   * - Dispatches event to fill test data in BasicInfoForm
   * - Resets state after 1.5s animation completes
   */
  const handleTestClick = () => {
    // Show clicked state (triggers color/icon change)
    setTestClicked(true)
    // Dispatch custom event to fill test data in BasicInfoForm
    window.dispatchEvent(new CustomEvent('fill-test-data'))
    // Reset after animation completes (1.5 seconds)
    setTimeout(() => setTestClicked(false), 1500)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30 text-stone-800 font-sans selection:bg-emerald-100">
      <header className="relative bg-emerald-900 text-white h-20 px-4 md:px-6 flex items-center justify-between">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        {/* Left side: Logo and Title */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
            <Image
              src="/logo.png"
              alt="Sihat TCM Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-none tracking-tight text-white">Sihat TCM</h1>
            <p className="text-xs text-emerald-200 font-medium tracking-wide">AI-Powered Traditional Chinese Medicine</p>
          </div>
        </div>

        {/* Top right buttons */}
        <div className="relative z-50 flex gap-2">
          <LanguageSelector />
          {/* 
            ========================================================================
            TEST BUTTON WITH CLICK FEEDBACK
            ========================================================================
            Features:
            - Dynamic styling based on testClicked state
            - Color: amber (default) → emerald green (clicked)
            - Icon: FlaskConical (default) → Check with bounce (clicked)
            - Scale: normal → scale-95 (pressed effect)
            - Ring glow when clicked
            - Uses t.common.filled translation for clicked state text
            
            DO NOT REMOVE the testClicked conditional styling or icon swap!
            ========================================================================
          */}
          {isDev && (
            <button
              onClick={handleTestClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl
                ${testClicked
                  ? 'bg-emerald-500 text-white scale-95 ring-4 ring-emerald-300/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-amber-950 hover:scale-105'
                }`}
            >
              {/* Icon swap: Check with bounce when clicked, FlaskConical otherwise */}
              {testClicked ? (
                <Check className="w-4 h-4 animate-bounce" />
              ) : (
                <FlaskConical className="w-4 h-4" />
              )}
              {/* Text: "Filled!" when clicked, "Test" otherwise */}
              {testClicked ? t.common.filled : t.nav.test}
            </button>
          )}
          {!loading && (
            user ? (
              <Link href={`/${profile?.role || 'patient'}`}>
                <button className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.nav.dashboard}</span>
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium transition-all border border-white/20">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.nav.login}</span>
                </button>
              </Link>
            )
          )}
        </div>
      </header>

      <section className="container mx-auto py-6 md:py-12 px-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          <DiagnosisWizard />
        </div>
      </section>

      <section className="relative overflow-hidden bg-emerald-900 text-white py-12 px-4 md:px-6 text-center mt-8">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-800 text-emerald-100 text-xs md:text-sm font-medium mb-2">
            {t.common.appTagline}
          </div>
          <h1 className="text-3xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-100">
            {t.common.appName}
          </h1>
          <p className="text-base md:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            {t.common.appDescription}
          </p>
        </div>
      </section>

      <footer className="text-center py-8 text-stone-500 text-sm">
        <p>{t.common.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
      </footer>
    </main>
  )
}
