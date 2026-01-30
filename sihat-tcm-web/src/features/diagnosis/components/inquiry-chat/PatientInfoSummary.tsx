import { ChevronDown, ChevronUp, Pill, FileText } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { BasicInfoData } from "../BasicInfoForm";
import { FileData } from "../UploadReportsStep";
import { calculateBMI, getBMICategory } from "@/lib/utils/bmi";

interface PatientInfoSummaryProps {
  basicInfo?: BasicInfoData;
  medicineFiles: FileData[];
  reportFiles: FileData[];
}

export function PatientInfoSummary({
  basicInfo,
  medicineFiles,
  reportFiles,
}: PatientInfoSummaryProps) {
  const { t, language } = useLanguage();

  if (!basicInfo || !basicInfo.weight || !basicInfo.height) return null;

  const weight = parseFloat(basicInfo.weight);
  const height = parseFloat(basicInfo.height);
  let bmiSection = null;

  if (weight > 0 && height > 0) {
    const bmi = calculateBMI(weight, height);
    const bmiInfo = getBMICategory(bmi, language);
    bmiSection = (
      <div>
        <span className="text-stone-500 text-xs">{t.report.bmi}:</span>
        <div
          className={`inline-flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full border text-xs ${bmiInfo.color}`}
        >
          <span className="font-bold">{bmi.toFixed(1)}</span>
          <span>•</span>
          <span className="font-semibold">{bmiInfo.category}</span>
        </div>
      </div>
    );
  }

  return (
    <details className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 md:p-4 rounded-lg border border-emerald-200 group">
      <summary className="font-semibold text-emerald-800 text-sm cursor-pointer flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
        {t.report.patientInfo}
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <span className="group-open:hidden">
            {language === "zh"
              ? "点击展开"
              : language === "ms"
                ? "Ketik untuk kembang"
                : "Tap to expand"}
          </span>
          <span className="hidden group-open:inline">
            {language === "zh"
              ? "点击收起"
              : language === "ms"
                ? "Ketik untuk tutup"
                : "Tap to collapse"}
          </span>
          <ChevronDown className="w-4 h-4 group-open:hidden" />
          <ChevronUp className="w-4 h-4 hidden group-open:block" />
        </div>
      </summary>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
        <div>
          <span className="text-stone-500 text-xs">{t.report.name}:</span>
          <p className="font-medium text-stone-800 text-sm">{basicInfo.name}</p>
        </div>
        <div>
          <span className="text-stone-500 text-xs">{t.report.age}:</span>
          <p className="font-medium text-stone-800 text-sm">
            {basicInfo.age} {language === "zh" ? "岁" : language === "ms" ? "tahun" : "years"}
          </p>
        </div>
        <div>
          <span className="text-stone-500 text-xs">{t.report.gender}:</span>
          <p className="font-medium text-stone-800 text-sm capitalize">{basicInfo.gender}</p>
        </div>
        <div>
          <span className="text-stone-500 text-xs">{t.report.weight}:</span>
          <p className="font-medium text-stone-800 text-sm">{basicInfo.weight} kg</p>
        </div>
        <div>
          <span className="text-stone-500 text-xs">{t.report.height}:</span>
          <p className="font-medium text-stone-800 text-sm">{basicInfo.height} cm</p>
        </div>
        <div className="col-span-2 md:col-span-3">{bmiSection}</div>
      </div>

      {/* Medicine List Section */}
      {medicineFiles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-stone-700 text-sm">
              {language === "zh"
                ? "当前用药"
                : language === "ms"
                  ? "Ubat Semasa"
                  : "Current Medications"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicineFiles.map((file, index) => (
              <div
                key={index}
                className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs text-amber-800"
              >
                {file.extractedText ? (
                  <span>
                    {file.extractedText
                      .split("\n")
                      .filter((line) => line.trim())
                      .slice(0, 3)
                      .join(", ")}
                    {file.extractedText.split("\n").filter((line) => line.trim()).length > 3
                      ? "..."
                      : ""}
                  </span>
                ) : (
                  <span>{file.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Reports Summary Section */}
      {reportFiles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-200/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-stone-700 text-sm">
              {language === "zh"
                ? "医疗报告摘要"
                : language === "ms"
                  ? "Ringkasan Laporan Perubatan"
                  : "Medical Report Summary"}
            </span>
          </div>
          <div className="space-y-2">
            {reportFiles.map((file, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-xs text-blue-800"
              >
                <div className="font-medium mb-1">{file.name}</div>
                {file.extractedText && (
                  <p className="text-blue-700/80 line-clamp-2">
                    {file.extractedText.substring(0, 150)}
                    {file.extractedText.length > 150 ? "..." : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
