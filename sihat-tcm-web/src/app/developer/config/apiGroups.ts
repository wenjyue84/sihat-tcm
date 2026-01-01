/**
 * API Groups Configuration
 * Extracted from developer/page.tsx for better organization
 */

import type { ApiGroup } from "@/hooks/useApiMonitor";

export const API_GROUPS: ApiGroup[] = [
  {
    title: "AI Diagnosis & Analysis",
    description: "Core AI processing for image and audio inputs",
    endpoints: [
      {
        path: "/api/analyze-image",
        method: "POST",
        type: "AI Analysis",
        status: 200,
        latency: "1.2s",
      },
      {
        path: "/api/analyze-audio",
        method: "POST",
        type: "AI Analysis",
        status: 200,
        latency: "0.8s",
      },
    ],
  },
  {
    title: "Consultation & Chat",
    description: "Real-time messaging and advisory services",
    endpoints: [
      { path: "/api/chat", method: "POST", type: "Conversation", status: 200, latency: "450ms" },
      {
        path: "/api/consult",
        method: "POST",
        type: "Core Consultation",
        status: 200,
        latency: "650ms",
      },
      {
        path: "/api/ask-dietary-advice",
        method: "POST",
        type: "AI Advice",
        status: 200,
        latency: "1.5s",
      },
    ],
  },
  {
    title: "Medical Tools & Reports",
    description: "Report generation, summarization and validation tools",
    endpoints: [
      {
        path: "/api/summarize-reports",
        method: "POST",
        type: "Processing",
        status: 200,
        latency: "1.1s",
      },
      {
        path: "/api/validate-medicine",
        method: "POST",
        type: "Safety Check",
        status: 200,
        latency: "300ms",
      },
      {
        path: "/api/generate-infographic",
        method: "POST",
        type: "Content Gen",
        status: 200,
        latency: "2.4s",
      },
    ],
  },
  {
    title: "Admin & System",
    description: "Internal system status and configuration endpoints",
    endpoints: [
      {
        path: "/api/admin/db-status",
        method: "GET",
        type: "System Monitor",
        status: 200,
        latency: "120ms",
      },
      {
        path: "/api/admin/settings",
        method: "GET",
        type: "Configuration",
        status: 200,
        latency: "85ms",
      },
    ],
  },
];


