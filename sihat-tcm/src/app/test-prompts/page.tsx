"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Eye,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
  duration?: number;
}

export default function TestPromptsPage() {
  // Chat test state
  const [chatMessage, setChatMessage] = useState(
    "I have been experiencing headaches for the past week"
  );
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<TestResult | null>(null);
  const [chatExpanded, setChatExpanded] = useState(true);

  // Image test state
  const [imageType, setImageType] = useState<"tongue" | "face" | "other">("tongue");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<TestResult | null>(null);
  const [imageExpanded, setImageExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Final analysis test state
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<TestResult | null>(null);
  const [finalExpanded, setFinalExpanded] = useState(true);

  // Test Interactive Chat
  const testChat = async () => {
    setChatLoading(true);
    setChatResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: chatMessage }],
          basicInfo: {
            name: "Test Patient",
            age: 35,
            gender: "Male",
            height: 170,
            weight: 70,
            symptoms: chatMessage,
            symptomDuration: "1 week",
          },
          model: "gemini-1.5-pro",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      setChatResult({
        success: true,
        response: fullResponse,
        duration: Date.now() - startTime,
      });
    } catch (error: any) {
      setChatResult({
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      });
    } finally {
      setChatLoading(false);
    }
  };

  // Test Image Analysis
  const testImageAnalysis = async () => {
    if (!imageData) {
      setImageResult({
        success: false,
        error: "Please select an image first",
      });
      return;
    }

    setImageLoading(true);
    setImageResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          type: imageType,
        }),
      });

      const data = await response.json();

      if (data.observation) {
        setChatResult(null); // Clear chat result to avoid confusion
        setImageResult({
          success: true,
          response: JSON.stringify(data, null, 2),
          duration: Date.now() - startTime,
        });
      } else {
        throw new Error(data.error || "No observation returned");
      }
    } catch (error: any) {
      setImageResult({
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      });
    } finally {
      setImageLoading(false);
    }
  };

  // Test Final Analysis
  const testFinalAnalysis = async () => {
    setFinalLoading(true);
    setFinalResult(null);
    const startTime = Date.now();

    try {
      // Create comprehensive mock data
      const mockData = {
        basic_info: {
          name: "Test Patient",
          age: 45,
          gender: "Female",
          height: 160,
          weight: 58,
          symptoms: "Fatigue, poor appetite, and occasional dizziness for the past 2 months",
          symptomDuration: "2 months",
        },
        wen_chat: {
          chat: [
            { role: "user", content: "I feel tired all the time, especially in the afternoon" },
            {
              role: "assistant",
              content:
                "I understand you experience fatigue. Is the tiredness worse after eating meals?",
            },
            { role: "user", content: "Yes, I feel very sleepy after lunch" },
            {
              role: "assistant",
              content: "Do you experience any bloating or discomfort in your stomach area?",
            },
            { role: "user", content: "Yes, often bloated and my stool is sometimes loose" },
            { role: "assistant", content: "How would you describe your appetite recently?" },
            { role: "user", content: "Poor, I don't feel hungry even when I haven't eaten" },
            {
              role: "assistant",
              content: "Do you tend to feel cold, especially in your hands and feet?",
            },
            { role: "user", content: "Yes, my hands and feet are always cold" },
          ],
        },
        wang_tongue: {
          observation:
            "Pale, swollen tongue body with teeth marks on the edges. Thin white coating. The tongue appears moist.",
          potential_issues: ["Spleen Qi deficiency", "Yang deficiency", "Dampness"],
        },
        wang_face: {
          observation:
            "Sallow yellowish complexion with slightly puffy appearance. Mild dark circles under eyes. Dull luster.",
          potential_issues: ["Spleen deficiency", "Blood deficiency"],
        },
        qie: {
          bpm: 62,
        },
      };

      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: mockData,
          prompt: "Please provide a comprehensive TCM diagnosis",
          model: "gemini-1.5-pro",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      setFinalResult({
        success: true,
        response: fullResponse,
        duration: Date.now() - startTime,
      });
    } catch (error: any) {
      setFinalResult({
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      });
    } finally {
      setFinalLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Result display component
  const ResultDisplay = ({ result, loading }: { result: TestResult | null; loading: boolean }) => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-blue-600 p-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing... Please wait</span>
        </div>
      );
    }

    if (!result) return null;

    return (
      <div
        className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span
            className={result.success ? "text-green-700 font-medium" : "text-red-700 font-medium"}
          >
            {result.success ? "Success" : "Error"}
          </span>
          {result.duration && (
            <span className="text-gray-500 text-sm ml-auto">
              ({(result.duration / 1000).toFixed(2)}s)
            </span>
          )}
        </div>
        <div className="mt-2 max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-3 rounded border">
            {result.success ? result.response : result.error}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 TCM Prompt Test Lab</h1>
        <p className="text-gray-600">
          Test all three COStar-based system prompts to ensure they work correctly with the AI.
        </p>
      </div>

      {/* Test 1: Interactive Chat */}
      <Card className="mb-6 border-2 border-blue-200">
        <CardHeader
          className="bg-blue-50 cursor-pointer"
          onClick={() => setChatExpanded(!chatExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Test 1: 问诊 Interactive Chat Prompt</CardTitle>
                <CardDescription>Tests the patient inquiry conversation flow</CardDescription>
              </div>
            </div>
            {chatExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {chatExpanded && (
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Patient's Chief Complaint (Test Message)</Label>
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Describe symptoms..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Try different languages: English, Chinese (中文), or Malay
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={testChat}
                disabled={chatLoading || !chatMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {chatLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" /> Test Chat Prompt
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setChatResult(null)} disabled={chatLoading}>
                <RefreshCw className="w-4 h-4 mr-2" /> Clear
              </Button>
            </div>

            <ResultDisplay result={chatResult} loading={chatLoading} />
          </CardContent>
        )}
      </Card>

      {/* Test 2: Image Analysis */}
      <Card className="mb-6 border-2 border-emerald-200">
        <CardHeader
          className="bg-emerald-50 cursor-pointer"
          onClick={() => setImageExpanded(!imageExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-emerald-600" />
              <div>
                <CardTitle>Test 2: 望诊 Image Analysis Prompt</CardTitle>
                <CardDescription>Tests tongue, face, and body image analysis</CardDescription>
              </div>
            </div>
            {imageExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {imageExpanded && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image Type</Label>
                <div className="flex gap-2">
                  {(["tongue", "face", "other"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={imageType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setImageType(type)}
                      className={imageType === type ? "bg-emerald-600" : ""}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Test Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" /> Select Image
                  </Button>
                  {imageData && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Image loaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {imageData && (
              <div className="flex justify-center">
                <img
                  src={imageData}
                  alt="Test image preview"
                  className="max-h-48 rounded-lg border shadow-sm"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={testImageAnalysis}
                disabled={imageLoading || !imageData}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {imageLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Test Image Analysis
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImageResult(null);
                  setImageData(null);
                }}
                disabled={imageLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Clear
              </Button>
            </div>

            <ResultDisplay result={imageResult} loading={imageLoading} />
          </CardContent>
        )}
      </Card>

      {/* Test 3: Final Analysis */}
      <Card className="mb-6 border-2 border-amber-200">
        <CardHeader
          className="bg-amber-50 cursor-pointer"
          onClick={() => setFinalExpanded(!finalExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-600" />
              <div>
                <CardTitle>Test 3: 综合诊断 Final Analysis Prompt</CardTitle>
                <CardDescription>Tests comprehensive diagnosis synthesis</CardDescription>
              </div>
            </div>
            {finalExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {finalExpanded && (
          <CardContent className="pt-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Mock Patient Data for Testing:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>45-year-old female with fatigue, poor appetite, dizziness</li>
                <li>Symptoms for 2 months, worse after meals</li>
                <li>Cold hands/feet, loose stool, bloating</li>
                <li>Pale, swollen tongue with teeth marks</li>
                <li>Sallow complexion with puffy appearance</li>
                <li>Pulse: 62 BPM</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={testFinalAnalysis}
                disabled={finalLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {finalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" /> Test Final Analysis
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFinalResult(null)}
                disabled={finalLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Clear
              </Button>
            </div>

            <ResultDisplay result={finalResult} loading={finalLoading} />
          </CardContent>
        )}
      </Card>

      {/* Summary Section */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">📋 COStar Prompt Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">C</span>ontext - Background info
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">O</span>bjective - The goal
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">S</span>tyle - Writing style
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">T</span>one - Emotional quality
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">A</span>udience - Target users
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-bold text-blue-600">R</span>esponse - Output format
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
