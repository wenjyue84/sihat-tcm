/**
 * PDF Generation utilities for DiagnosisReport
 * Extracted from DiagnosisReport.tsx to improve maintainability
 */

import { jsPDF } from "jspdf";
import { addChineseFont } from "@/lib/chinese-font";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";
import type { DiagnosisReport } from "@/types/database";

interface PDFTranslations {
  title: string;
  subtitle: string;
  generated: string;
  mainDiagnosis: string;
  constitution: string;
  detailedAnalysis: string;
  fileName: string;
}

interface PDFGenerationOptions {
  data: DiagnosisReport;
  translations: PDFTranslations;
  languageKey?: string;
}

/**
 * Generate PDF from diagnosis report data
 */
export async function generateDiagnosisPDF({
  data,
  translations,
  languageKey = "en",
}: PDFGenerationOptions): Promise<void> {
  const tPdf = translations;
  const doc = new jsPDF();

  // Try to load Chinese font, fall back to helvetica if it fails
  const chineseFontLoaded = await addChineseFont(doc);
  const fontName = chineseFontLoaded ? "NotoSansSC" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const addWrappedText = (text: string, fontSize: number, isBold = false) => {
    doc.setFontSize(fontSize);
    // Use the determined font based on whether Chinese font loaded successfully
    const fontStyle = chineseFontLoaded ? "normal" : isBold ? "bold" : "normal";
    doc.setFont(fontName, fontStyle);
    const lines = doc.splitTextToSize(text, contentWidth);
    if (yPos + lines.length * fontSize * 0.5 > 280) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(lines, margin, yPos);
    yPos += lines.length * fontSize * 0.4 + 5;
  };

  // Extract data
  const diagnosisText = extractDiagnosisTitle(data.diagnosis);
  const constitutionText = extractConstitutionType(data.constitution);
  const analysisText =
    typeof data.analysis === "string" ? data.analysis : data.analysis?.summary || "";

  // Title
  doc.setTextColor(6, 95, 70);
  addWrappedText(tPdf.title, 24, true);
  doc.setTextColor(87, 83, 78);
  addWrappedText(tPdf.subtitle, 12);
  yPos += 5;

  // Date
  const dateLocale = languageKey === "zh" ? "zh-CN" : languageKey === "ms" ? "ms-MY" : "en-US";
  const date = new Date().toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  addWrappedText(`${tPdf.generated}: ${date}`, 10);
  yPos += 10;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Main Diagnosis
  doc.setTextColor(6, 95, 70);
  addWrappedText(tPdf.mainDiagnosis, 14, true);
  doc.setTextColor(20, 83, 45);
  addWrappedText(diagnosisText, 16, true);
  doc.setTextColor(21, 128, 61);
  addWrappedText(`${tPdf.constitution}: ${constitutionText}`, 12);
  yPos += 10;
  doc.setTextColor(41, 37, 36);
  addWrappedText(tPdf.detailedAnalysis, 14, true);
  doc.setTextColor(68, 64, 60);
  addWrappedText(analysisText, 11);
  yPos += 10;

  // Save
  const isoDate = new Date().toISOString().split("T")[0];
  doc.save(`${tPdf.fileName}_${isoDate}.pdf`);
}
