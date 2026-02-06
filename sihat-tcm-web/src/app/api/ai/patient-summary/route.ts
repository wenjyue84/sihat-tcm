import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { patientId } = await req.json();

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // 1. Fetch Patient Details
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // 2. Fetch Diagnosis History (Only if user_id exists for now)
    let diagnosisSessions: Array<{
      id: string;
      created_at: string;
      primary_diagnosis: string | null;
      full_report: unknown;
    }> = [];
    if (patient.user_id) {
      const { data: sessions } = await supabase
        .from("diagnosis_sessions")
        .select("id, created_at, primary_diagnosis, full_report")
        .eq("user_id", patient.user_id)
        .order("created_at", { ascending: false })
        .limit(5); // Last 5 sessions
      diagnosisSessions = sessions || [];
    }

    // 3. Prepare Context for AI
    const prompt = `
      You are an expert Medical AI Assistant for a TCM (Traditional Chinese Medicine) Doctor.
      Generate a "One Page Clinical Summary" for the following patient.
      
      ## Patient Demographics
      Name: ${patient.first_name} ${patient.last_name || ""}
      Age: ${patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : "Unknown"}
      Gender: ${patient.gender || "Unknown"}
      Type: ${patient.type}

      ## Recent Medical History (Last ${diagnosisSessions.length} visits)
      ${
        diagnosisSessions.length === 0
          ? "No recent diagnosis history found."
          : diagnosisSessions
              .map(
                (s) => `
        - Date: ${new Date(s.created_at).toLocaleDateString()}
        - Diagnosis: ${s.primary_diagnosis}
        - Key Findings: ${JSON.stringify((s.full_report as { analysis?: { summary?: string } })?.analysis?.summary || "N/A")}
        `
              )
              .join("\n")
      }

      ## Task
      Create a concise, professional clinical summary in Markdown format.
      The summary should include:
      1. **Patient Profile**: Brief demographic and constitutional overview.
      2. **Clinical Snapshot**: Summary of recent conditions and patterns (e.g., "History of Liver Qi Stagnation").
      3. **Trend Analysis**: If multiple visits, note any improvements or recurring issues.
      4. **Key Alerts**: Highlight any critical warnings or contraindications if found in the history.
      
      Format with clear H2 headers (##) and bullet points. Keep it under 400 words.
      Do not include any conversational filler. Start directly with the summary.
    `;

    // 4. Generate Summary
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: prompt,
    });

    // 5. Update Patient Record with Cached Summary
    const summaryData = {
      summary: text,
      generated_at: new Date().toISOString(),
      last_diagnosis_id: diagnosisSessions[0]?.id,
    };

    const { error: updateError } = await supabase
      .from("patients")
      .update({ clinical_summary: summaryData })
      .eq("id", patientId);

    if (updateError) {
      console.error("Failed to cache summary", updateError);
    }

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
