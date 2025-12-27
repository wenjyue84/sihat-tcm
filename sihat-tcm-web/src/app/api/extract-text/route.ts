import { generateText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { file, fileName, fileType, mode, language = "en" } = await req.json();

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Build the appropriate prompt based on mode
    let prompt = "";

    if (mode === "medicine") {
      prompt = `You are an expert at analyzing images and documents to extract medicine information.

TASK: Analyze this image/document and extract ONLY medicine-related information.

IMPORTANT RULES:
1. First, determine if this image contains ANY medicine information (medicine bottles, pills, prescriptions, medicine packaging, pharmacy receipts, etc.)
2. If this is a food photo, random object, selfie, landscape, or anything NOT related to medicine, respond with:
   - is_medicine_image: false
   - text: A message explaining that no medicine was found in this image
3. If this IS a medicine-related image, extract:
   - Medicine names
   - Dosage information (if visible)
   - Quantity (if visible)
   - Instructions (if visible)

RESPOND IN STRICT JSON FORMAT:
{
  "is_medicine_image": boolean,
  "text": "The formatted text to display (as a single string, use \\n for newlines)",
  "warning": "Optional warning message if this looks like a medical report"
}

Examples of valid medicine images:
- Photo of medicine bottles/boxes
- Prescription documents
- Pharmacy receipts with medication names
- Medicine packaging labels
- Pill containers with labels

Examples of INVALID images (return is_medicine_image: false):
- Food photos
- Random objects
- Selfies or portraits
- Documents without medicine info
- Blank or unclear images

Language for response: ${language === "zh" ? "Chinese (简体中文)" : language === "ms" ? "Malay (Bahasa Malaysia)" : "English"}`;
    } else {
      // General mode - extract all text/data
      prompt = `You are an expert at analyzing medical documents and images.

TASK: Extract all relevant medical information from this image/document.

Extract:
- Patient information (if visible)
- Clinical findings
- Test results
- Diagnoses
- Any other medically relevant information

Format the output in a clear, structured way.

Language for response: ${language === "zh" ? "Chinese (简体中文)" : language === "ms" ? "Malay (Bahasa Malaysia)" : "English"}

RESPOND IN STRICT JSON FORMAT:
{
  "text": "The formatted extracted text (as a single string, use \\n for newlines)"
}`;
    }

    // Prepare the file for the API
    const base64Data = file.split(",")[1] || file;
    const mimeType = fileType || "image/png";

    // ============================================================================
    // IMPORTANT: PDF vs Image Handling - DO NOT MODIFY WITHOUT CAREFUL TESTING
    // ============================================================================
    // The Gemini API requires DIFFERENT content types for PDFs vs images:
    // - PDFs MUST use: type: 'file' + mediaType: 'application/pdf'
    // - Images MUST use: type: 'image' + mimeType: 'image/...'
    //
    // If you send a PDF as an 'image' type, you will get the error:
    // "Provided image is not valid"
    //
    // This was fixed on 2024-12-07. Do not revert this logic.
    // ============================================================================
    const isPdf = mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");

    // Build the content based on file type - PDFs and images require different formats
    const fileContent = isPdf
      ? {
        // PDFs require 'file' type with 'mediaType' property
        type: "file" as const,
        data: base64Data,
        mediaType: "application/pdf" as const,
      }
      : {
        // Images require 'image' type with 'mimeType' property
        type: "image" as const,
        image: base64Data,
        mimeType: mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
      };

    const google = getGoogleProvider();

    // Validate that API key is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is not configured");
      return Response.json(
        { error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const { text: responseText } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, fileContent],
        },
      ],
    });

    // Parse the response
    let result;
    try {
      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      result = JSON.parse(cleanText);
    } catch (_parseError) {
      // If JSON parsing fails, return the raw text
      return Response.json({
        text: responseText,
        warning: null,
      });
    }

    // Helper to ensure text is string
    // IMPORTANT: The AI sometimes returns a JSON object for the 'text' field
    // even when explicitly asked for a string. This helper prevents [object Object]
    // from being displayed to the user by stringifying any objects.
    const ensureString = (val: unknown) => {
      if (typeof val === "string") return val;
      if (typeof val === "object" && val !== null) {
        // If it's an object, try to format it nicely
        return JSON.stringify(val, null, 2);
      }
      return String(val || "");
    };

    // Handle medicine mode responses
    if (mode === "medicine") {
      if (!result.is_medicine_image) {
        // Not a medicine image - return appropriate message
        const noMedicineMessages = {
          en: `=== NO MEDICINE DETECTED ===
File: ${fileName}

This image does not appear to contain any medicine information.

Please upload:
- A photo of your medicine bottles or packaging
- A prescription document
- A pharmacy receipt

Or use the manual input field to type in your medicine names.`,
          zh: `=== 未检测到药物 ===
文件：${fileName}

此图片似乎不包含任何药物信息。

请上传：
- 药瓶或药物包装的照片
- 处方文件
- 药房收据

或使用手动输入框输入您的药物名称。`,
          ms: `=== TIADA UBAT DIKESAN ===
Fail: ${fileName}

Imej ini nampaknya tidak mengandungi sebarang maklumat ubat.

Sila muat naik:
- Foto botol atau pembungkusan ubat
- Dokumen preskripsi
- Resit farmasi

Atau gunakan medan input manual untuk menaip nama ubat anda.`,
        };

        return Response.json({
          text: noMedicineMessages[language as "en" | "zh" | "ms"] || noMedicineMessages.en,
          warning: null,
          is_valid: false,
        });
      }

      // Valid medicine image
      return Response.json({
        text: ensureString(result.text),
        warning: result.warning || null,
        is_valid: true,
      });
    }

    // General mode
    return Response.json({
      text: ensureString(result.text || responseText),
      warning: null,
    });
  } catch (error: unknown) {
    console.error("Extract text error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to extract text";
    return Response.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
