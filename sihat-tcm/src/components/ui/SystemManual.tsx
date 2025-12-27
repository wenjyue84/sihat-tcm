"use client";

import React from "react";
import { useLanguage } from "@/stores/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle, Activity, Camera, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

export function SystemManual() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "How to use Sihat TCM",
      description: "A quick guide to our AI-powered diagnosis system",
      steps: [
        {
          title: "Tongue Analysis",
          description:
            "Capture a clear photo of your tongue in good lighting. Our AI analyzes the coating, color, and shape.",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Face Analysis",
          description:
            "Take a selfie of your face. We look for complexion and other facial indicators of your health.",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Health Questionnaire",
          description:
            "Answer a few simple questions about your lifestyle and symptoms to refine the diagnosis.",
          icon: <ClipboardList className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Get Your Report",
          description:
            "Receive a comprehensive TCM health report with personalized recommendations.",
          icon: <Activity className="w-5 h-5 text-emerald-600" />,
        },
      ],
    },
    zh: {
      title: "如何使用 Sihat TCM",
      description: "AI 智能中医诊断系统使用指南",
      steps: [
        {
          title: "舌诊分析",
          description: "在光线充足的地方拍摄您的舌头照片。我们的 AI 将分析舌苔、颜色和形状。",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "面诊分析",
          description: "拍摄您的面部照片。我们通过面色和其他面部特征分析您的健康状况。",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "健康问卷",
          description: "回答几个关于生活方式和症状的简单问题，以提高诊断准确性。",
          icon: <ClipboardList className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "获取报告",
          description: "获得一份包含个性化建议的完整中医健康报告。",
          icon: <Activity className="w-5 h-5 text-emerald-600" />,
        },
      ],
    },
    ms: {
      title: "Cara Menggunakan Sihat TCM",
      description: "Panduan pantas sistem diagnosis AI kami",
      steps: [
        {
          title: "Analisis Lidah",
          description:
            "Ambil gambar lidah yang jelas dalam pencahayaan yang baik. AI kami menganalisis lapisan, warna, dan bentuk.",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Analisis Muka",
          description:
            "Ambil swafoto muka anda. Kami melihat warna kulit dan penunjuk kesihatan muka yang lain.",
          icon: <Camera className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Soal Selidik Kesihatan",
          description:
            "Jawab beberapa soalan mudah mengenai gaya hidup dan gejala anda untuk memperhalusi diagnosis.",
          icon: <ClipboardList className="w-5 h-5 text-emerald-600" />,
        },
        {
          title: "Dapatkan Laporan",
          description:
            "Terima laporan kesihatan TCM yang komprehensif dengan cadangan yang diperibadikan.",
          icon: <Activity className="w-5 h-5 text-emerald-600" />,
        },
      ],
    },
  };

  const t = content[language] || content.en;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 sm:px-4 sm:py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-md transition-all text-stone-700 w-auto h-auto sm:hidden"
          title={t.title}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-stone-500">{t.description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {t.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100"
            >
              <div className="bg-white p-2 rounded-full shadow-sm border border-stone-100 shrink-0">
                {step.icon}
              </div>
              <div>
                <h4 className="font-semibold text-stone-800 text-sm">{step.title}</h4>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
