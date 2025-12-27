"use client";

import { useState } from "react";

const AVAILABLE_MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview (Master)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Expert)" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Physician)" },
];

type Step = {
  name: string;
  status: "pending" | "running" | "done" | "error";
  time?: number;
  message?: string;
};

export default function TestGeminiPage() {
  const [prompt, setPrompt] = useState("Tell me a joke about TCM.");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const updateStep = (index: number, updates: Partial<Step>) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...updates } : step)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");
    setResponseTime(null);

    // Initialize steps
    const initialSteps: Step[] = [
      { name: "1. Preparing request", status: "pending" },
      { name: "2. Sending to API route", status: "pending" },
      { name: "3. API checking env vars", status: "pending" },
      { name: "4. Calling Gemini API", status: "pending" },
      { name: "5. Waiting for response", status: "pending" },
      { name: "6. Processing response", status: "pending" },
    ];
    setSteps(initialSteps);

    const stepStart = Date.now();

    try {
      // Step 1: Preparing request
      updateStep(0, { status: "running" });
      await new Promise((r) => setTimeout(r, 100)); // Small delay for visibility
      updateStep(0, { status: "done", time: Date.now() - stepStart });

      // Step 2: Sending to API
      const step2Start = Date.now();
      updateStep(1, { status: "running" });

      const fetchPromise = fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });

      updateStep(1, { status: "done", time: Date.now() - step2Start });

      // Step 3-5 happen on server side, we mark them as running
      updateStep(2, { status: "running", message: "Server checking API key..." });
      updateStep(3, { status: "pending" });
      updateStep(4, { status: "pending" });

      const res = await fetchPromise;

      // Once we get response headers, we know steps 2-4 completed on server
      updateStep(2, { status: "done" });
      updateStep(3, { status: "done" });
      updateStep(4, { status: "done" });

      // Step 6: Processing response
      const step6Start = Date.now();
      updateStep(5, { status: "running" });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch");
      }

      const data = await res.json();
      updateStep(5, { status: "done", time: Date.now() - step6Start });

      setResponse(data.result);
      setResponseTime(data.durationMs);
    } catch (err: any) {
      setError(err.message);
      // Mark current running step as error
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "running" ? { ...step, status: "error", message: err.message } : step
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Step["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "done":
        return "✅";
      case "error":
        return "❌";
    }
  };

  const getStatusColor = (status: Step["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-400";
      case "running":
        return "text-blue-600 animate-pulse";
      case "done":
        return "text-green-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gemini API Test</h1>
      <p className="text-sm text-gray-500 mb-4">
        Test different Gemini models to see which ones work with your API key.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border rounded text-black bg-white"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded text-black"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? "Testing..." : `Test ${selectedModel}`}
        </button>
      </form>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-bold text-white mb-3">📊 Request Progress:</h3>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center gap-2 ${getStatusColor(step.status)}`}>
                <span className="text-lg">{getStatusIcon(step.status)}</span>
                <span className="font-mono text-sm">{step.name}</span>
                {step.time && <span className="text-xs text-gray-400">({step.time}ms)</span>}
                {step.message && step.status === "error" && (
                  <span className="text-xs text-red-400 ml-2">- {step.message}</span>
                )}
                {step.status === "running" && (
                  <span className="text-xs text-blue-400 ml-2">← Currently here</span>
                )}
              </div>
            ))}
          </div>
          {loading && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-yellow-400 text-sm animate-pulse">
                ⏱️ Elapsed: {Math.floor((Date.now() - Date.now()) / 1000)}s... (Gemini models can
                take 10-60 seconds)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">
          <p className="font-bold">❌ Error with {selectedModel}:</p>
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-50 rounded border border-green-300">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-green-800">✅ Response from {selectedModel}:</p>
            {responseTime && (
              <span className="text-sm text-green-600 font-mono">{responseTime}ms</span>
            )}
          </div>
          <pre className="whitespace-pre-wrap text-black text-sm">{response}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold text-black mb-2">Model Quick Reference:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            <strong>Gemini 3 Pro Preview</strong> - Latest (Nov 2025), most advanced
          </li>
          <li>
            <strong>Gemini 2.5 Pro/Flash</strong> - Advanced reasoning, thinking models
          </li>
          <li>
            <strong>Gemini 2.0 Flash</strong> - Fast, agentic capabilities
          </li>
          <li>
            <strong>Gemini 1.5 Pro/Flash</strong> - Stable, large context window
          </li>
        </ul>
      </div>
    </div>
  );
}
