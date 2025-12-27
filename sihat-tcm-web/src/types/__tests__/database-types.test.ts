/**
 * Phase 1: TypeScript Types Tests
 *
 * Tests for the updated database type definitions.
 * Validates that all new input data fields are properly typed.
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  DiagnosisSession,
  SaveDiagnosisInput,
  GuestDiagnosisSession,
  SaveGuestDiagnosisInput,
  ChatMessage,
  FileMetadata,
  TongueAnalysisData,
  FaceAnalysisData,
  BodyAnalysisData,
  AudioAnalysisData,
  PulseData,
  DiagnosisReport,
  VitalSigns,
} from "../database";

describe("Phase 1: Database Types", () => {
  describe("ChatMessage", () => {
    it("should have correct structure", () => {
      const message: ChatMessage = {
        id: "msg-1",
        role: "user",
        content: "I have a headache",
        timestamp: "2025-01-02T10:00:00Z",
      };

      expect(message.role).toBe("user");
      expect(message.content).toBe("I have a headache");
      expectTypeOf(message.role).toEqualTypeOf<"user" | "assistant" | "system">();
    });

    it("should allow optional fields", () => {
      const minimalMessage: ChatMessage = {
        role: "assistant",
        content: "How long have you had this headache?",
      };

      expect(minimalMessage.role).toBe("assistant");
      expect(minimalMessage.id).toBeUndefined();
    });
  });

  describe("FileMetadata", () => {
    it("should have correct structure", () => {
      const file: FileMetadata = {
        name: "medical-report.pdf",
        url: "https://example.com/report.pdf",
        type: "application/pdf",
        size: 1024000,
        extracted_text: "Patient has...",
      };

      expect(file.name).toBe("medical-report.pdf");
      expect(file.url).toBe("https://example.com/report.pdf");
      expectTypeOf(file.size).toEqualTypeOf<number | undefined>();
    });
  });

  describe("TongueAnalysisData", () => {
    it("should have correct structure", () => {
      const analysis: TongueAnalysisData = {
        image_url: "https://example.com/tongue.jpg",
        observation: "Tongue is pale with white coating",
        analysis_tags: ["pale", "white-coating"],
        tcm_indicators: ["Qi Deficiency", "Cold Pattern"],
        pattern_suggestions: ["Spleen Qi Deficiency"],
        potential_issues: ["Digestive weakness"],
      };

      expect(analysis.image_url).toBeDefined();
      expect(analysis.tcm_indicators).toBeInstanceOf(Array);
      expectTypeOf(analysis.analysis_tags).toEqualTypeOf<string[] | undefined>();
    });
  });

  describe("FaceAnalysisData", () => {
    it("should have correct structure", () => {
      const analysis: FaceAnalysisData = {
        image_url: "https://example.com/face.jpg",
        observation: "Face appears pale",
        analysis_tags: ["pale-complexion"],
        tcm_indicators: ["Blood Deficiency"],
        potential_issues: ["Anemia"],
      };

      expect(analysis.image_url).toBeDefined();
      expectTypeOf(analysis.tcm_indicators).toEqualTypeOf<string[] | undefined>();
    });
  });

  describe("BodyAnalysisData", () => {
    it("should have correct structure", () => {
      const analysis: BodyAnalysisData = {
        image_url: "https://example.com/body.jpg",
        observation: "Swelling in lower limbs",
        analysis_tags: ["edema"],
        potential_issues: ["Fluid retention"],
      };

      expect(analysis.image_url).toBeDefined();
      expectTypeOf(analysis.potential_issues).toEqualTypeOf<string[] | undefined>();
    });
  });

  describe("AudioAnalysisData", () => {
    it("should have correct structure", () => {
      const analysis: AudioAnalysisData = {
        audio_url: "https://example.com/audio.mp3",
        observation: "Voice sounds weak and hoarse",
        potential_issues: ["Lung Qi Deficiency"],
      };

      expect(analysis.audio_url).toBeDefined();
      expectTypeOf(analysis.potential_issues).toEqualTypeOf<string[] | undefined>();
    });
  });

  describe("PulseData", () => {
    it("should have correct structure", () => {
      const pulse: PulseData = {
        bpm: 72,
        quality: "smooth",
        rhythm: "regular",
        strength: "moderate",
        notes: "Normal pulse",
      };

      expect(pulse.bpm).toBe(72);
      expectTypeOf(pulse.bpm).toEqualTypeOf<number | undefined>();
      expectTypeOf(pulse.quality).toEqualTypeOf<string | undefined>();
    });
  });

  describe("DiagnosisSession", () => {
    it("should include all new input data fields", () => {
      const session: DiagnosisSession = {
        id: "session-1",
        user_id: "user-1",
        primary_diagnosis: "Qi Deficiency",
        constitution: "Qi Deficient",
        overall_score: 75,
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
        // New input data fields
        inquiry_summary: "Patient reported headaches",
        inquiry_chat_history: [
          { role: "user", content: "I have headaches" },
          { role: "assistant", content: "How long?" },
        ],
        inquiry_report_files: [
          {
            name: "report.pdf",
            url: "https://example.com/report.pdf",
            type: "application/pdf",
          },
        ],
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
          observation: "Pale tongue",
          tcm_indicators: ["Qi Deficiency"],
        },
        face_analysis: {
          image_url: "https://example.com/face.jpg",
          observation: "Pale face",
        },
        audio_analysis: {
          audio_url: "https://example.com/audio.mp3",
          observation: "Weak voice",
        },
        pulse_data: {
          bpm: 72,
          quality: "smooth",
        },
        is_guest_session: false,
      };

      expect(session.inquiry_summary).toBeDefined();
      expect(session.inquiry_chat_history).toBeInstanceOf(Array);
      expect(session.tongue_analysis).toBeDefined();
      expect(session.pulse_data?.bpm).toBe(72);
    });

    it("should allow null for optional input data fields", () => {
      const session: DiagnosisSession = {
        id: "session-2",
        user_id: "user-2",
        primary_diagnosis: "Yin Deficiency",
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
        inquiry_summary: null,
        inquiry_chat_history: null,
        tongue_analysis: null,
        face_analysis: null,
        audio_analysis: null,
        pulse_data: null,
      };

      expect(session.inquiry_summary).toBeNull();
      expectTypeOf(session.inquiry_summary).toEqualTypeOf<string | null | undefined>();
    });

    it("should include guest session fields", () => {
      const guestSession: DiagnosisSession = {
        id: "session-3",
        user_id: "user-3",
        primary_diagnosis: "Damp Heat",
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
        is_guest_session: true,
        guest_email: "guest@example.com",
        guest_name: "Guest User",
      };

      expect(guestSession.is_guest_session).toBe(true);
      expect(guestSession.guest_email).toBe("guest@example.com");
      expectTypeOf(guestSession.is_guest_session).toEqualTypeOf<boolean | null | undefined>();
    });
  });

  describe("SaveDiagnosisInput", () => {
    it("should include all new input data fields", () => {
      const input: SaveDiagnosisInput = {
        primary_diagnosis: "Qi Deficiency",
        full_report: {} as DiagnosisReport,
        inquiry_summary: "Patient summary",
        inquiry_chat_history: [{ role: "user", content: "Test" }],
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
          observation: "Pale",
        },
        pulse_data: {
          bpm: 72,
        },
        is_guest_session: false,
      };

      expect(input.inquiry_summary).toBeDefined();
      expect(input.tongue_analysis).toBeDefined();
      expectTypeOf(input.inquiry_chat_history).toEqualTypeOf<ChatMessage[] | undefined>();
    });

    it("should allow optional input data fields", () => {
      const minimalInput: SaveDiagnosisInput = {
        primary_diagnosis: "Yin Deficiency",
        full_report: {} as DiagnosisReport,
      };

      expect(minimalInput.inquiry_summary).toBeUndefined();
      expect(minimalInput.tongue_analysis).toBeUndefined();
    });
  });

  describe("GuestDiagnosisSession", () => {
    it("should have correct structure", () => {
      const guestSession: GuestDiagnosisSession = {
        id: "guest-1",
        session_token: "token-123",
        guest_email: "guest@example.com",
        guest_name: "Guest",
        primary_diagnosis: "Qi Deficiency",
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
        inquiry_summary: "Summary",
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
        },
      };

      expect(guestSession.session_token).toBe("token-123");
      expect(guestSession.guest_email).toBe("guest@example.com");
      expectTypeOf(guestSession.migrated_to_user_id).toEqualTypeOf<string | null | undefined>();
    });

    it("should allow migration fields", () => {
      const migratedSession: GuestDiagnosisSession = {
        id: "guest-2",
        session_token: "token-456",
        primary_diagnosis: "Yin Deficiency",
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
        migrated_to_user_id: "user-123",
        migrated_at: "2025-01-02T11:00:00Z",
      };

      expect(migratedSession.migrated_to_user_id).toBe("user-123");
      expect(migratedSession.migrated_at).toBeDefined();
    });
  });

  describe("SaveGuestDiagnosisInput", () => {
    it("should require session_token", () => {
      const input: SaveGuestDiagnosisInput = {
        session_token: "token-789",
        primary_diagnosis: "Damp Heat",
        full_report: {} as DiagnosisReport,
      };

      expect(input.session_token).toBe("token-789");
      expectTypeOf(input.session_token).toEqualTypeOf<string>();
    });

    it("should include all input data fields", () => {
      const input: SaveGuestDiagnosisInput = {
        session_token: "token-999",
        primary_diagnosis: "Qi Deficiency",
        full_report: {} as DiagnosisReport,
        guest_email: "guest@example.com",
        inquiry_summary: "Summary",
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
        },
        pulse_data: {
          bpm: 72,
        },
      };

      expect(input.guest_email).toBe("guest@example.com");
      expect(input.tongue_analysis).toBeDefined();
    });
  });

  describe("Type Compatibility", () => {
    it("should allow converting SaveDiagnosisInput to DiagnosisSession structure", () => {
      const input: SaveDiagnosisInput = {
        primary_diagnosis: "Test",
        full_report: {} as DiagnosisReport,
        inquiry_summary: "Test summary",
        tongue_analysis: {
          image_url: "https://example.com/tongue.jpg",
        },
      };

      // This should compile without errors
      const session: Partial<DiagnosisSession> = {
        primary_diagnosis: input.primary_diagnosis,
        full_report: input.full_report,
        inquiry_summary: input.inquiry_summary || null,
        tongue_analysis: input.tongue_analysis || null,
      };

      expect(session.primary_diagnosis).toBe("Test");
      expect(session.inquiry_summary).toBe("Test summary");
    });

    it("should allow converting GuestDiagnosisSession to DiagnosisSession", () => {
      const guestSession: GuestDiagnosisSession = {
        id: "guest-1",
        session_token: "token",
        primary_diagnosis: "Test",
        full_report: {} as DiagnosisReport,
        created_at: "2025-01-02T10:00:00Z",
        updated_at: "2025-01-02T10:00:00Z",
      };

      // Should be able to map guest session to regular session
      const session: Partial<DiagnosisSession> = {
        id: guestSession.id,
        user_id: guestSession.migrated_to_user_id || "",
        primary_diagnosis: guestSession.primary_diagnosis,
        full_report: guestSession.full_report,
        is_guest_session: true,
        guest_email: guestSession.guest_email || null,
        created_at: guestSession.created_at,
        updated_at: guestSession.updated_at,
      };

      expect(session.primary_diagnosis).toBe("Test");
      expect(session.is_guest_session).toBe(true);
    });
  });
});

