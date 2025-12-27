"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  LogOut,
  Info,
  MessageSquare,
  Eye,
  FileText,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mic,
  Users,
  Settings,
  Shield,
  Key,
  UserCog,
  Music,
  ExternalLink,
  NotebookPen,
  LayoutDashboard,
  Bell,
  CheckCircle2,
  Lock,
  Smartphone,
  Upload,
  Download,
  Menu,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PractitionerManager } from "@/components/admin/PractitionerManager";
import { SecuritySettings } from "@/components/admin/SecuritySettings";
import { UserManager } from "@/components/admin/UserManager";
import { AdminAIChatbot } from "@/components/admin/AdminAIChatbot";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import {
  INTERACTIVE_CHAT_PROMPT,
  TONGUE_ANALYSIS_PROMPT,
  FACE_ANALYSIS_PROMPT,
  BODY_ANALYSIS_PROMPT,
  LISTENING_ANALYSIS_PROMPT,
  INQUIRY_SUMMARY_PROMPT,
  FINAL_ANALYSIS_PROMPT,
} from "@/lib/systemPrompts";
import { ClipboardList } from "lucide-react";

// Doctor Level → LLM Model mapping
const DOCTOR_MODEL_MAPPING = {
  Master: { model: "gemini-3.0-preview", label: "Gemini 3.0 Preview (Master)" },
  Expert: { model: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Expert)" },
  Physician: { model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
} as const;

// Prompt configuration
const PROMPT_TYPES = {
  chat: {
    role: "doctor_chat",
    title: "Interactive Chat",
    description: "Guides the AI during the patient inquiry conversation.",
    icon: MessageSquare,
    color: "blue",
    defaultPrompt: INTERACTIVE_CHAT_PROMPT,
  },
  tongue: {
    role: "doctor_tongue",
    title: "Tongue Analysis",
    description: "Protocol for analyzing tongue images.",
    icon: Eye,
    color: "red",
    defaultPrompt: TONGUE_ANALYSIS_PROMPT,
  },
  face: {
    role: "doctor_face",
    title: "Face Analysis",
    description: "Protocol for face visual inspection.",
    icon: Eye,
    color: "orange",
    defaultPrompt: FACE_ANALYSIS_PROMPT,
  },
  body: {
    role: "doctor_body",
    title: "Body Analysis",
    description: "Protocol for body visual inspection.",
    icon: Eye,
    color: "emerald",
    defaultPrompt: BODY_ANALYSIS_PROMPT,
  },
  listening: {
    role: "doctor_listening",
    title: "Listening Analysis",
    description: "Protocol for analyzing voice and audio.",
    icon: Mic,
    color: "purple",
    defaultPrompt: LISTENING_ANALYSIS_PROMPT,
  },
  inquiry_summary: {
    role: "doctor_inquiry_summary",
    title: "Inquiry Summary",
    description: "Summarizes patient inquiry into clinical data.",
    icon: ClipboardList,
    color: "teal",
    defaultPrompt: INQUIRY_SUMMARY_PROMPT,
  },
  final: {
    role: "doctor_final",
    title: "Final Diagnosis",
    description: "Synthesis of all data into a final report.",
    icon: FileText,
    color: "amber",
    defaultPrompt: FINAL_ANALYSIS_PROMPT,
  },
} as const;

type PromptType = keyof typeof PROMPT_TYPES;

export default function AdminDashboard() {
  const [prompts, setPrompts] = useState<Record<PromptType, string>>({
    chat: PROMPT_TYPES.chat.defaultPrompt,
    tongue: PROMPT_TYPES.tongue.defaultPrompt,
    face: PROMPT_TYPES.face.defaultPrompt,
    body: PROMPT_TYPES.body.defaultPrompt,
    listening: PROMPT_TYPES.listening.defaultPrompt,
    inquiry_summary: PROMPT_TYPES.inquiry_summary.defaultPrompt,
    final: PROMPT_TYPES.final.defaultPrompt,
  });
  const [doctorLevel, setDoctorLevel] = useState<keyof typeof DOCTOR_MODEL_MAPPING>("Physician");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState<PromptType | "config" | "config_music" | null>(null);
  const [saved, setSaved] = useState<PromptType | "config" | "config_music" | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<PromptType, boolean>>({
    chat: false,
    tongue: false,
    face: false,
    body: false,
    listening: false,
    inquiry_summary: false,
    final: false,
  });
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState(
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3"
  );
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [activeTab, setActiveTabState] = useState<string>("prompts");
  const [uploadingApk, setUploadingApk] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const { profile, loading: authLoading, signOut, updatePreferences } = useAuth();
  const router = useRouter();

  const togglePrompt = (type: PromptType) => {
    setExpandedPrompts((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    updatePreferences({ activeTab: tab });
  };

  useEffect(() => {
    fetchAllPrompts();
    fetchAdminSettings();
  }, []);

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

  const fetchAdminSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const settings = await response.json();
        setMusicEnabled(settings.backgroundMusicEnabled || false);
        setMusicUrl(
          settings.backgroundMusicUrl ||
            "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3"
        );
        setMusicVolume(settings.backgroundMusicVolume ?? 0.5);
      } else {
        const { data } = await supabase.from("admin_settings").select("*").single();
        if (data) {
          setMusicEnabled(data.background_music_enabled || false);
          setMusicUrl(
            data.background_music_url ||
              "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3"
          );
          setMusicVolume(data.background_music_volume ?? 0.5);
        }
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error);
    }
  };

  const fetchAllPrompts = async () => {
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
        const newPrompts = { ...prompts };
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
            setDoctorLevel(item.config.default_level || "Physician");
        });
        setPrompts(newPrompts);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (type: PromptType) => {
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
  };

  const handleTestMusic = () => {
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
      testAudioRef.current.play().catch((err) => alert("Failed to play audio."));
      setIsTestPlaying(true);
    }
  };

  const handleSaveMusicConfig = async () => {
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
  };

  const handleSaveConfig = async () => {
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
  };

  const handleResetToDefault = (type: PromptType) => {
    if (confirm("Reset this prompt to default?")) {
      setPrompts((prev) => ({ ...prev, [type]: PROMPT_TYPES[type].defaultPrompt }));
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      setLoggingOut(false);
    }
  };

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Don't set Content-Type header - browser will set it automatically with boundary
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
    } catch (error: any) {
      console.error("Upload catch:", error);
      alert(`Failed to upload APK: ${error.message || error}`);
    } finally {
      setUploadingApk(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading Admin Console...</p>
        </div>
      </div>
    );

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-100 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Access Denied</CardTitle>
            <CardDescription>Administrative privileges required.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              You are currently logged in as{" "}
              <span className="font-bold text-slate-900 capitalize">{profile?.role || "User"}</span>
              .
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = profile?.id || undefined;

  return (
    <ErrorBoundary
      category="AdminDashboard"
      userId={userId}
      fallbackTitle="Admin Console Error"
      fallbackMessage="An error occurred in the admin console. Please refresh the page or contact support."
      onRetry={() => window.location.reload()}
    >
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-sm transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                Admin <span className="text-slate-500">Portal</span>
              </span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                System
              </p>
              <button
                onClick={() => {
                  setActiveTab("prompts");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "prompts" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Settings className="w-4 h-4" />
                AI Prompts
              </button>
              <button
                onClick={() => {
                  setActiveTab("config");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "config" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Music className="w-4 h-4" />
                Configuration
              </button>
              <button
                onClick={() => {
                  setActiveTab("security");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "security" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Key className="w-4 h-4" />
                Security
              </button>
            </div>

            <div className="mt-6 space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Management
              </p>
              <button
                onClick={() => {
                  setActiveTab("users");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "users" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <UserCog className="w-4 h-4" />
                User Management
              </button>
              <button
                onClick={() => {
                  setActiveTab("practitioners");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "practitioners" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Users className="w-4 h-4" />
                Practitioners
              </button>
              <button
                onClick={() => {
                  setActiveTab("blog");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "blog" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <NotebookPen className="w-4 h-4" />
                CMS & Blog
              </button>
              <button
                onClick={() => {
                  setActiveTab("mobile");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "mobile" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile App
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 line-clamp-1">
                  {activeTab === "prompts" && "System Prompts"}
                  {activeTab === "config" && "System Configuration"}
                  {activeTab === "security" && "Security Settings"}
                  {activeTab === "users" && "User Management"}
                  {activeTab === "practitioners" && "Practitioner Directory"}
                  {activeTab === "blog" && "Content Management"}
                  {activeTab === "mobile" && "Mobile App Deployment"}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                  Sihat Medical Administration • v2.4.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
                onClick={() => window.open("/", "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open App
              </Button>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                <span className="text-xs font-bold">A</span>
              </div>
            </div>
          </header>

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto pb-20">
              {activeTab === "prompts" && (
                <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  <Card className="border-none shadow-md bg-white">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl pb-6">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCog className="w-5 h-5 text-white/90" />
                        AI Persona Configuration
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Define the baseline medical reasoning capability for the system.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap items-end gap-4 p-1">
                        <div className="space-y-2 flex-1 min-w-[200px]">
                          <Label className="text-slate-700 font-medium">Core Medical Engine</Label>
                          <Select
                            value={doctorLevel}
                            onValueChange={(v) =>
                              setDoctorLevel(v as keyof typeof DOCTOR_MODEL_MAPPING)
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Physician">
                                <div className="flex flex-col">
                                  <span className="font-medium">💊 Physician (Standard)</span>
                                  <span className="text-xs text-slate-500">
                                    gemini-2.0-flash • Fast response, general care
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Expert">
                                <div className="flex flex-col">
                                  <span className="font-medium">🩺 Expert (Advanced)</span>
                                  <span className="text-xs text-slate-500">
                                    gemini-2.5-pro • Deeper reasoning, complex cases
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Master">
                                <div className="flex flex-col">
                                  <span className="font-medium">👨‍⚕️ Master (Premium)</span>
                                  <span className="text-xs text-slate-500">
                                    gemini-3.0-preview • Highest accuracy, research grade
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleSaveConfig}
                          disabled={saving === "config"}
                          className="h-11 px-6 bg-slate-900 hover:bg-slate-800"
                        >
                          {saving === "config" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : saved === "config" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            "Save Configuration"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6 pt-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-slate-400" />
                      Prompt Pipeline
                    </h3>
                    {[
                      {
                        id: "1",
                        title: "Step 1: Patient Inquiry",
                        prompts: ["chat", "inquiry_summary"] as PromptType[],
                      },
                      {
                        id: "2",
                        title: "Step 2: AI Visual & Audio Analysis",
                        prompts: ["tongue", "face", "body", "listening"] as PromptType[],
                      },
                      {
                        id: "3",
                        title: "Step 3: Diagnosis Generation",
                        prompts: ["final"] as PromptType[],
                      },
                    ].map((group) => (
                      <div key={group.id} className="space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
                          {group.title}
                        </p>
                        <div className="grid gap-4">
                          {group.prompts.map((type) => {
                            const config = PROMPT_TYPES[type];
                            const Icon = config.icon;
                            const isExpanded = expandedPrompts[type];
                            return (
                              <Card
                                key={type}
                                className={`border border-slate-200 transition-all duration-300 ${isExpanded ? "ring-2 ring-slate-900 shadow-lg" : "hover:border-slate-300 hover:shadow-sm"}`}
                              >
                                <div
                                  className="p-5 flex items-center justify-between cursor-pointer"
                                  onClick={() => togglePrompt(type)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`p-2.5 rounded-lg ${isExpanded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}
                                    >
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900">
                                        {config.title}
                                      </h4>
                                      <p className="text-sm text-slate-500">{config.description}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-slate-400">
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </Button>
                                </div>
                                {isExpanded && (
                                  <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                                      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
                                        <code className="text-xs font-mono text-slate-500">
                                          {config.role}
                                        </code>
                                        {prompts[type] !== config.defaultPrompt && (
                                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                            CUSTOMIZED
                                          </span>
                                        )}
                                      </div>
                                      <Textarea
                                        value={prompts[type]}
                                        onChange={(e) =>
                                          setPrompts((prev) => ({
                                            ...prev,
                                            [type]: e.target.value,
                                          }))
                                        }
                                        className="min-h-[300px] border-0 focus-visible:ring-0 font-mono text-sm leading-relaxed bg-white rounded-none resize-y p-4"
                                      />
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleResetToDefault(type)}
                                        className="text-slate-500 hover:text-red-600"
                                      >
                                        Revert to Default
                                      </Button>
                                      <Button
                                        onClick={() => handleSavePrompt(type)}
                                        disabled={saving === type}
                                        className="bg-slate-900 hover:bg-slate-800"
                                      >
                                        {saving === type
                                          ? "Saving..."
                                          : saved === type
                                            ? "Saved!"
                                            : "Save Changes"}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "config" && (
                <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" /> Environment Ambience
                      </CardTitle>
                      <CardDescription>
                        Configure background audio for the waiting room experience.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="space-y-0.5">
                          <Label className="text-base">Background Music</Label>
                          <p className="text-sm text-slate-500">
                            Enable soothing audio for patients.
                          </p>
                        </div>
                        <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} />
                      </div>
                      <div className="space-y-3">
                        <Label>Audio Stream URL (MP3)</Label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={musicUrl}
                            onChange={(e) => setMusicUrl(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            placeholder="https://..."
                          />
                          <Button variant="outline" size="icon" onClick={handleTestMusic}>
                            {isTestPlaying ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label>Default Volume</Label>
                          <span className="text-sm text-slate-500">
                            {Math.round(musicVolume * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[musicVolume]}
                          max={1}
                          step={0.01}
                          onValueChange={(val) => setMusicVolume(val[0])}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end p-4">
                      <Button
                        onClick={handleSaveMusicConfig}
                        disabled={saving === "config_music"}
                        className="bg-slate-900"
                      >
                        {saving === "config_music" ? "Saving..." : "Save Audio Settings"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {activeTab === "security" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <SecuritySettings />
                </div>
              )}
              {activeTab === "users" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <UserManager />
                </div>
              )}
              {activeTab === "practitioners" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <PractitionerManager />
                </div>
              )}

              {activeTab === "blog" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50"></div>
                    <CardHeader className="text-center pb-8 pt-10 relative z-10">
                      <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center mb-6">
                        <NotebookPen className="w-8 h-8 text-indigo-600" />
                      </div>
                      <CardTitle className="text-3xl font-bold text-slate-900">
                        Content Management System
                      </CardTitle>
                      <CardDescription className="text-lg text-slate-600 max-w-lg mx-auto mt-2">
                        Manage your blog articles, translations, and media library in one visual
                        interface.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pb-12 relative z-10">
                      <Button
                        size="lg"
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 text-lg font-medium transition-transform hover:-translate-y-1"
                        onClick={() => window.open("/tina-admin/index.html", "_blank")}
                      >
                        Launch CMS Editor
                        <ExternalLink className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white/50">
                      <div className="p-6 text-center">
                        <h4 className="font-bold text-slate-900">Multi-language</h4>
                        <p className="text-xs text-slate-500 mt-1">EN, MS, ZH Support</p>
                      </div>
                      <div className="p-6 text-center">
                        <h4 className="font-bold text-slate-900">Visual Editing</h4>
                        <p className="text-xs text-slate-500 mt-1">Real-time Preview</p>
                      </div>
                      <div className="p-6 text-center">
                        <h4 className="font-bold text-slate-900">Media Library</h4>
                        <p className="text-xs text-slate-500 mt-1">Cloudinary Integration</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "mobile" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <Card className="border-emerald-100 shadow-lg bg-emerald-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-900">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Smartphone className="w-5 h-5 text-emerald-700" />
                        </div>
                        Android App Deployment
                      </CardTitle>
                      <CardDescription className="text-emerald-800/70">
                        Upload a new .apk build to update the direct download link on the landing
                        page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                          <Upload className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Upload APK File</h3>
                          <p className="text-sm text-slate-500 max-w-sm mt-1">
                            Select the <code>.apk</code> file from your computer. It will be
                            automatically renamed to <code>sihat-tcm.apk</code> and deployed to the
                            public server.
                          </p>
                        </div>

                        <input
                          type="file"
                          accept=".apk"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleApkUpload}
                        />

                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 shadow-lg min-w-[160px]"
                            disabled={uploadingApk}
                          >
                            {uploadingApk ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Select APK File
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => window.open("/sihat-tcm.apk", "_blank")}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Current
                          </Button>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                        <Info className="w-5 h-5 shrink-0 text-amber-600" />
                        <p>
                          <strong>Note:</strong> We strictly maintain a single version policy for
                          simplicity. Uploading a new file will immediately replace the existing{" "}
                          <code>sihat-tcm.apk</code>. Please ensure you are uploading the correct
                          build (Production/Preview).
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* AI Assistant Floating Action Button */}
        <AdminAIChatbot />
      </div>
    </ErrorBoundary>
  );
}

// Placeholder component for alerts
function SystemAlerts() {
  return (
    <Card className="mt-8 border-l-4 border-l-amber-500 border-y-0 border-r-0 rounded-r-lg shadow-sm bg-amber-50/50">
      <div className="p-4 flex gap-4">
        <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">System Notice</h4>
          <p className="text-sm text-amber-800 mt-1">
            Any changes made to System Prompts will take effect immediately for all new consult
            sessions. Please test changes rigorously in the{" "}
            <span
              className="underline cursor-pointer font-medium"
              onClick={() => window.open("/test-runner", "_blank")}
            >
              Test Runner
            </span>{" "}
            before deploying to production.
          </p>
        </div>
      </div>
    </Card>
  );
}
