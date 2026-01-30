"use client";

import { Lightbulb, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SidebarCardsProps {
  translations: {
    tips: {
      title: string;
      items: string[];
    };
  };
}

export function SidebarCards({ translations }: SidebarCardsProps) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-amber-50/50 border-b border-amber-50">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            {translations.tips.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-4">
            {translations.tips.items.map((tip, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-slate-600 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50/30 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-indigo-900 font-bold">
            <Info className="w-5 h-5" />
            TCM Listening Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            In Traditional Chinese Medicine (TCM), sleep sounds provide critical clues about the
            balance of internal organs. Snoring is often a result of "Phlegm and Qi struggling" in
            the throat.
          </p>
          <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl text-xs text-indigo-700/80 italic font-bold">
            "The breath is the mirror of the soul, and sleep the measure of the Spleen."
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
