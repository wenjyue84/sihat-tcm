"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Award, Brain, ScrollText, Database, Lock, CheckCircle2 } from "lucide-react";
import { subMonths, format } from "date-fns";

export function ModelCapabilitiesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Dynamic date: Previous month
  const [dateString] = useState(() => {
    return format(subMonths(new Date(), 1), "yyyy年MM月");
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slides = [
    // Slide 1: Branding & Intro
    {
      id: "branding",
      content: (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-emerald-800">思和AI</span>
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>互联网医院机构认证</span>
            </div>
          </div>

          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center my-2">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse" />
            <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 relative z-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-stone-800">思和AI中医大模型</h3>
            <p className="text-emerald-600 font-medium">专属于您的老中医</p>
          </div>
        </div>
      ),
    },
    // Slide 2: Stats & IP
    {
      id: "stats",
      content: (
        <div className="flex flex-col items-center text-center space-y-5 w-full">
          <div className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-amber-100">
            32项 发明专利 &nbsp;|&nbsp; 54项 知识产权
          </div>

          <div className="grid grid-cols-3 gap-2 w-full mt-2">
            <div className="flex flex-col items-center p-2 bg-stone-50 rounded-lg">
              <span className="text-lg sm:text-xl font-bold text-stone-800">109092</span>
              <span className="text-[10px] text-stone-500 mt-1">学习病种数 (个)</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-stone-50 rounded-lg">
              <span className="text-lg sm:text-xl font-bold text-stone-800">19283049</span>
              <span className="text-[10px] text-stone-500 mt-1">训练医案数 (次)</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-stone-50 rounded-lg">
              <span className="text-lg sm:text-xl font-bold text-stone-800">47878</span>
              <span className="text-[10px] text-stone-500 mt-1">古籍文献 (本)</span>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3: Certifications
    {
      id: "certs",
      content: (
        <div className="flex flex-col items-center text-center space-y-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            智慧中医 行业领先
          </h3>

          <div className="space-y-3 w-full">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-600 bg-stone-50 p-1.5 rounded">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                国家信息安全等级保护三级认证
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-600 bg-stone-50 p-1.5 rounded">
                <Lock className="w-3 h-3 text-emerald-600" />
                互联网信息服务算法备案资质
              </div>
            </div>

            <div className="text-[10px] text-stone-500 flex flex-wrap justify-center gap-2">
              <span>ISO27701认证</span> | <span>ISO27001认证</span> | <span>ISO9001认证</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {["国家级高新技术企业", "科技型中小企业", "创新型中小企业", "专精特新中小企业"].map(
                (tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 border border-emerald-100 text-emerald-700 bg-emerald-50 rounded"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-5 min-h-[220px] flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {slides[currentIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-center">
        <p className="text-[10px] text-stone-400">
          *图中数据基于截止{dateString}AI模型的训练和应用情况统计
        </p>
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-4 bg-emerald-500" : "w-1 bg-stone-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
