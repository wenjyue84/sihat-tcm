/**
 * Phase 3: Patient Portal UI Tests
 *
 * Tests for the DiagnosisInputDataViewer component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiagnosisInputDataViewer } from "../DiagnosisInputDataViewer";
import type { DiagnosisSession } from "@/types/database";

describe("Phase 3: DiagnosisInputDataViewer", () => {
  const mockSession: DiagnosisSession = {
    id: "session-1",
    user_id: "user-1",
    primary_diagnosis: "Qi Deficiency",
    full_report: {} as any,
    created_at: "2025-01-02T10:00:00Z",
    updated_at: "2025-01-02T10:00:00Z",
  };

  describe("Component Rendering", () => {
    it("should not render when no input data exists", () => {
      const { container } = render(<DiagnosisInputDataViewer session={mockSession} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render when input data exists", () => {
      const sessionWithData: DiagnosisSession = {
        ...mockSession,
        inquiry_summary: "Patient reported headaches",
      };

      render(<DiagnosisInputDataViewer session={sessionWithData} />);
      expect(screen.getByText("Input Data")).toBeInTheDocument();
    });
  });

  describe("Inquiry Data Display", () => {
    it("should render inquiry section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        inquiry_summary: "Patient summary text",
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Inquiry & Conversation")).toBeInTheDocument();
    });

    it("should render inquiry section with chat history", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        inquiry_chat_history: [
          { role: "user", content: "I have a headache" },
          { role: "assistant", content: "How long?" },
        ],
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Inquiry & Conversation")).toBeInTheDocument();
    });

    it("should render inquiry section with report files", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        inquiry_report_files: [
          {
            name: "report.pdf",
            url: "https://example.com/report.pdf",
            type: "application/pdf",
            size: 1024000,
          },
        ],
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Inquiry & Conversation")).toBeInTheDocument();
    });
  });

  describe("Visual Analysis Display", () => {
    it("should render tongue analysis section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
          observation: "Pale tongue",
          tcm_indicators: ["Qi Deficiency"],
        },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Tongue Analysis")).toBeInTheDocument();
    });

    it("should render face analysis section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        face_analysis: {
          image_url: "https://example.com/face.jpg",
          observation: "Pale complexion",
        },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Face Analysis")).toBeInTheDocument();
    });

    it("should render body analysis section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        body_analysis: {
          image_url: "https://example.com/body.jpg",
          observation: "Swelling in lower limbs",
        },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Body Part Analysis")).toBeInTheDocument();
    });
  });

  describe("Audio Analysis Display", () => {
    it("should render audio analysis section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        audio_analysis: {
          audio_url: "https://example.com/audio.mp3",
          observation: "Weak voice",
        },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Voice Analysis")).toBeInTheDocument();
    });
  });

  describe("Pulse Data Display", () => {
    it("should render pulse data section when data exists", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        pulse_data: {
          bpm: 72,
          quality: "smooth",
          rhythm: "regular",
          strength: "moderate",
        },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Pulse Measurement")).toBeInTheDocument();
    });
  });

  describe("Multiple Data Types", () => {
    it("should display all data types when present", () => {
      const session: DiagnosisSession = {
        ...mockSession,
        inquiry_summary: "Summary",
        tongue_analysis: { observation: "Tongue observation" },
        face_analysis: { observation: "Face observation" },
        audio_analysis: { observation: "Audio observation" },
        pulse_data: { bpm: 72 },
      };

      render(<DiagnosisInputDataViewer session={session} />);
      expect(screen.getByText("Inquiry & Conversation")).toBeInTheDocument();
      expect(screen.getByText("Tongue Analysis")).toBeInTheDocument();
      expect(screen.getByText("Face Analysis")).toBeInTheDocument();
      expect(screen.getByText("Voice Analysis")).toBeInTheDocument();
      expect(screen.getByText("Pulse Measurement")).toBeInTheDocument();
    });
  });
});
