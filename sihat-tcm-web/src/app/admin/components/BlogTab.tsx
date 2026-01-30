"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotebookPen, ExternalLink } from "lucide-react";

export function BlogTab() {
  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-2">
      <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50" />
        <CardHeader className="text-center pb-8 pt-10 relative z-10">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center mb-6">
            <NotebookPen className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">
            Content Management System
          </CardTitle>
          <CardDescription className="text-lg text-slate-600 max-w-lg mx-auto mt-2">
            Manage your blog articles, translations, and media library in one visual interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-12 relative z-10">
          <Button
            size="lg"
            className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 text-lg font-medium transition-transform hover:-translate-y-1"
            onClick={() => window.open("/tina-admin/index.html", "_blank")}
          >
            Launch CMS Editor
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white/50">
          <div className="p-6 text-center">
            <h4 className="font-bold text-slate-900">Multi-language</h4>
            <p className="text-xs text-slate-500 mt-1">EN, MS, ZH Support</p>
          </div>
          <div className="p-6 text-center">
            <h4 className="font-bold text-slate-900">Visual Editing</h4>
            <p className="text-xs text-slate-500 mt-1">Real-time Preview</p>
          </div>
          <div className="p-6 text-center">
            <h4 className="font-bold text-slate-900">Media Library</h4>
            <p className="text-xs text-slate-500 mt-1">Cloudinary Integration</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
