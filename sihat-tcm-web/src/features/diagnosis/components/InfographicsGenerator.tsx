"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  X,
  Download,
  Loader2,
  Sparkles,
  Palette,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Utensils,
  Leaf,
  Activity,
  Dumbbell,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/stores/useAppStore";

interface InfographicsGeneratorProps {
  reportData: any;
  patientInfo?: any;
  isOpen: boolean;
  onClose: () => void;
}

type InfographicStyle = "modern" | "traditional" | "minimal" | "colorful";

const styleOptions: {
  id: InfographicStyle;
  name: string;
  description: string;
  colors: string[];
}[] = [
    {
      id: "modern",
      name: "Modern",
      description: "Clean, professional design",
      colors: ["#10b981", "#3b82f6", "#f8fafc"],
    },
    {
      id: "traditional",
      name: "Traditional",
      description: "Classic TCM aesthetic",
      colors: ["#7c3aed", "#dc2626", "#fef3c7"],
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Simple, elegant look",
      colors: ["#1f2937", "#6b7280", "#ffffff"],
    },
    {
      id: "colorful",
      name: "Colorful",
      description: "Vibrant and engaging",
      colors: ["#f43f5e", "#8b5cf6", "#06b6d4"],
    },
  ];

const translations = {
  en: {
    title: "Create Infographics",
    subtitle: "Transform your report into visual content",
    selectStyle: "Select Style",
    generating: "Generating your infographic...",
    download: "Download",
    generate: "Generate Infographic",
    preview: "Preview",
    close: "Close",
    success: "Infographic Generated!",
    error: "Generation failed. Please try again.",
    tip: "Tip: Infographics are great for sharing health insights with family!",
    selectContent: "Select Content",
    content: {
      diagnosis: "Diagnosis & Constitution",
      dietary: "Dietary Advice",
      lifestyle: "Lifestyle Tips",
      acupoints: "Acupressure Points",
      exercise: "Exercise",
      metrics: "Health Metrics",
    },
  },
  zh: {
    title: "创建信息图",
    subtitle: "将您的报告转换为视觉内容",
    selectStyle: "选择风格",
    generating: "正在生成您的信息图...",
    download: "下载",
    generate: "生成信息图",
    preview: "预览",
    close: "关闭",
    success: "信息图已生成！",
    error: "生成失败，请重试。",
    tip: "提示：信息图非常适合与家人分享健康知识！",
    selectContent: "选择内容",
    content: {
      diagnosis: "诊断与体质",
      dietary: "饮食建议",
      lifestyle: "生活方式",
      acupoints: "穴位按摩",
      exercise: "运动建议",
      metrics: "健康指标",
    },
  },
  ms: {
    title: "Cipta Infografik",
    subtitle: "Ubah laporan anda kepada kandungan visual",
    selectStyle: "Pilih Gaya",
    generating: "Menjana infografik anda...",
    download: "Muat Turun",
    generate: "Jana Infografik",
    preview: "Pratonton",
    close: "Tutup",
    success: "Infografik Dijana!",
    error: "Penjanaan gagal. Sila cuba lagi.",
    tip: "Petua: Infografik bagus untuk berkongsi maklumat kesihatan dengan keluarga!",
    selectContent: "Pilih Kandungan",
    content: {
      diagnosis: "Diagnosis & Perlembagaan",
      dietary: "Nasihat Pemakanan",
      lifestyle: "Tips Gaya Hidup",
      acupoints: "Titik Akupresur",
      exercise: "Senaman",
      metrics: "Metrik Kesihatan",
    },
  },
};

