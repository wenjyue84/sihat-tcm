"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

const GEMINI_MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview (Master)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Expert)" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Physician)" },
];

export default function TestImagePage() {
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to JPEG to avoid unsupported formats like AVIF
      const img = new window.Image();
      const reader = new FileReader();
      reader.onloadend = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          setImage(jpegDataUrl);
          setResult(null);
          setError(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRead = async () => {
    if (!image) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/test-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, model: selectedModel }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">Gemini Image Analysis Test</h1>
        <p className="text-stone-600 mb-8">Compare how different Gemini models analyze images</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <Card className="p-6 space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Select Gemini Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {GEMINI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <div
                className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img src={image} alt="Uploaded" className="max-h-48 mx-auto rounded" />
                ) : (
                  <div className="text-stone-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>Click to upload an image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Read Button */}
            <Button
              onClick={handleRead}
              disabled={!image || isLoading}
              className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Read Image
                </>
              )}
            </Button>
          </Card>

          {/* Right: Results */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-emerald-800 mb-4">Analysis Result</h2>

            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result ? (
              <div className="space-y-4">
                <div className="bg-stone-100 p-3 rounded-lg text-sm">
                  <strong>Model:</strong> {result.model}
                  <br />
                  <strong>Duration:</strong> {result.duration}ms
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h3 className="font-medium text-emerald-900 mb-2">Observation</h3>
                  <p className="text-emerald-800 whitespace-pre-wrap">
                    {result.observation || "No observation returned"}
                  </p>
                </div>

                {result.potential_issues?.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-medium text-amber-900 mb-2">Potential Issues</h3>
                    <ul className="list-disc list-inside text-amber-800">
                      {result.potential_issues.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <details className="bg-stone-50 p-4 rounded-lg">
                  <summary className="cursor-pointer text-stone-600">View Raw Response</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-white rounded">
                    {result.raw}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-stone-500 text-center py-12">
                Upload an image and click "Read Image" to see the analysis
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
