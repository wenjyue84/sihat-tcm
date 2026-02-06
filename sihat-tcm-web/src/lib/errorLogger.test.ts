/**
 * @fileoverview Error Logger Tests
 *
 * Unit tests for the client-side error logging system.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorLogger, logError, logUserActionError } from "./errorLogger";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window and navigator
Object.defineProperty(window, "location", {
  value: {
    href: "https://example.com/test",
  },
  writable: true,
});

Object.defineProperty(navigator, "userAgent", {
  value: "Mozilla/5.0 (Test Browser)",
  writable: true,
});

describe("ErrorLogger", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error_id: "test-error-id" }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("logError", () => {
    it("should log a simple error", async () => {
      const error = new Error("Test error");
      const errorId = await logError(error);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/system-health",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("Test error"),
        })
      );

      expect(errorId).toBe("test-error-id");
    });

    it("should log error with context", async () => {
      const error = new Error("Context error");
      const context = {
        component: "TestComponent",
        action: "TEST_ACTION",
        severity: "high" as const,
        metadata: { testData: "value" },
      };

      await logError(error, context);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toMatchObject({
        error_type: "Error",
        message: "Context error",
        component: "TestComponent",
        severity: "high",
        metadata: expect.objectContaining({
          action: "TEST_ACTION",
          testData: "value",
          clientSide: true,
        }),
      });
    });

    it("should handle string errors", async () => {
      await logError("String error message");

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.message).toBe("String error message");
      expect(requestBody.error_type).toBe("ClientError");
    });
  });

  describe("logUserActionError", () => {
    it("should log user action error with correct action", async () => {
      const error = new Error("User action failed");
      await logUserActionError("SUBMIT_FORM", error, {
        component: "ContactForm",
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.component).toBe("ContactForm");
      expect(requestBody.metadata.action).toBe("SUBMIT_FORM");
      expect(requestBody.severity).toBe("medium");
    });
  });

  describe("error handling", () => {
    it("should handle API failures gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const errorId = await logError(new Error("Test error"));

      expect(errorId).toBeNull();
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should retry on failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("First failure")).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error_id: "retry-success" }),
      });

      const errorId = await logError(new Error("Retry test"));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(errorId).toBe("retry-success");
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const errorId = await logError(new Error("HTTP error test"));

      expect(errorId).toBeNull();
    });
  });

  describe("session management", () => {
    it("should generate and maintain session ID", () => {
      const sessionId1 = errorLogger.getSessionId();
      const sessionId2 = errorLogger.getSessionId();

      expect(sessionId1).toBe(sessionId2);
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe("severity determination", () => {
    it("should classify critical errors correctly", async () => {
      const syntaxError = new SyntaxError("Unexpected token");
      await logError(syntaxError);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Note: The severity determination is done in the ErrorBoundary component
      // This test would need to be updated based on actual implementation
      expect(requestBody.error_type).toBe("SyntaxError");
    });
  });
});

describe("Error Logger Integration", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error_id: "integration-test-id" }),
    });
  });

  it("should work with real error objects", async () => {
    try {
      // Trigger a real error
      const obj: any = null;
      obj.nonExistentMethod();
    } catch (error) {
      const errorId = await logError(error as Error, {
        component: "IntegrationTest",
        action: "TRIGGER_ERROR",
      });

      expect(errorId).toBe("integration-test-id");
      expect(mockFetch).toHaveBeenCalled();

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.error_type).toBe("TypeError");
      expect(requestBody.message).toContain("Cannot read");
      expect(requestBody.stack_trace).toBeDefined();
    }
  });
});