export function InfographicsGenerator({
  reportData,
  patientInfo,
  isOpen,
  onClose,
}: InfographicsGeneratorProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [selectedStyle, setSelectedStyle] = useState<InfographicStyle>("modern");
  const [selectedContent, setSelectedContent] = useState({
    diagnosis: true,
    dietary: true,
    lifestyle: true,
    acupoints: false,
    exercise: false,
    metrics: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build the prompt for infographic generation
      const prompt = buildInfographicPrompt(
        reportData,
        patientInfo,
        selectedStyle,
        selectedContent
      );

      const response = await fetch("/api/generate-infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          reportData,
          patientInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate infographic");
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
    } catch (err) {
      console.error("Infographic generation error:", err);
      setError(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    const filename = `tcm-infographic-${new Date().toISOString().split("T")[0]}.png`;

    try {
      // Check if it's an SVG data URL - convert to PNG for better mobile compatibility
      if (generatedImage.startsWith("data:image/svg+xml")) {
        // Create an image from the SVG
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = generatedImage;
        });

        // Create canvas and draw the image
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 800;
        canvas.height = img.height || 1000;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Fill white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Convert to PNG blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create object URL for better mobile support
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = filename;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                }, 100);
              }
            },
            "image/png",
            0.95
          );
        }
      } else {
        // For other image formats (PNG, JPEG), convert data URL to blob
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab for user to save manually
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
                    <html>
                        <head><title>TCM Infographic</title></head>
                        <body style="margin:0;display:flex;justify-content:center;background:#f5f5f5;">
                            <img src="${generatedImage}" alt="TCM Infographic" style="max-width:100%;height:auto;"/>
                        </body>
                    </html>
                `);
        newWindow.document.close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start md:items-center justify-center pt-0 md:pt-4 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t.title}</h2>
                <p className="text-violet-200 text-sm">{t.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!generatedImage ? (
              <>
                {/* Style Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t.selectStyle}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {styleOptions.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left min-h-[72px] active:scale-[0.98] ${selectedStyle === style.id
                            ? "border-violet-500 bg-violet-50"
                            : "border-stone-200 hover:border-stone-300 active:bg-stone-50 bg-white"
                          }`}
                      >
                        {selectedStyle === style.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex gap-1.5 mb-2">
                          {style.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full border border-stone-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <p className="font-medium text-stone-800">{style.name}</p>
                        <p className="text-xs text-stone-500">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t.selectContent}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, diagnosis: !prev.diagnosis }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.diagnosis ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.diagnosis ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.diagnosis && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.diagnosis}</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, dietary: !prev.dietary }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.dietary ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.dietary ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.dietary && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.dietary}</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, lifestyle: !prev.lifestyle }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.lifestyle ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.lifestyle ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.lifestyle && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.lifestyle}</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, acupoints: !prev.acupoints }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.acupoints ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.acupoints ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.acupoints && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.acupoints}</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, exercise: !prev.exercise }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.exercise ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.exercise ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.exercise && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.exercise}</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedContent((prev) => ({ ...prev, metrics: !prev.metrics }))
                      }
                      className={`p-3 min-h-[48px] rounded-xl border transition-all text-left flex items-center gap-3 active:scale-[0.98] ${selectedContent.metrics ? "border-violet-500 bg-violet-50 text-violet-700" : "border-stone-200 hover:border-stone-300 active:bg-stone-50 text-stone-600"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${selectedContent.metrics ? "bg-violet-500 border-violet-500" : "border-stone-300 bg-white"}`}
                      >
                        {selectedContent.metrics && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{t.content.metrics}</span>
                    </button>
                  </div>
                </div>

                {/* Preview Mockup */}
                <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl p-6">
                  <div className="aspect-[4/3] bg-white rounded-lg shadow-lg flex items-center justify-center border border-stone-200">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-400 text-sm">{t.preview}</p>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-violet-700 text-sm flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    {t.tip}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Generated Image */}
                <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl p-4">
                  <img
                    src={generatedImage}
                    alt="Generated Infographic"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">{t.success}</p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} className="px-4">
              {t.close}
            </Button>
            {generatedImage ? (
              <Button
                onClick={handleDownload}
                className="bg-violet-600 hover:bg-violet-700 px-6 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t.download}
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-violet-600 hover:bg-violet-700 px-6 flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t.generate}
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function buildInfographicPrompt(
  reportData: any,
  patientInfo: any,
  style: InfographicStyle,
  content: {
    diagnosis: boolean;
    dietary: boolean;
    lifestyle: boolean;
    acupoints: boolean;
    exercise: boolean;
    metrics: boolean;
  }
): string {
  // Extract key info for the infographic based on selection
  let contentParts = [];

  if (content.diagnosis) {
    const diagnosis =
      typeof reportData.diagnosis === "string"
        ? reportData.diagnosis
        : reportData.diagnosis?.primary_pattern || "TCM Diagnosis";

    const constitution =
      typeof reportData.constitution === "string"
        ? reportData.constitution
        : reportData.constitution?.type || "";

    contentParts.push(`Diagnosis: ${diagnosis}`);
    if (constitution) contentParts.push(`Constitution Type: ${constitution}`);
  }

  if (content.dietary) {
    const foods =
      reportData.recommendations?.food_therapy?.beneficial?.slice(0, 4) ||
      reportData.recommendations?.food?.slice(0, 4) ||
      [];
    if (foods.length > 0) contentParts.push(`Recommended Foods: ${foods.join(", ")}`);
  }

  if (content.lifestyle) {
    const lifestyle = reportData.recommendations?.lifestyle?.slice(0, 3) || [];
    if (lifestyle.length > 0) contentParts.push(`Lifestyle Tips: ${lifestyle.join("; ")}`);
  }

  if (content.acupoints) {
    const acupoints = reportData.recommendations?.acupoints?.slice(0, 3) || [];
    if (acupoints.length > 0) contentParts.push(`Acupressure Points: ${acupoints.join(", ")}`);
  }

  if (content.exercise) {
    const exercise = reportData.recommendations?.exercise?.slice(0, 3) || [];
    if (exercise.length > 0) contentParts.push(`Exercise: ${exercise.join("; ")}`);
  }

  if (content.metrics && patientInfo) {
    if (patientInfo.bmi) contentParts.push(`BMI: ${patientInfo.bmi}`);
    // Add other metrics if available in patientInfo or passed separately
  }

  const styleDescriptions: Record<InfographicStyle, string> = {
    modern:
      "modern, clean, minimalist with teal and blue gradients, professional healthcare design",
    traditional:
      "traditional Chinese medicine aesthetic with red and gold accents, ink brush style elements, ancient scroll inspired",
    minimal:
      "minimal, black and white with subtle gray accents, lots of whitespace, elegant typography",
    colorful:
      "vibrant, colorful, playful with multiple bright colors, engaging and friendly design",
  };

  return `Create a beautiful health infographic for a TCM (Traditional Chinese Medicine) diagnosis with ${styleDescriptions[style]} style.

Title: "Your TCM Health Summary"
${contentParts.join("\n")}

Design requirements:
- Clear visual hierarchy
- Professional medical infographic layout
- Include icons for different sections
- Show food recommendations with simple food illustrations (if included)
- Include a health balance meter or chart
- Add traditional Chinese medicine elements subtly
- Make it easy to read and understand
- Portrait orientation
- High quality, print-ready design`;
}
