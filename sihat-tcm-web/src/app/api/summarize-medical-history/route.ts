import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { devLog } from "@/lib/systemLogger";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

// Default prompt if not configured in admin
const DEFAULT_PROMPT = `You are a medical assistant helping patients summarize their medical history for doctor consultations.

Based on the patient's previous TCM diagnosis reports and uploaded medical documents, create a clear, concise medical history summary that:

1. Lists main health complaints and patterns
2. Mentions relevant TCM diagnoses and syndrome patterns
3. Notes important findings from medical reports
4. Highlights chronic conditions or ongoing treatments
5. Uses simple, patient-friendly language

The summary should be 3-5 sentences that the patient can easily share with their doctor.

Previous Diagnosis History:
{inquiries}

Medical Reports:
{reports}

Generate a concise medical history summary:`;

export async function POST(request: NextRequest) {
  try {
    const { inquiries, reports, customPrompt } = await request.json();

    // Prepare inquiry summary
    const inquirySummary =
      inquiries && inquiries.length > 0
        ? inquiries
            .map((inq: any, index: number) => {
              const date = new Date(inq.created_at).toLocaleDateString();
              const symptoms =
                inq.symptoms || inq.diagnosis_report?.mainComplaint || "General consultation";
              const diagnosis =
                inq.diagnosis_report?.tcmDiagnosis ||
                inq.diagnosis_report?.syndromePattern ||
                "Pending review";

              return `${index + 1}. Date: ${date}
   Symptoms: ${symptoms}
   TCM Diagnosis: ${diagnosis}`;
            })
            .join("\n\n")
        : "No previous diagnosis history available.";

    // Prepare medical reports summary
    const reportsSummary =
      reports && reports.length > 0
        ? reports
            .map((report: any, index: number) => {
              return `${index + 1}. ${report.name} (${report.date})
   ${report.extractedText ? "Summary: " + report.extractedText : "Medical report document"}`;
            })
            .join("\n\n")
        : "No medical reports available.";

    // Use custom prompt from admin or default
    const promptTemplate = customPrompt || DEFAULT_PROMPT;

    // Replace placeholders
    const finalPrompt = promptTemplate
      .replace("{inquiries}", inquirySummary)
      .replace("{reports}", reportsSummary);

    devLog("info", "SummarizeMedicalHistory", "Generating summary", {
      inquiriesCount: inquiries?.length || 0,
      reportsCount: reports?.length || 0,
    });

    // Generate summary using ai-sdk
    const google = getGoogleProvider();
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: finalPrompt,
    });
    const summary = result.text;

    devLog("info", "SummarizeMedicalHistory", "Summary generated", {
      preview: summary.substring(0, 100) + "...",
    });

    return NextResponse.json({
      summary: summary.trim(),
      success: true,
    });
  } catch (error: unknown) {
    const errorResponse = createErrorResponse(error, "API/summarize-medical-history");
    const errorBody = await errorResponse.json();
    return NextResponse.json(errorBody, { status: errorResponse.status });
  }
}
