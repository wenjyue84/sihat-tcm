"use client";

import { BasicInfoForm } from "@/components/diagnosis/BasicInfoForm";
import { useState } from "react";
import { BasicInfoData } from "@/components/diagnosis/basic-info/types";

export default function TestBasicInfoPage() {
  const [result, setResult] = useState<BasicInfoData | null>(null);

  const handleComplete = (data: BasicInfoData) => {
    console.log("Complete:", data);
    setResult(data);
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Basic Info Form Test</h1>
          <p className="text-stone-600">Testing the refactored wizard component</p>
        </div>

        <BasicInfoForm onComplete={handleComplete} />

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">Result:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
