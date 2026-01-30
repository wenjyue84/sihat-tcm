import {
  MessageSquare,
  Eye,
  Mic,
  FileText,
  ClipboardList,
} from "lucide-react";
import {
  INTERACTIVE_CHAT_PROMPT,
  TONGUE_ANALYSIS_PROMPT,
  FACE_ANALYSIS_PROMPT,
  BODY_ANALYSIS_PROMPT,
  LISTENING_ANALYSIS_PROMPT,
  INQUIRY_SUMMARY_PROMPT,
  FINAL_ANALYSIS_PROMPT,
} from "@/lib/systemPrompts";

// Doctor Level → LLM Model mapping
export const DOCTOR_MODEL_MAPPING = {
  Master: { model: "gemini-3.0-preview", label: "Gemini 3.0 Preview (Master)" },
  Expert: { model: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Expert)" },
  Doctor: { model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
} as const;

// Prompt configuration
export const PROMPT_TYPES = {
  chat: {
    role: "doctor_chat",
    title: "Interactive Chat",
    description: "Guides the AI during the patient inquiry conversation.",
    icon: MessageSquare,
    color: "blue",
    defaultPrompt: INTERACTIVE_CHAT_PROMPT,
  },
  tongue: {
    role: "doctor_tongue",
    title: "Tongue Analysis",
    description: "Protocol for analyzing tongue images.",
    icon: Eye,
    color: "red",
    defaultPrompt: TONGUE_ANALYSIS_PROMPT,
  },
  face: {
    role: "doctor_face",
    title: "Face Analysis",
    description: "Protocol for face visual inspection.",
    icon: Eye,
    color: "orange",
    defaultPrompt: FACE_ANALYSIS_PROMPT,
  },
  body: {
    role: "doctor_body",
    title: "Body Analysis",
    description: "Protocol for body visual inspection.",
    icon: Eye,
    color: "emerald",
    defaultPrompt: BODY_ANALYSIS_PROMPT,
  },
  listening: {
    role: "doctor_listening",
    title: "Listening Analysis",
    description: "Protocol for analyzing voice and audio.",
    icon: Mic,
    color: "purple",
    defaultPrompt: LISTENING_ANALYSIS_PROMPT,
  },
  inquiry_summary: {
    role: "doctor_inquiry_summary",
    title: "Inquiry Summary",
    description: "Summarizes patient inquiry into clinical data.",
    icon: ClipboardList,
    color: "teal",
    defaultPrompt: INQUIRY_SUMMARY_PROMPT,
  },
  final: {
    role: "doctor_final",
    title: "Final Diagnosis",
    description: "Synthesis of all data into a final report.",
    icon: FileText,
    color: "amber",
    defaultPrompt: FINAL_ANALYSIS_PROMPT,
  },
} as const;

export type PromptType = keyof typeof PROMPT_TYPES;
export type DoctorLevel = keyof typeof DOCTOR_MODEL_MAPPING;

export const DEFAULT_MUSIC_URL =
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3";

export const PROMPT_PIPELINE_GROUPS = [
  {
    id: "1",
    title: "Step 1: Patient Inquiry",
    prompts: ["chat", "inquiry_summary"] as PromptType[],
  },
  {
    id: "2",
    title: "Step 2: AI Visual & Audio Analysis",
    prompts: ["tongue", "face", "body", "listening"] as PromptType[],
  },
  {
    id: "3",
    title: "Step 3: Diagnosis Generation",
    prompts: ["final"] as PromptType[],
  },
];
