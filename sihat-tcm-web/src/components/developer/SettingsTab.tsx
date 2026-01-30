import { RefreshCw, CheckCircle2, Bug, PlayCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnvTests } from "@/hooks/useEnvTests";

export function SettingsTab() {
  const { envTestStatus, envTestMessage, testEnvVariable } = useEnvTests();

  const envVars = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: "https://***.supabase.co",
      testable: true,
    },
    { key: "NEXT_PUBLIC_APP_URL", value: "http://localhost:3000", testable: true },
    { key: "GEMINI_API_KEY", value: "************************", testable: true },
    { key: "NODE_ENV", value: "development", testable: true },
  ];

  const links = [
    { name: "Supabase Dashboard", url: "https://app.supabase.com" },
    { name: "Google AI Studio", url: "https://aistudio.google.com" },
    { name: "Vercel Deployment", url: "https://vercel.com" },
    { name: "Developer Manual", url: "/docs/dev" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <h2 className="text-xl font-bold text-white mb-6">System Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/[0.02] border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-base">Environment Variables</CardTitle>
            <CardDescription>
              Runtime configuration - Click the test button to verify connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {envVars.map((env, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-3 rounded-lg bg-black/20 border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-violet-400 font-bold tracking-wider">
                    {env.key}
                  </span>
                  {env.testable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 text-[10px] gap-1 rounded-full transition-all ${
                        envTestStatus[env.key] === "success"
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : envTestStatus[env.key] === "error"
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : envTestStatus[env.key] === "testing"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                      }`}
                      onClick={() => testEnvVariable(env.key)}
                      disabled={envTestStatus[env.key] === "testing"}
                    >
                      {envTestStatus[env.key] === "testing" ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Testing...
                        </>
                      ) : envTestStatus[env.key] === "success" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </>
                      ) : envTestStatus[env.key] === "error" ? (
                        <>
                          <Bug className="w-3 h-3" />
                          Failed
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3 h-3" />
                          Test
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-300">{env.value}</span>
                  {envTestMessage[env.key] && (
                    <span
                      className={`text-[10px] ${
                        envTestStatus[env.key] === "success"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {envTestMessage[env.key]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 text-white border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Documentation & Links</CardTitle>
            <CardDescription>External resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-violet-600/20 hover:border-violet-500/50 border border-white/5 transition-all group"
              >
                <span className="text-sm font-medium">{link.name}</span>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-violet-400" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



