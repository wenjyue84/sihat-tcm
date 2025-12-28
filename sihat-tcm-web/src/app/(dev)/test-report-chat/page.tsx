"use client";

import { useState } from "react";

// Test models based on what should be available
const TEST_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Physician)" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Physician Alternative)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Expert)" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash Exp" },
];

// Mock report data for testing
const MOCK_REPORT_DATA = {
  diagnosis: {
    primary_pattern: "Spleen Qi Deficiency (脾气虚)",
    secondary_patterns: ["Dampness Accumulation", "Blood Stasis"],
    affected_organs: ["Spleen", "Stomach", "Liver"],
  },
  constitution: {
    type: "Qi Deficiency Constitution (气虚质)",
    description: "Characterized by fatigue, weak digestion, and tendency to catch colds",
  },
  analysis: {
    summary:
      "Patient presents with classic signs of Spleen Qi deficiency with dampness accumulation",
    pattern_rationale:
      "Fatigue, poor appetite, loose stools, and tongue with teeth marks indicate weak Spleen Qi",
  },
  recommendations: {
    food_therapy: {
      beneficial: ["Ginger", "Chinese yam", "Rice congee", "Pumpkin", "Sweet potato"],
      avoid: ["Cold drinks", "Raw vegetables", "Dairy products", "Greasy foods"],
    },
    lifestyle: ["Get adequate rest", "Avoid overthinking", "Gentle exercise like qigong"],
    acupoints: ["ST36 (Zusanli)", "SP6 (Sanyinjiao)", "CV12 (Zhongwan)"],
    exercise: ["Tai chi", "Walking", "Gentle stretching"],
  },
};

const MOCK_PATIENT_INFO = {
  name: "John Doe",
  age: "35",
  gender: "male",
  symptoms: "Feeling tired and dizzy for the past week",
};

export default function TestReportChatPage() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [question, setQuestion] = useState("What does my diagnosis mean?");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testReportChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");
    setStreamingText("");
    setLogs([]);

    addLog(`Starting test with model: ${selectedModel}`);
    addLog(`Question: ${question}`);

    try {
      addLog("Sending request to /api/report-chat...");

      const res = await fetch("/api/report-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          reportData: MOCK_REPORT_DATA,
          patientInfo: MOCK_PATIENT_INFO,
          language: "en",
          model: selectedModel,
        }),
      });

      addLog(`Response status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      addLog("Starting to read stream...");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          addLog("Stream complete!");
          break;
        }

        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);

        if (fullText.length % 100 === 0) {
          addLog(`Received ${fullText.length} characters...`);
        }
      }

      setResponse(fullText);
      addLog(`✅ SUCCESS! Total response: ${fullText.length} characters`);
    } catch (err: any) {
      addLog(`❌ ERROR: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAllModels = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setStreamingText("");
    setLogs([]);

    const results: { model: string; success: boolean; time: number; error?: string }[] = [];

    for (const model of TEST_MODELS) {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Testing ${model.id}...`]);
      const start = Date.now();

      try {
        const res = await fetch("/api/report-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Say hello" }],
            reportData: MOCK_REPORT_DATA,
            patientInfo: MOCK_PATIENT_INFO,
            language: "en",
            model: model.id,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error);
        }

        // Read entire response
        const reader = res.body?.getReader();
        let responseText = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          responseText += new TextDecoder().decode(value);
        }

        results.push({ model: model.id, success: true, time: Date.now() - start });
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ ${model.id}: SUCCESS (${Date.now() - start}ms) - Got ${responseText.length} chars`,
        ]);
      } catch (err: any) {
        results.push({
          model: model.id,
          success: false,
          time: Date.now() - start,
          error: err.message,
        });
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ ${model.id}: FAILED - ${err.message}`,
        ]);
      }
    }

    // Summary
    const successCount = results.filter((r) => r.success).length;
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ==== SUMMARY: ${successCount}/${results.length} models working ====`,
    ]);

    setLoading(false);
    return results;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-2 text-emerald-400">🧪 Report Chat Test Page</h1>
      <p className="text-gray-400 mb-6">
        Test the &quot;Ask About Your Report&quot; AI feature with different models
      </p>

      {/* Test Configuration */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-300">Test Configuration</h2>

        <form onSubmit={testReportChat} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {TEST_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "⏳ Testing..." : "🚀 Test Model"}
            </button>
            <button
              type="button"
              onClick={testAllModels}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              🔬 Test All Models
            </button>
          </div>
        </form>
      </div>

      {/* Mock Data Preview */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-300">
          📋 Mock Report Data Being Used
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-200 mb-2">Patient Info</h3>
            <p>
              <span className="text-gray-400">Name:</span> {MOCK_PATIENT_INFO.name}
            </p>
            <p>
              <span className="text-gray-400">Age:</span> {MOCK_PATIENT_INFO.age}
            </p>
            <p>
              <span className="text-gray-400">Gender:</span> {MOCK_PATIENT_INFO.gender}
            </p>
            <p>
              <span className="text-gray-400">Chief Complaint:</span> {MOCK_PATIENT_INFO.symptoms}
            </p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-200 mb-2">Diagnosis</h3>
            <p>
              <span className="text-gray-400">Primary Pattern:</span>{" "}
              {MOCK_REPORT_DATA.diagnosis.primary_pattern}
            </p>
            <p>
              <span className="text-gray-400">Constitution:</span>{" "}
              {MOCK_REPORT_DATA.constitution.type}
            </p>
          </div>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-emerald-300">📊 Request Logs</h2>
          <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-60 overflow-y-auto">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`${log.includes("ERROR") ? "text-red-400" : log.includes("SUCCESS") ? "text-green-400" : "text-gray-300"}`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 rounded-xl p-6 mb-6 border border-red-700">
          <h2 className="text-xl font-semibold mb-2 text-red-300">❌ Error</h2>
          <pre className="text-red-200 font-mono text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Streaming Response */}
      {streamingText && loading && (
        <div className="bg-blue-900/50 rounded-xl p-6 mb-6 border border-blue-700">
          <h2 className="text-xl font-semibold mb-2 text-blue-300">📡 Streaming Response...</h2>
          <pre className="text-blue-200 font-mono text-sm whitespace-pre-wrap">{streamingText}</pre>
        </div>
      )}

      {/* Final Response */}
      {response && !loading && (
        <div className="bg-emerald-900/50 rounded-xl p-6 mb-6 border border-emerald-700">
          <h2 className="text-xl font-semibold mb-2 text-emerald-300">✅ AI Response</h2>
          <div className="text-gray-200 whitespace-pre-wrap">{response}</div>
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-300">📚 Model Reference</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <strong className="text-emerald-200">gemini-2.0-flash</strong> - Latest, fast, agentic
            capabilities (Dec 2024)
          </p>
          <p>
            <strong className="text-emerald-200">gemini-2.5-flash</strong> - Enhanced flash model
            with better reasoning
          </p>
          <p>
            <strong className="text-emerald-200">gemini-2.5-pro</strong> - Most advanced, best for
            complex reasoning
          </p>
          <p className="text-yellow-400 mt-4">
            💡 The chatbot should use the model selected by the patient via DoctorLevel
          </p>
        </div>
      </div>
    </div>
  );
}
