"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Upload, Download, Loader2, Info } from "lucide-react";

interface MobileTabProps {
  uploadingApk: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleApkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MobileTab({ uploadingApk, fileInputRef, handleApkUpload }: MobileTabProps) {
  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-2">
      <Card className="border-emerald-100 shadow-lg bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-emerald-700" />
            </div>
            Android App Deployment
          </CardTitle>
          <CardDescription className="text-emerald-800/70">
            Upload a new .apk build to update the direct download link on the landing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
              <Upload className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Upload APK File</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                Select the <code>.apk</code> file from your computer. It will be automatically
                renamed to <code>sihat-tcm.apk</code> and deployed to the public server.
              </p>
            </div>

            <input
              type="file"
              accept=".apk"
              ref={fileInputRef}
              className="hidden"
              onChange={handleApkUpload}
            />

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 shadow-lg min-w-[160px]"
                disabled={uploadingApk}
              >
                {uploadingApk ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select APK File
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open("/sihat-tcm.apk", "_blank")}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Current
              </Button>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
            <Info className="w-5 h-5 shrink-0 text-amber-600" />
            <p>
              <strong>Note:</strong> We strictly maintain a single version policy for simplicity.
              Uploading a new file will immediately replace the existing <code>sihat-tcm.apk</code>.
              Please ensure you are uploading the correct build (Production/Preview).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
