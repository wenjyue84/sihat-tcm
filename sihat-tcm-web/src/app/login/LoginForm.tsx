"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

import { useLoginForm } from "./hooks";
import {
  QuickAccessRoles,
  EmailAuthForm,
  SignupBenefits,
  GuestWarningDialog,
} from "./components";

function LoginFormContent() {
  const { t } = useLanguage();
  const {
    loading,
    error,
    mode,
    setMode,
    formData,
    setFormData,
    showGuestWarning,
    setShowGuestWarning,
    handleQuickLogin,
    handleEmailAuth,
    handleGuestWarningConfirm,
    handleGuestWarningCancel,
  } = useLoginForm();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center p-4">
      {/* Home Button - Top Left */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 text-gray-600 hover:text-gray-900"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">{t.nav.home}</span>
      </Link>

      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="dropdown" />
      </div>

      <div
        className={`w-full ${mode === "signup" ? "max-w-4xl" : "max-w-md"} transition-all duration-500`}
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <style jsx>{`
            @keyframes breathing {
              0%,
              100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
            }
            .logo-breathing {
              animation: breathing 3.5s ease-in-out infinite;
            }
          `}</style>
          <div className="logo-breathing inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 shadow-lg mb-4">
            <span className="text-2xl text-amber-100 font-serif">中</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">{t.login.title}</h1>
          <p className="text-sm text-gray-500">{t.login.chineseTitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
          {/* SignUp Benefits Side Panel - Only visible in Signup Mode */}
          {mode === "signup" && (
            <SignupBenefits
              translations={{
                title: t.login.benefits.title,
                saveProfile: t.login.benefits.saveProfile,
                saveReports: t.login.benefits.saveReports,
                trackProgress: t.login.benefits.trackProgress,
              }}
            />
          )}

          {/* Main Form Content */}
          <div className="flex-1 p-6 md:p-8 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {mode === "login" ? t.login.signin : t.login.signup}
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMode("login")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t.login.signin}
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === "signup" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t.login.signup}
                </button>
              </div>
            </div>

            {/* Email/Password Form */}
            <EmailAuthForm
              mode={mode}
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleEmailAuth}
              loading={loading}
              error={error}
              translations={{
                fullName: t.login.fullName,
                email: t.login.email,
                password: t.login.password,
                signin: t.login.signin,
                signup: t.login.signup,
              }}
            />

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t.login.or}</span>
              </div>
            </div>

            {/* Quick Access Roles */}
            <QuickAccessRoles
              onQuickLogin={handleQuickLogin}
              loading={loading}
              translations={{
                quickAccess: t.login.quickAccess,
                roles: {
                  patient: { title: t.login.roles.patient.title, titleZh: t.login.roles.patient.titleZh },
                  doctor: { title: t.login.roles.doctor.title, titleZh: t.login.roles.doctor.titleZh },
                  admin: { title: t.login.roles.admin.title, titleZh: t.login.roles.admin.titleZh },
                  developer: { title: t.login.roles.developer.title, titleZh: t.login.roles.developer.titleZh },
                },
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-6 text-gray-400">
          Developed by Prisma Technology Solution Sdn Bhd
        </div>
      </div>

      {/* Guest Session Warning Dialog */}
      <GuestWarningDialog
        open={showGuestWarning}
        onOpenChange={setShowGuestWarning}
        onConfirm={handleGuestWarningConfirm}
        onCancel={handleGuestWarningCancel}
        translations={{
          title: t.login.guestSessionWarning.title,
          message: t.login.guestSessionWarning.message,
          cancel: t.login.guestSessionWarning.cancel,
          understand: t.login.guestSessionWarning.understand,
        }}
      />
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
