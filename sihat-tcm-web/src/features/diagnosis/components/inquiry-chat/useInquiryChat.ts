import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/stores/useAppStore";
import { useDoctorLevel } from "@/stores/useAppStore";
import { BasicInfoData } from "../BasicInfoForm";
import { INTERACTIVE_CHAT_PROMPT } from "@/lib/systemPrompts";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export function useInquiryChat(basicInfo?: BasicInfoData) {
  const { language } = useLanguage();
  const { getDoctorInfo } = useDoctorLevel();
  const doctorInfo = getDoctorInfo();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Construct the initial system message
  const systemMessage = basicInfo
    ? `${INTERACTIVE_CHAT_PROMPT}

=== PATIENT DATA ===
Name: ${basicInfo.name}
Age: ${basicInfo.age}
Gender: ${basicInfo.gender}
Weight: ${basicInfo.weight} kg
Height: ${basicInfo.height} cm
Chief Complaint: "${basicInfo.symptoms}"
Duration: ${basicInfo.symptomDuration}
`
    : INTERACTIVE_CHAT_PROMPT;

  const sendMessage = useCallback(
    async (userMessage: string, isInitialPrompt = false, isSystemInjection = false) => {
      console.log("[InquiryChat] sendMessage called", {
        userMessage,
        isInitialPrompt,
        isSystemInjection,
        model: doctorInfo.model,
        language,
      });

      setIsLoading(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      };

      if (!isSystemInjection) {
        setMessages((prev) => [...prev, userMsg]);
      }

      const currentMessages = isInitialPrompt
        ? [{ role: "system", content: systemMessage }, userMsg]
        : [...messages, userMsg];

      console.log("[InquiryChat] Sending to API", {
        messageCount: currentMessages.length,
        model: doctorInfo.model,
      });

      try {
        // Add timeout to prevent infinite hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
            basicInfo,
            model: doctorInfo.model,
            language,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("[InquiryChat] API response received", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("[InquiryChat] API error data:", errorData);
            throw new Error(JSON.stringify(errorData));
          } catch (parseError) {
            console.error("[InquiryChat] Failed to parse error response:", parseError);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body reader available");
        }

        const decoder = new TextDecoder();
        let fullText = "";

        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

        console.log("[InquiryChat] Starting stream read");
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[InquiryChat] Stream complete", { chunkCount, textLength: fullText.length });
            break;
          }
          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullText } : m))
          );
        }
      } catch (err: any) {
        console.error("[InquiryChat] Error caught:", err);
        console.error("[InquiryChat] Error stack:", err?.stack);

        // Handle timeout specifically
        if (err.name === "AbortError") {
          const timeoutMessage =
            language === "zh"
              ? "请求超时。医师可能正在处理其他患者。请稍后重试。"
              : language === "ms"
                ? "Permintaan tamat masa. Doktor mungkin sedang memproses pesakit lain. Sila cuba sebentar lagi."
                : "Request timed out. The doctor may be busy with other patients. Please try again in a moment.";

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: timeoutMessage,
            },
          ]);
        } else {
          // Error handling logic for other errors
          const errorMessage =
            language === "zh"
              ? `抱歉，发生了错误：${err.message || "未知错误"}。请重试。`
              : language === "ms"
                ? `Maaf, terdapat ralat: ${err.message || "Unknown error"}. Sila cuba lagi.`
                : `Sorry, an error occurred: ${err.message || "Unknown error"}. Please try again.`;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: errorMessage,
            },
          ]);
        }
      } finally {
        console.log("[InquiryChat] Setting isLoading to false");
        setIsLoading(false);
      }
    },
    [messages, systemMessage, basicInfo, doctorInfo.model, language]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    doctorInfo,
  };
}
