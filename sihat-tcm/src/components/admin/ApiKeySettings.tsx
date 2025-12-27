"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Key,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  CheckCircle2,
} from "lucide-react";

interface ApiKeyStatus {
  hasCustomKey: boolean;
  keyPreview: string;
}

export function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      setStatus({
        hasCustomKey: !!data.geminiApiKey,
        keyPreview: data.geminiApiKey
          ? `${data.geminiApiKey.substring(0, 8)}...${data.geminiApiKey.slice(-4)}`
          : "",
      });
    } catch (error) {
      console.error("Error fetching API key status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    // If input is empty but we have a saved key, test the saved key
    const keyToTest = apiKey.trim() || (status?.hasCustomKey ? "USE_SAVED_KEY" : "");

    if (!keyToTest) {
      setTestResult({ success: false, message: "Please enter an API key to test" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: keyToTest === "USE_SAVED_KEY" ? undefined : keyToTest,
          useSavedKey: keyToTest === "USE_SAVED_KEY",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTestResult({ success: true, message: data.message || "API key is valid!" });
      } else {
        setTestResult({ success: false, message: data.error || "Failed to validate API key" });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setSaveResult({ success: false, message: "Please enter an API key to save" });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: apiKey.trim() }),
      });

      if (res.ok) {
        setSaveResult({ success: true, message: "API key saved successfully!" });
        setApiKey("");
        await fetchStatus();
        setTimeout(() => setSaveResult(null), 3000);
      } else {
        const data = await res.json();
        setSaveResult({ success: false, message: data.error || "Failed to save API key" });
      }
    } catch (error) {
      setSaveResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleClearKey = async () => {
    if (
      !confirm(
        "Are you sure you want to remove the custom API key? The system will fall back to using the environment variable."
      )
    ) {
      return;
    }

    setClearing(true);
    setSaveResult(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: null }),
      });

      if (res.ok) {
        setSaveResult({ success: true, message: "API key removed. Using environment variable." });
        await fetchStatus();
        setTimeout(() => setSaveResult(null), 3000);
      } else {
        const data = await res.json();
        setSaveResult({ success: false, message: data.error || "Failed to remove API key" });
      }
    } catch (error) {
      setSaveResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className={status?.hasCustomKey ? "border-green-200" : "border-blue-200"}>
        <CardHeader className={status?.hasCustomKey ? "bg-green-50" : "bg-blue-50"}>
          <CardTitle className="flex items-center gap-2">
            {status?.hasCustomKey ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-700">Custom API Key Active</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700">Using Environment Variable</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status?.hasCustomKey
              ? `Currently using custom key: ${status.keyPreview}`
              : "Currently using GOOGLE_GENERATIVE_AI_API_KEY from environment"}
          </CardDescription>
        </CardHeader>
        {status?.hasCustomKey && (
          <CardContent className="pt-4">
            <Button
              variant="outline"
              onClick={handleClearKey}
              disabled={clearing}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {clearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Custom Key
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Set New API Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {status?.hasCustomKey ? "Update API Key" : "Set Custom API Key"}
          </CardTitle>
          <CardDescription>
            Enter your Gemini API key. You can get one from the{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testResult.message}
            </div>
          )}

          {/* Save Result */}
          {saveResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                saveResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {saveResult.success ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {saveResult.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTestKey}
              disabled={testing || (!apiKey.trim() && !status?.hasCustomKey)}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...
                </>
              ) : apiKey.trim() ? (
                "Test Key"
              ) : status?.hasCustomKey ? (
                "Test Saved Key"
              ) : (
                "Test Key"
              )}
            </Button>
            <Button
              onClick={handleSaveKey}
              disabled={saving || !apiKey.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Save Key
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Security Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>The API key is stored server-side and never exposed to the browser</li>
                <li>Only administrators can view or modify the API key</li>
                <li>Test your key before saving to ensure it works</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
