"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import {
  PROMPT_TYPES,
  DOCTOR_MODEL_MAPPING,
  DEFAULT_MUSIC_URL,
  type PromptType,
  type DoctorLevel,
} from "../constants";

export interface AdminDashboardState {
  prompts: Record<PromptType, string>;
  doctorLevel: DoctorLevel;
  loading: boolean;
  loggingOut: boolean;
  saving: PromptType | "config" | "config_music" | null;
  saved: PromptType | "config" | "config_music" | null;
  expandedPrompts: Record<PromptType, boolean>;
  musicEnabled: boolean;
  musicUrl: string;
  musicVolume: number;
  isTestPlaying: boolean;
  activeTab: string;
  uploadingApk: boolean;
  isMobileMenuOpen: boolean;
}

const getDefaultPrompts = (): Record<PromptType, string> => ({
  chat: PROMPT_TYPES.chat.defaultPrompt,
  tongue: PROMPT_TYPES.tongue.defaultPrompt,
  face: PROMPT_TYPES.face.defaultPrompt,
  body: PROMPT_TYPES.body.defaultPrompt,
  listening: PROMPT_TYPES.listening.defaultPrompt,
  inquiry_summary: PROMPT_TYPES.inquiry_summary.defaultPrompt,
  final: PROMPT_TYPES.final.defaultPrompt,
});

const getDefaultExpandedState = (): Record<PromptType, boolean> => ({
  chat: false,
  tongue: false,
  face: false,
  body: false,
  listening: false,
  inquiry_summary: false,
  final: false,
});

