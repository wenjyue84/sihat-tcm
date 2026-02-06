/**
 * DiagnosisSessionManager Tests
 *
 * Comprehensive test suite for the DiagnosisSessionManager class.
 * Tests session lifecycle, auto-save, recovery, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { DiagnosisSessionManager } from "./DiagnosisSessionManager";
import type { DiagnosisWizardData, SaveDiagnosisInput } from "@/types/diagnosis";

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    upsert: vi.fn(() => ({ error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
      gte: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null })),
        })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: "test-diagnosis-id" }, error: null })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
      lt: vi.fn(() => ({
        select: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
  })),
};

// Mock logger
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock createClient
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("DiagnosisSessionManager", () => {
  let sessionManager: DiagnosisSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionManager = new DiagnosisSessionManager({
      autoSaveInterval: 1000, // 1 second for testing
      maxRetries: 2,
      sessionTimeout: 3600000,
      enableLocalBackup: true,
    });
  });

  afterEach(() => {
    sessionManager.destroy();
  });

  describe("Session Initialization", () => {
    it("should initialize a new session for authenticated user", async () => {
      const userId = "test-user-id";
      const initialData: Partial<DiagnosisWizardData> = {
        basic_info: { name: "Test User", age: 30 },
      };

      const metadata = await sessionManager.initializeSession(userId, undefined, initialData);

      expect(metadata).toMatchObject({
        userId,
        isGuest: false,
        currentStep: "basic_info",
        completionPercentage: 0,
      });
      expect(metadata.sessionId).toBeDefined();
      expect(metadata.startTime).toBeInstanceOf(Date);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Diagnosis session initialized",
        expect.objectContaining({ sessionId: metadata.sessionId, userId, isGuest: false })
      );
    });

    it("should initialize a new session for guest user", async () => {
      const guestToken = "guest-token-123";

      const metadata = await sessionManager.initializeSession(undefined, guestToken);

      expect(metadata).toMatchObject({
        guestToken,
        isGuest: true,
        currentStep: "basic_info",
        completionPercentage: 0,
      });
      expect(metadata.userId).toBeUndefined();
    });

    it("should handle initialization errors gracefully", async () => {
      // Mock database error
      const mockError = new Error("Database connection failed");
      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        upsert: vi.fn(() => ({ error: mockError })),
      });

      await expect(sessionManager.initializeSession("test-user")).rejects.toThrow(
        "Failed to initialize diagnosis session"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("Session Data Management", () => {
    let sessionMetadata: any;

    beforeEach(async () => {
      sessionMetadata = await sessionManager.initializeSession("test-user");
    });

    it("should save session data successfully", async () => {
      const testData: Partial<DiagnosisWizardData> = {
        basic_info: { name: "Updated User", age: 35 },
        wen_inquiry: { summary: "Test inquiry" },
      };

      const result = await sessionManager.saveSessionData(
        sessionMetadata.sessionId,
        testData,
        sessionMetadata
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionMetadata.sessionId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("diagnosis_session_drafts");
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should retry on save failure", async () => {
      // Mock first call to fail, second to succeed
      const mockError = new Error("Temporary failure");
      (mockSupabaseClient.from as Mock)
        .mockReturnValueOnce({
          upsert: vi.fn(() => ({ error: mockError })),
        })
        .mockReturnValueOnce({
          upsert: vi.fn(() => ({ error: null })),
        });

      const testData: Partial<DiagnosisWizardData> = {
        basic_info: { name: "Test" },
      };

      const result = await sessionManager.saveSessionData(
        sessionMetadata.sessionId,
        testData,
        sessionMetadata
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });

    it("should fail after max retries", async () => {
      // Mock all calls to fail
      const mockError = new Error("Persistent failure");
      (mockSupabaseClient.from as Mock).mockReturnValue({
        upsert: vi.fn(() => ({ error: mockError })),
      });

      const testData: Partial<DiagnosisWizardData> = {
        basic_info: { name: "Test" },
      };

      const result = await sessionManager.saveSessionData(
        sessionMetadata.sessionId,
        testData,
        sessionMetadata
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Persistent failure");
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe("Session Recovery", () => {
    it("should recover available sessions for user", async () => {
      const mockSessions = [
        {
          session_id: "session-1",
          user_id: "test-user",
          data: { basic_info: { name: "Test" } },
          metadata: { currentStep: "wen_inquiry", completionPercentage: 50 },
          updated_at: new Date().toISOString(),
        },
      ];

      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({ data: mockSessions, error: null })),
            })),
          })),
        })),
      });

      const sessions = await sessionManager.recoverSessions({
        includeIncomplete: true,
        maxAge: 24,
        userId: "test-user",
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        step: "wen_inquiry",
        sessionId: "session-1",
        completionPercentage: 50,
      });
    });

    it("should resume a specific session", async () => {
      const mockSessionData = {
        session_id: "session-1",
        user_id: "test-user",
        data: { basic_info: { name: "Test User" } },
        metadata: {
          currentStep: "wang_tongue",
          completionPercentage: 75,
          startTime: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: mockSessionData, error: null })),
          })),
        })),
      });

      const result = await sessionManager.resumeSession("session-1");

      expect(result).toBeDefined();
      expect(result!.metadata.sessionId).toBe("session-1");
      expect(result!.metadata.currentStep).toBe("wang_tongue");
      expect(result!.metadata.completionPercentage).toBe(75);
      expect(result!.data).toEqual({ basic_info: { name: "Test User" } });
    });

    it("should return null for non-existent session", async () => {
      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: new Error("Not found") })),
          })),
        })),
      });

      const result = await sessionManager.resumeSession("non-existent");

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("Session Completion", () => {
    let sessionMetadata: any;

    beforeEach(async () => {
      sessionMetadata = await sessionManager.initializeSession("test-user");
    });

    it("should complete session successfully", async () => {
      const finalData: DiagnosisWizardData = {
        basic_info: { name: "Test User", age: 30 },
        wen_inquiry: { summary: "Test inquiry" },
        wang_tongue: null,
        wang_face: null,
        wang_part: null,
        wen_audio: null,
        wen_chat: [],
        qie: null,
        smart_connect: null,
      };

      const diagnosisResult: SaveDiagnosisInput = {
        primary_diagnosis: "Test Diagnosis",
        full_report: {
          diagnosis: "Test Pattern",
          constitution: "Test Constitution",
          analysis: { summary: "Test analysis" },
          recommendations: {},
        },
      };

      const result = await sessionManager.completeSession(
        sessionMetadata.sessionId,
        finalData,
        diagnosisResult
      );

      expect(result.success).toBe(true);
      expect(result.diagnosisId).toBe("test-diagnosis-id");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("diagnosis_sessions");
    });

    it("should handle completion errors", async () => {
      const mockError = new Error("Database error");
      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: mockError })),
          })),
        })),
      });

      const finalData: DiagnosisWizardData = {
        basic_info: null,
        wen_inquiry: null,
        wang_tongue: null,
        wang_face: null,
        wang_part: null,
        wen_audio: null,
        wen_chat: [],
        qie: null,
        smart_connect: null,
      };

      const diagnosisResult: SaveDiagnosisInput = {
        primary_diagnosis: "Test",
        full_report: {
          diagnosis: "Test",
          constitution: "Test",
          analysis: { summary: "Test" },
          recommendations: {},
        },
      };

      const result = await sessionManager.completeSession(
        sessionMetadata.sessionId,
        finalData,
        diagnosisResult
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("Session Cleanup", () => {
    it("should cleanup individual session", async () => {
      await sessionManager.cleanupSession("test-session-id");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("diagnosis_session_drafts");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("diagnosis_session_test-session-id");
    });

    it("should cleanup expired sessions", async () => {
      const mockExpiredSessions = [{ session_id: "expired-1" }, { session_id: "expired-2" }];

      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        delete: vi.fn(() => ({
          lt: vi.fn(() => ({
            select: vi.fn(() => ({ data: mockExpiredSessions, error: null })),
          })),
        })),
      });

      const cleanedCount = await sessionManager.cleanupExpiredSessions();

      expect(cleanedCount).toBe(2);
      expect(mockLogger.info).toHaveBeenCalledWith("Expired sessions cleaned up", { count: 2 });
    });
  });

  describe("Progress Tracking", () => {
    let sessionMetadata: any;

    beforeEach(async () => {
      sessionMetadata = await sessionManager.initializeSession("test-user");
    });

    it("should update progress correctly", () => {
      sessionManager.updateProgress("wang_tongue", 60, 300);

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toMatchObject({
        currentStep: "wang_tongue",
        completionPercentage: 60,
        estimatedTimeRemaining: 300,
      });
    });

    it("should return current session metadata", () => {
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(currentSession!.sessionId).toBe(sessionMetadata.sessionId);
    });
  });

  describe("Local Backup", () => {
    it("should save and recover from local backup", async () => {
      const mockBackupData = {
        session_id: "backup-session",
        data: { basic_info: { name: "Backup Test" } },
        metadata: { currentStep: "wen_inquiry" },
        updated_at: new Date().toISOString(),
      };

      // Mock localStorage to return backup data
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValueOnce("diagnosis_session_backup-session");
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockBackupData));

      // Mock database failure to trigger local backup recovery
      (mockSupabaseClient.from as Mock).mockReturnValueOnce({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({ data: [], error: new Error("DB Error") })),
            })),
          })),
        })),
      });

      const sessions = await sessionManager.recoverSessions({
        includeIncomplete: true,
        maxAge: 24,
        userId: "test-user",
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe("backup-session");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network error");
      (mockSupabaseClient.from as Mock).mockReturnValue({
        upsert: vi.fn(() => ({ error: networkError })),
      });

      const sessionMetadata = await sessionManager.initializeSession("test-user");
      const result = await sessionManager.saveSessionData(
        sessionMetadata.sessionId,
        { basic_info: { name: "Test" } },
        sessionMetadata
      );

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle malformed local storage data", async () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValueOnce("diagnosis_session_malformed");
      mockLocalStorage.getItem.mockReturnValueOnce("invalid json");

      // Should not throw error
      const sessions = await sessionManager.recoverSessions({
        includeIncomplete: true,
        maxAge: 24,
        userId: "test-user",
      });

      expect(sessions).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", () => {
      const customManager = new DiagnosisSessionManager({
        autoSaveInterval: 5000,
        maxRetries: 5,
        enableLocalBackup: false,
      });

      expect(customManager).toBeDefined();
      customManager.destroy();
    });

    it("should use default configuration when none provided", () => {
      const defaultManager = new DiagnosisSessionManager();
      expect(defaultManager).toBeDefined();
      defaultManager.destroy();
    });
  });
});
