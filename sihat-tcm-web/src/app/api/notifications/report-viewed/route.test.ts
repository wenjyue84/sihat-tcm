/**
 * API route tests: POST /api/notifications/report-viewed
 * Medium level: handler calls telegram and returns correct response.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/telegram", () => ({
  sendReportViewedNotification: vi.fn().mockResolvedValue(undefined),
}));

const { sendReportViewedNotification } = await import("@/lib/telegram");

describe("POST /api/notifications/report-viewed", () => {
  beforeEach(() => {
    vi.mocked(sendReportViewedNotification).mockClear();
  });

  it("returns 200 and ok: true when notification succeeds", async () => {
    const req = new Request("http://localhost/api/notifications/report-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(sendReportViewedNotification).toHaveBeenCalledTimes(1);
    expect(sendReportViewedNotification).toHaveBeenCalledWith({ isGuest: undefined });
  });

  it("passes isGuest: true when body has isGuest true", async () => {
    const req = new Request("http://localhost/api/notifications/report-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isGuest: true }),
    });

    await POST(req as never);

    expect(sendReportViewedNotification).toHaveBeenCalledWith({ isGuest: true });
  });

  it("passes isGuest: false when body has isGuest false", async () => {
    const req = new Request("http://localhost/api/notifications/report-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isGuest: false }),
    });

    await POST(req as never);

    expect(sendReportViewedNotification).toHaveBeenCalledWith({ isGuest: false });
  });

  it("handles invalid JSON body without throwing", async () => {
    const req = new Request("http://localhost/api/notifications/report-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(sendReportViewedNotification).toHaveBeenCalledWith({ isGuest: undefined });
  });

  it("returns 500 when sendReportViewedNotification throws", async () => {
    vi.mocked(sendReportViewedNotification).mockRejectedValueOnce(new Error("Telegram error"));

    const req = new Request("http://localhost/api/notifications/report-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ ok: false });
  });
});
