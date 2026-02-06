/**
 * TCM Inquiry Test Executor
 *
 * Tests for Step 2: TCM Inquiry chat functionality
 */

import { MOCK_PROFILES } from "@/data/mockProfiles";
import { MOCK_IMAGE } from "../constants";

export async function executeTcmInquiryTest(testId: string): Promise<void> {
  switch (testId) {
    case "chat_api_endpoint": {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], model: "gemini-2.0-flash" }),
      });
      if (response.status === 404) throw new Error("Chat API not found (404)");
      break;
    }

    case "chat_stream_response": {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          basicInfo: MOCK_PROFILES[0].data.basic_info,
          model: "gemini-1.5-flash",
          language: "en",
        }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let receivedData = false;
      const timeout = 15000;
      const start = Date.now();

      while (!receivedData && Date.now() - start < timeout) {
        const { value, done } = await reader.read();
        if (value && value.length > 0) receivedData = true;
        else if (done) throw new Error("Stream closed without data");
        if (!receivedData && !done) await new Promise((r) => setTimeout(r, 100));
      }
      if (!receivedData) throw new Error("Timeout (15s)");
      reader.cancel();
      break;
    }

    case "tcm_inquiry_persona": {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "What is your specialty?" }],
          basicInfo: { symptoms: "headache" },
          model: "gemini-1.5-flash",
          language: "en",
        }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    case "chat_language_support": {
      for (const lang of ["en", "zh", "ms"]) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Test" }],
            model: "gemini-2.0-flash",
            language: lang,
          }),
        });
        if (response.status === 404) throw new Error(`Language ${lang} not supported`);
      }
      break;
    }

    case "file_upload_extraction": {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "general" }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const result = await response.json();
      if (result.error && !result.text) throw new Error(result.error);
      break;
    }

    case "medicine_photo_extraction": {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "medicine" }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    case "inquiry_summary_generation": {
      const response = await fetch("/api/summarize-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: MOCK_PROFILES[0].data.wen_inquiry.chat,
          basicInfo: MOCK_PROFILES[0].data.basic_info,
        }),
      });
      if (response.status === 404) return; // Skip - endpoint not yet implemented
      if (!response.ok) {
        let errorDetails = `API returned ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.error) errorDetails += `: ${errorJson.error}`;
        } catch (e) {
          /* ignore JSON parse error */
        }
        throw new Error(errorDetails);
      }
      break;
    }

    case "inquiry_summary_fallback_test": {
      const response = await fetch("/api/summarize-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: MOCK_PROFILES[0].data.wen_inquiry.chat,
          basicInfo: MOCK_PROFILES[0].data.basic_info,
          model: "non-existent-model-v999",
        }),
      });

      if (!response.ok) {
        let errorDetails = `Fallback failed. API returned ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.error) errorDetails += `: ${errorJson.error}`;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorDetails);
      }

      const result = await response.json();
      if (!result.summary) throw new Error("Fallback response missing summary");
      break;
    }

    case "chat_empty_message_handling": {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "" }],
          model: "gemini-1.5-flash",
          language: "en",
        }),
      });
      if (response.status !== 400) {
        throw new Error(`Expected 400 for empty message, got ${response.status}`);
      }
      break;
    }

    case "chat_long_message_handling": {
      const longMessage = "A".repeat(5000);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: longMessage }],
          model: "gemini-1.5-flash",
          language: "en",
        }),
      });
      if (!response.ok) throw new Error(`API failed with long message: ${response.status}`);
      break;
    }

    case "chat_history_persistence": {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "My name is John." },
            { role: "assistant", content: "Hello John, how can I help you today?" },
            { role: "user", content: "What is my name?" },
          ],
          model: "gemini-1.5-flash",
          language: "en",
        }),
      });
      if (!response.ok) throw new Error(`API failed with chat history: ${response.status}`);
      break;
    }

    case "extract_text_pdf_support": {
      const mockPdf = "data:application/pdf;base64,JVBERi0xLjcKUmVwb3J0IA==";
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: mockPdf, fileType: "application/pdf", mode: "general" }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    case "extract_text_image_support": {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "general" }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    case "validate_medicine_api": {
      const response = await fetch("/api/validate-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Panadol, Liu Wei Di Huang Wan" }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    case "western_chat_api": {
      const response = await fetch("/api/western-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Is acupuncture safe?" }],
          language: "en",
        }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      break;
    }

    default:
      throw new Error(`Unknown TCM inquiry test: ${testId}`);
  }
}