export function useAdminDashboard() {
  const [prompts, setPrompts] = useState<Record<PromptType, string>>(getDefaultPrompts);
  const [doctorLevel, setDoctorLevel] = useState<DoctorLevel>("Doctor");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState<PromptType | "config" | "config_music" | null>(null);
  const [saved, setSaved] = useState<PromptType | "config" | "config_music" | null>(null);
  const [expandedPrompts, setExpandedPrompts] =
    useState<Record<PromptType, boolean>>(getDefaultExpandedState);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState(DEFAULT_MUSIC_URL);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [activeTab, setActiveTabState] = useState<string>("prompts");
  const [uploadingApk, setUploadingApk] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const { profile, loading: authLoading, signOut, updatePreferences } = useAuth();
  const router = useRouter();

  const togglePrompt = useCallback((type: PromptType) => {
    setExpandedPrompts((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);
      updatePreferences({ activeTab: tab });
    },
    [updatePreferences]
  );

  const fetchAdminSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const settings = await response.json();
        setMusicEnabled(settings.backgroundMusicEnabled || false);
        setMusicUrl(settings.backgroundMusicUrl || DEFAULT_MUSIC_URL);
        setMusicVolume(settings.backgroundMusicVolume ?? 0.5);
      } else {
        const { data } = await supabase.from("admin_settings").select("*").single();
        if (data) {
          setMusicEnabled(data.background_music_enabled || false);
          setMusicUrl(data.background_music_url || DEFAULT_MUSIC_URL);
          setMusicVolume(data.background_music_volume ?? 0.5);
        }
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error);
    }
  }, []);

  const fetchAllPrompts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("system_prompts")
        .select("role, prompt_text, config")
        .in("role", [
          "doctor_chat",
          "doctor_tongue",
          "doctor_face",
          "doctor_body",
          "doctor_listening",
          "doctor_inquiry_summary",
          "doctor_final",
          "doctor",
        ]);

      if (data) {
        const newPrompts = { ...getDefaultPrompts() };
        data.forEach((item) => {
          const text = item.prompt_text;
          if (item.role === "doctor_chat")
            newPrompts.chat = text || PROMPT_TYPES.chat.defaultPrompt;
          else if (item.role === "doctor_tongue")
            newPrompts.tongue = text || PROMPT_TYPES.tongue.defaultPrompt;
          else if (item.role === "doctor_face")
            newPrompts.face = text || PROMPT_TYPES.face.defaultPrompt;
          else if (item.role === "doctor_body")
            newPrompts.body = text || PROMPT_TYPES.body.defaultPrompt;
          else if (item.role === "doctor_listening")
            newPrompts.listening = text || PROMPT_TYPES.listening.defaultPrompt;
          else if (item.role === "doctor_inquiry_summary")
            newPrompts.inquiry_summary = text || PROMPT_TYPES.inquiry_summary.defaultPrompt;
          else if (item.role === "doctor_final")
            newPrompts.final = text || PROMPT_TYPES.final.defaultPrompt;
          else if (item.role === "doctor" && item.config)
            setDoctorLevel(item.config.default_level || "Doctor");
        });
        setPrompts(newPrompts);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSavePrompt = useCallback(
    async (type: PromptType) => {
      setSaving(type);
      const promptConfig = PROMPT_TYPES[type];
      try {
        const { data: existing } = await supabase
          .from("system_prompts")
          .select("id")
          .eq("role", promptConfig.role)
          .single();
        if (existing) {
          await supabase
            .from("system_prompts")
            .update({ prompt_text: prompts[type], updated_at: new Date() })
            .eq("role", promptConfig.role);
        } else {
          await supabase
            .from("system_prompts")
            .insert([{ role: promptConfig.role, prompt_text: prompts[type] }]);
        }
        setSaved(type);
        setTimeout(() => setSaved(null), 2000);
      } catch (error) {
        console.error("Error saving prompt:", error);
        alert("Failed to save prompt.");
      } finally {
        setSaving(null);
      }
    },
    [prompts]
  );

  const handleTestMusic = useCallback(() => {
    if (!musicUrl) {
      alert("Please enter a music URL first");
      return;
    }
    if (!testAudioRef.current) {
      testAudioRef.current = new Audio(musicUrl);
      testAudioRef.current.loop = true;
      testAudioRef.current.volume = musicVolume;
    } else {
      testAudioRef.current.src = musicUrl;
      testAudioRef.current.volume = musicVolume;
    }
    if (isTestPlaying) {
      testAudioRef.current.pause();
      setIsTestPlaying(false);
    } else {
      testAudioRef.current.play().catch(() => alert("Failed to play audio."));
      setIsTestPlaying(true);
    }
  }, [musicUrl, musicVolume, isTestPlaying]);

  const handleSaveMusicConfig = useCallback(async () => {
    setSaving("config_music");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/admin/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          backgroundMusicEnabled: musicEnabled,
          backgroundMusicUrl: musicUrl,
          backgroundMusicVolume: musicVolume,
        }),
      });

      setSaved("config_music");
      setTimeout(() => setSaved(null), 2000);
    } catch (error) {
      console.error("Error saving music config:", error);
    } finally {
      setSaving(null);
    }
  }, [musicEnabled, musicUrl, musicVolume]);

  const handleSaveConfig = useCallback(async () => {
    setSaving("config");
    try {
      const { data: existing } = await supabase
        .from("system_prompts")
        .select("id")
        .eq("role", "doctor")
        .single();
      const config = { default_level: doctorLevel, model: DOCTOR_MODEL_MAPPING[doctorLevel].model };
      if (existing) {
        await supabase
          .from("system_prompts")
          .update({ config, updated_at: new Date() })
          .eq("role", "doctor");
      } else {
        await supabase.from("system_prompts").insert([{ role: "doctor", prompt_text: "", config }]);
      }
      setSaved("config");
      setTimeout(() => setSaved(null), 2000);
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setSaving(null);
    }
  }, [doctorLevel]);

  const handleResetToDefault = useCallback((type: PromptType) => {
    if (confirm("Reset this prompt to default?")) {
      setPrompts((prev) => ({ ...prev, [type]: PROMPT_TYPES[type].defaultPrompt }));
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      setLoggingOut(false);
    }
  }, [signOut, router]);

  const handleApkUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".apk")) {
      alert("Please select a valid .apk file");
      return;
    }

    if (
      !confirm(
        '⚠️ WARNING: This will overwrite the existing version.\n\nThe file will be renamed to "sihat-tcm.apk" and deployed immediately. Users downloading the app will get this new version.\n\nContinue?'
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingApk(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/admin/upload-apk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Full upload error:", err);
        throw new Error(err.details || err.error || "Upload failed");
      }

      alert("✅ APK successfully deployed!\n\nThe new version is now available for download.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Upload catch:", error);
      alert(`Failed to upload APK: ${errorMessage}`);
    } finally {
      setUploadingApk(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchAllPrompts();
    fetchAdminSettings();
  }, [fetchAllPrompts, fetchAdminSettings]);

  useEffect(() => {
    if (profile?.preferences?.activeTab) {
      setActiveTabState(profile.preferences.activeTab);
    } else {
      const savedTab = localStorage.getItem("admin-active-tab");
      if (savedTab) setActiveTabState(savedTab);
    }
  }, [profile]);

  useEffect(() => {
    if (testAudioRef.current) testAudioRef.current.volume = musicVolume;
  }, [musicVolume]);

  return {
    // State
    prompts,
    doctorLevel,
    loading,
    loggingOut,
    saving,
    saved,
    expandedPrompts,
    musicEnabled,
    musicUrl,
    musicVolume,
    isTestPlaying,
    activeTab,
    uploadingApk,
    isMobileMenuOpen,
    // Refs
    fileInputRef,
    // Auth
    profile,
    authLoading,
    // Setters
    setPrompts,
    setDoctorLevel,
    setMusicEnabled,
    setMusicUrl,
    setMusicVolume,
    setIsMobileMenuOpen,
    // Actions
    togglePrompt,
    setActiveTab,
    handleSavePrompt,
    handleTestMusic,
    handleSaveMusicConfig,
    handleSaveConfig,
    handleResetToDefault,
    handleLogout,
    handleApkUpload,
    router,
  };
}
