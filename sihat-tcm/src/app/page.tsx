'use client'

import DiagnosisWizard from '@/components/diagnosis/DiagnosisWizard'
import { useState, useRef, useEffect } from 'react'
import { FlaskConical, Check, Eraser } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { SystemManual } from '@/components/ui/SystemManual'
import { useDiagnosisProgressOptional } from '@/contexts/DiagnosisProgressContext'
import Image from 'next/image'

export default function Home() {

  /**
   * ============================================================================
   * TEST/CLEAR BUTTON STATE MACHINE
   * ============================================================================
   * This state controls the visual feedback when the Test/Clear button is clicked.
   * 
   * States:
   * - 'test': Initial state, shows Test button (amber)
   * - 'filling': Transitional state after clicking Test, shows "Filled!" (emerald)
   * - 'clear': Shows Clear button (rose/red)
   * - 'clearing': Transitional state after clicking Clear, shows "Cleared!" (emerald)
   * 
   * Flow: test → filling → clear → clearing → test (cycle repeats)
   * 
   * DO NOT REMOVE: This is an intentional UX feature requested by the user.
   * ============================================================================
   */
  type ButtonState = 'test' | 'filling' | 'clear' | 'clearing'
  const [buttonState, setButtonState] = useState<ButtonState>('test')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()
  const diagnosisProgress = useDiagnosisProgressOptional()
  const progress = diagnosisProgress?.progress ?? 0

  // Hide the promotional footer on mobile during step 2/7 and beyond (wen_inquiry starts at 15%)
  // because it requires lots of data entry and we don't want to confuse users with extra content
  // Progress 15% = Step 2 starts, so we hide footer for all steps after basic info (step 1)
  const isStep2OrBeyondMobile = progress >= 15



  /**
   * Handle Test/Clear button click with visual feedback
   * State machine transitions:
   * - test → filling: Dispatch fill event, show "Filled!", then transition to clear after 1.5s
   * - clear → clearing: Dispatch clear event, show "Cleared!", then transition to test after 1.5s
   * - filling/clearing: Disabled (prevent rapid clicking during transition)
   */
  const handleButtonClick = () => {
    // Prevent clicks during transition states
    if (buttonState === 'filling' || buttonState === 'clearing') return

    // Clear any existing timeout to prevent state corruption
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (buttonState === 'test') {
      // Test → Filling → Clear
      setButtonState('filling')
      window.dispatchEvent(new CustomEvent('fill-test-data'))
      timeoutRef.current = setTimeout(() => setButtonState('clear'), 1500)
    } else if (buttonState === 'clear') {
      // Clear → Clearing → Test
      setButtonState('clearing')
      window.dispatchEvent(new CustomEvent('clear-test-data'))
      timeoutRef.current = setTimeout(() => setButtonState('test'), 1500)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-emerald-50/30 text-stone-800 font-sans selection:bg-emerald-100">
      <header className="relative bg-emerald-900 text-white min-h-[4rem] h-auto py-2 px-3 sm:px-6 flex flex-nowrap items-center justify-between gap-2 transition-all">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        {/* Left side: Logo and Title */}
        <Link href="/credentials" className="relative z-10 flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity cursor-pointer group shrink-0">
          <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
            <Image
              src="/logo.png"
              alt="Sihat TCM Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold leading-none tracking-tight text-white group-hover:text-emerald-50 transition-colors whitespace-nowrap">Sihat TCM</span>
            {/* Tagline hidden on mobile/tablet to save space */}
            <p className="text-xs text-emerald-200 font-medium tracking-wide hidden lg:block">AI-Powered Traditional Chinese Medicine</p>
          </div>
        </Link>


        {/* Top right buttons */}
        <div className="relative z-50 flex items-center gap-2 shrink-0">
          <Link
            href="/blog"
            className="flex items-center gap-1 text-sm font-medium text-emerald-100 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            {t.nav.blog}
          </Link>
          <SystemManual />
          <LanguageSelector variant="compact" className="sm:hidden" />
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* 
            ========================================================================
            TEST/CLEAR BUTTON WITH STATE MACHINE FEEDBACK
            ========================================================================
            States: test → filling → clear → clearing → test (cycle)
            - test: Amber, Flask icon, "Test"
            - filling: Emerald, Check icon (bounce), "Filled!"
            - clear: Rose, Eraser icon, "Clear"
            - clearing: Emerald, Check icon (bounce), "Cleared!"
            */}
          <button
            onClick={handleButtonClick}
            disabled={buttonState === 'filling' || buttonState === 'clearing'}
            className={`flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl
              ${buttonState === 'test'
                ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 hover:scale-105'
                : buttonState === 'filling' || buttonState === 'clearing'
                  ? 'bg-emerald-500 text-white scale-95 ring-4 ring-emerald-300/50'
                  : 'bg-rose-500 hover:bg-rose-400 text-white hover:scale-105'
              }
              ${(buttonState === 'filling' || buttonState === 'clearing') ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={buttonState === 'test' || buttonState === 'filling' ? t.nav.test : t.common.clear}
          >
            {/* Icon based on state */}
            {buttonState === 'test' ? (
              <FlaskConical className="w-4 h-4" />
            ) : buttonState === 'filling' || buttonState === 'clearing' ? (
              <Check className="w-4 h-4 animate-bounce" />
            ) : (
              <Eraser className="w-4 h-4" />
            )}
            {/* Text: Always show during transitions, hide on mobile for idle states */}
            <span className={`${buttonState === 'filling' || buttonState === 'clearing' ? 'inline' : 'hidden lg:inline'}`}>
              {buttonState === 'test'
                ? t.nav.test
                : buttonState === 'filling'
                  ? t.common.filled
                  : buttonState === 'clearing'
                    ? t.common.cleared
                    : t.common.clear
              }
            </span>
          </button>

          {/* Login/Sign Up button - visible on PC view */}
          {!loading && !user && (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              {t.nav.login}
            </Link>
          )}

        </div>
      </header>

      <section className="container mx-auto py-6 md:py-12 px-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          <DiagnosisWizard />
        </div>
      </section>

      {/* Promotional footer - hidden on mobile during step 2/7 and beyond to reduce confusion during data entry */}
      <section className={`relative overflow-hidden bg-emerald-900 text-white py-12 px-4 md:px-6 text-center mt-8 ${isStep2OrBeyondMobile ? 'hidden md:block' : ''}`}>
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


    </main>
  )
}
