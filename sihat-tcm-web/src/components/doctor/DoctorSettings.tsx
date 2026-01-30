"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";
import {
  Globe,
  Check,
  Loader2,
  User,
  LogOut,
  Bell,
  Shield,
  Smartphone,
  Timer,
  Settings,
  Mail,
  Phone,
  Briefcase,
  Award,
  Languages,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function DoctorSettings() {
  const { user, profile, updatePreferences, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const { language, setLanguage, languageNames, t } = useLanguage();
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Preferences state
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [reviewReminders, setReviewReminders] = useState(true);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      setLoggingOut(false);
      toast.error("Failed to sign out");
    }
  };

  const handleLanguageChange = async (langCode: "en" | "zh" | "ms") => {
    if (language === langCode) return;
    setSavingLanguage(true);
    setLanguage(langCode);

    if (user) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ preferred_language: langCode })
          .eq("id", user.id);

        if (!error) {
          refreshProfile();
          toast.success("Language preference saved");
        } else {
          toast.error("Failed to save language preference");
        }
      } catch (err) {
        console.error("Error saving language:", err);
        toast.error("Failed to save language preference");
      }
    }
    setSavingLanguage(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-600" />
            Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage your account and practice settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your professional profile details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-900">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="text-sm font-medium text-slate-900">
                  License Number
                </Label>
                <Input
                  id="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="TCM-12345"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specializations" className="text-sm font-medium text-slate-900">
                  Specializations
                </Label>
                <Input
                  id="specializations"
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  placeholder="Acupuncture, Herbal Medicine, etc."
                  className="w-full"
                />
                <p className="text-xs text-slate-500">Separate multiple specializations with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications" className="text-sm font-medium text-slate-900">
                  Qualifications
                </Label>
                <Textarea
                  id="qualifications"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="List your qualifications and certifications"
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-slate-900">
                  Professional Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief professional biography"
                  rows={3}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Display Preferences
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Customize your interface appearance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-900">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light" as const, icon: Sun, label: "Light" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                    { value: "auto" as const, icon: Monitor, label: "Auto" },
                  ].map((themeOption) => {
                    const isSelected = theme === themeOption.value;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <themeOption.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{themeOption.label}</span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-amber-600" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Notification Settings
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage how you receive alerts and updates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    Enable Notifications
                  </Label>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Receive notifications about patient updates and system alerts
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={!notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    Critical Alerts
                  </Label>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Immediate notifications for critical patient cases
                  </p>
                </div>
                <Switch
                  checked={criticalAlerts}
                  onCheckedChange={setCriticalAlerts}
                  disabled={!notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    Review Reminders
                  </Label>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Reminders for pending report reviews
                  </p>
                </div>
                <Switch
                  checked={reviewReminders}
                  onCheckedChange={setReviewReminders}
                  disabled={!notificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Language Preference
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose your preferred language for the interface
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: "en" as const, flag: "🇬🇧", name: "English" },
                  { code: "zh" as const, flag: "🇨🇳", name: "中文" },
                  { code: "ms" as const, flag: "🇲🇾", name: "Bahasa" },
                ].map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      disabled={savingLanguage}
                      className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isActive
                          ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500 ring-offset-0"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-xl shrink-0">{lang.flag}</span>
                      <span className="font-medium text-sm">{lang.name}</span>
                      {isActive && (
                        <div className="ml-auto">
                          {savingLanguage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          ) : (
                            <Check className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Account & Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Account Information
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center p-4 border-b border-slate-50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {(profile?.full_name?.[0] || user?.email?.[0] || "D").toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {profile?.full_name || "Doctor"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                  <span className="text-xs text-slate-500">Account Type</span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full capitalize">
                    {profile?.role || "Doctor"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                  <span className="text-xs text-slate-500">Member Since</span>
                  <span className="text-xs font-medium text-slate-700">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            className="w-full border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-10"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}


