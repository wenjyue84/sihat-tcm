import { jsPDF } from "jspdf";

// Flag to track if font is already loaded (cached)
let fontLoaded = false;
let cachedFontBase64: string | null = null;

// Google Fonts Noto Sans SC - Variable font in TTF format
// This is a smaller subset with common characters
const NOTO_SANS_SC_TTF_URL =
  "https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf";

// Fallback: Use a subset OTC converted URL from jsDelivr
const FALLBACK_FONT_URL =
  "https://cdn.jsdelivr.net/npm/source-han-sans-sc@1.0.0/SourceHanSansSC-Regular.otf";

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Add Chinese font support to jsPDF document
 * Uses TTF format which is properly supported by jsPDF for CJK characters
 * @returns true if font was loaded successfully, false otherwise
 */
export async function addChineseFont(doc: jsPDF): Promise<boolean> {
  try {
    // Use cached font if already loaded
    if (fontLoaded && cachedFontBase64) {
      doc.addFileToVFS("NotoSansSC-Regular.ttf", cachedFontBase64);
      doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
      return true;
    }

    console.log("Fetching Chinese font (TTF format)...");

    // Try primary URL first
    let response = await fetch(NOTO_SANS_SC_TTF_URL);

    if (!response.ok) {
      console.warn("Primary font URL failed, trying fallback...");
      response = await fetch(FALLBACK_FONT_URL);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }

    // Read as ArrayBuffer and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64data = arrayBufferToBase64(arrayBuffer);

    if (!base64data) {
      throw new Error("Failed to convert font to base64");
    }

    // Cache for subsequent PDF generations
    cachedFontBase64 = base64data;
    fontLoaded = true;

    // Add the font to jsPDF's virtual file system
    // Must use .ttf extension for jsPDF to recognize fonts properly
    doc.addFileToVFS("NotoSansSC-Regular.ttf", base64data);

    // Register the font with jsPDF
    // The 'normal' style is the standard weight
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");

    console.log("Chinese font added successfully");
    return true;
  } catch (error) {
    console.error("Error adding Chinese font:", error);
    // Return false - caller should use fallback font
    return false;
  }
}
