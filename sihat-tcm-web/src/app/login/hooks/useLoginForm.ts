"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { createClientServices } from "@/lib/services";
import { useAuth } from "@/stores/useAppStore";
import { getGuestSessionToken, clearGuestSessionToken } from "@/lib/guestSession";
import { migrateGuestSessionToUser } from "@/lib/actions";
import { FormData, AuthMode } from "../types";

export function useLoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
  });
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [pendingSignIn, setPendingSignIn] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();

  // Set initial mode from URL param
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup" || modeParam === "login") {
      setMode(modeParam);
    }
  }, [searchParams]);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user && profile) {
      router.push(`/${profile.role}`);
    }
  }, [user, profile, router]);

  const handleProfileUpsert = useCallback(
    async (userId: string, role: string, fullName: string) => {
      const newProfile = {
        id: userId,
        role: role as any,
        full_name: fullName,
      };
      const { error: upsertError } = await createClientServices().profiles.upsert(newProfile);
      if (upsertError) {
        console.error("Profile Upsert Error:", JSON.stringify(upsertError, null, 2));
        throw new Error(upsertError.message);
      }
      await refreshProfile(userId, newProfile);
    },
    [refreshProfile]
  );

  const handleQuickSignup = useCallback(
    async (role: "patient" | "doctor" | "admin" | "developer", email: string, password: string) => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        await handleProfileUpsert(
          signUpData.user.id,
          role,
          `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`
        );
        router.push(`/${role}`);
      }
    },
    [handleProfileUpsert, router]
  );

  const handleQuickLogin = useCallback(
    async (role: "patient" | "doctor" | "admin" | "developer") => {
      setLoading(true);
      setError(null);
      const email = `${role}@sihat.com`;
      const password = "password123";

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.log("Login failed, trying signup...", error.message);
          await handleQuickSignup(role, email, password);
        } else {
          if (data.user) {
            await handleProfileUpsert(
              data.user.id,
              role,
              `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`
            );
            router.push(`/${role}`);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [handleProfileUpsert, handleQuickSignup, router]
  );

  const performSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      if (data.user) {
        await refreshProfile(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        router.push(`/${profile?.role || "patient"}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData.email, formData.password, refreshProfile, router]);

  const handleEmailAuth = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName,
                role: "patient",
              },
            },
          });
          if (error) throw error;
          if (data.user) {
            await handleProfileUpsert(data.user.id, "patient", formData.fullName);

            const guestToken = getGuestSessionToken();
            if (guestToken) {
              const migrateResult = await migrateGuestSessionToUser(guestToken, data.user.id);
              if (migrateResult.success) {
                clearGuestSessionToken();
                console.log("Guest diagnosis migrated successfully");
              } else {
                console.warn("Failed to migrate guest session:", migrateResult.error);
              }
            }

            router.push("/patient");
          }
        } else {
          const guestToken = getGuestSessionToken();
          if (guestToken) {
            setPendingSignIn(true);
            setShowGuestWarning(true);
            setLoading(false);
            return;
          }

          await performSignIn();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [mode, formData, handleProfileUpsert, performSignIn, router]
  );

  const handleGuestWarningConfirm = useCallback(async () => {
    setShowGuestWarning(false);
    clearGuestSessionToken();
    await performSignIn();
    setPendingSignIn(false);
  }, [performSignIn]);

  const handleGuestWarningCancel = useCallback(() => {
    setShowGuestWarning(false);
    setPendingSignIn(false);
    setLoading(false);
  }, []);

  return {
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
  };
}
