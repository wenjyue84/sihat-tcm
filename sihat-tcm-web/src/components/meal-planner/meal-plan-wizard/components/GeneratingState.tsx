"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UtensilsCrossed, Utensils, Sparkles, Leaf } from "lucide-react";
import { motion } from "framer-motion";

interface GeneratingStateProps {
  loadingMessage: string;
}

export function GeneratingState({ loadingMessage }: GeneratingStateProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-10">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-slate-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Creating Your Personalized Meal Plan
                </h3>
                <p className="text-base text-slate-600 font-light">{loadingMessage}</p>
              </div>
              <div className="w-64 h-1.5 mx-auto bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-slate-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "70%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              <p className="text-sm text-slate-500 font-light">
                This usually takes 10-15 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-slate-600" />
              TCM Principles
            </CardTitle>
            <CardDescription className="text-slate-500">
              Your meal plan follows traditional Chinese medicine dietary therapy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Balancing</p>
                <h5 className="font-semibold text-slate-900 text-sm">Yin & Yang</h5>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Therapeutic</p>
                <h5 className="font-semibold text-slate-900 text-sm">Food as Medicine</h5>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
