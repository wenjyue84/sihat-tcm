"use client";

import { motion } from "framer-motion";
import { Zap, BookOpen, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SidebarProps {
  t: {
    danTianFilling: string;
    danTianDesc: string;
    unlockScrolls: string;
    nextScroll: string;
    minutes: string;
    xRayVision: string;
  };
}

export function Sidebar({ t }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Dan Tian Filling Visualization */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-600" />
            {t.danTianFilling}
          </CardTitle>
          <CardDescription className="text-slate-500">{t.danTianDesc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          <div className="relative w-36 h-36 mx-auto">
            {/* Subtle background glow */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-slate-100 rounded-full blur-2xl"
            />
            {/* SVG Progress ring */}
            <svg
              className="absolute inset-0 w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(241 245 249)" strokeWidth="6" />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgb(51 65 85)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 0.78 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">78%</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Filled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Scrolls */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-600" />
            {t.unlockScrolls}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 mb-0.5">Day 7 Reward</p>
              <h5 className="font-semibold text-slate-900">Turtle Breath Scroll</h5>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-600">{t.nextScroll}</span>
              <span className="text-slate-500">2/7 {t.minutes}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "30%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-slate-600 rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlight: X-Ray Vision */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Eye className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t.xRayVision}
            </span>
          </div>
          <h4 className="text-base font-semibold text-slate-900 mb-2">See Your Qi Flow</h4>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Overlay anatomical meridian lines to see exactly which organs you're healing.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full font-medium border-slate-200 hover:bg-slate-50"
          >
            Preview Feature
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
