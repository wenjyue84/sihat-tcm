import { useState } from "react";

export function useEnvTests() {
  const [envTestStatus, setEnvTestStatus] = useState<{
    [key: string]: "idle" | "testing" | "success" | "error";
  }>({});
  const [envTestMessage, setEnvTestMessage] = useState<{ [key: string]: string }>({});

  const testEnvVariable = async (key: string) => {
    setEnvTestStatus((prev) => ({ ...prev, [key]: "testing" }));
    setEnvTestMessage((prev) => ({ ...prev, [key]: "" }));

    try {
      let success = false;
      let message = "";

      switch (key) {
        case "NEXT_PUBLIC_SUPABASE_URL":
          // Test Supabase connection
          const dbRes = await fetch("/api/admin/db-status");
          const dbData = await dbRes.json();
          success = dbRes.ok && dbData.status === "connected";
          message = success
            ? `Connected (${dbData.tables?.length || 0} tables)`
            : "Connection failed";
          break;

        case "NEXT_PUBLIC_APP_URL":
          // Test if app is reachable
          const appRes = await fetch("/api/health", { method: "GET" });
          success = appRes.ok;
          message = success ? "App is reachable" : "App unreachable";
          break;

        case "GEMINI_API_KEY":
          // Test Gemini API
          const aiRes = await fetch("/api/test-gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testMode: true }),
          });
          const aiData = await aiRes.json();
          success = aiRes.ok && aiData.success;
          message = success ? "Gemini API working" : aiData.error || "API test failed";
          break;

        case "NODE_ENV":
          // Just show environment info
          success = true;
          message = "Environment detected";
          break;

        default:
          success = false;
          message = "No test available";
      }

      setEnvTestStatus((prev) => ({ ...prev, [key]: success ? "success" : "error" }));
      setEnvTestMessage((prev) => ({ ...prev, [key]: message }));
    } catch (error) {
      setEnvTestStatus((prev) => ({ ...prev, [key]: "error" }));
      setEnvTestMessage((prev) => ({
        ...prev,
        [key]: error instanceof Error ? error.message : "Test failed",
      }));
    }
  };

  return {
    envTestStatus,
    envTestMessage,
    testEnvVariable,
  };
}
