import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { PullToRefresh } from "./PullToRefresh";
import { vi, describe, it, expect, beforeEach, afterEach, MockedFunction } from "vitest";

// Mock useDeviceInfo hook
vi.mock("@/hooks/usePlatformOptimizer", () => ({
    useDeviceInfo: vi.fn(),
}));

import { useDeviceInfo } from "@/hooks/usePlatformOptimizer";

const mockUseDeviceInfo = useDeviceInfo as MockedFunction<typeof useDeviceInfo>;

describe("PullToRefresh", () => {
    const defaultDeviceInfo = {
        type: "mobile" as const,
        platform: "ios" as const,
        browser: "safari" as const,
        hasTouch: true,
        isStandalone: false,
        screenSize: { width: 375, height: 812 },
        pixelRatio: 3,
        orientation: "portrait" as const,
        capabilities: {
            webgl: true,
            webrtc: true,
            mediaDevices: true,
            geolocation: true,
            vibration: true,
            notifications: true,
            serviceWorker: true,
        },
    };

    beforeEach(() => {
        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // deprecated
                removeListener: vi.fn(), // deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        mockUseDeviceInfo.mockReturnValue(defaultDeviceInfo);
        // Mock navigator.vibrate
        Object.defineProperty(navigator, "vibrate", {
            value: vi.fn(() => true),
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders children correctly", () => {
        render(
            <PullToRefresh onRefresh={vi.fn()}>
                <div data-testid="child">Content</div>
            </PullToRefresh>
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("calls onRefresh when pulled past threshold", async () => {
        const onRefresh = vi.fn();
        const { container } = render(
            <PullToRefresh onRefresh={onRefresh} threshold={80}>
                <div>Content</div>
            </PullToRefresh>
        );

        const pullContainer = container.firstChild as HTMLElement;

        // Simulate touch gesture
        await act(async () => {
            fireEvent.touchStart(pullContainer, {
                touches: [{ clientY: 0 }],
            });

            fireEvent.touchMove(pullContainer, {
                touches: [{ clientY: 100 }], // Past threshold of 80
            });

            fireEvent.touchEnd(pullContainer);
        });

        await waitFor(() => {
            expect(onRefresh).toHaveBeenCalledTimes(1);
        });
    });

    it("does NOT call onRefresh when pulled below threshold", async () => {
        const onRefresh = vi.fn();
        const { container } = render(
            <PullToRefresh onRefresh={onRefresh} threshold={80}>
                <div>Content</div>
            </PullToRefresh>
        );

        const pullContainer = container.firstChild as HTMLElement;

        // Simulate touch gesture below threshold
        await act(async () => {
            fireEvent.touchStart(pullContainer, {
                touches: [{ clientY: 0 }],
            });

            fireEvent.touchMove(pullContainer, {
                touches: [{ clientY: 50 }], // Below threshold of 80
            });

            fireEvent.touchEnd(pullContainer);
        });

        expect(onRefresh).not.toHaveBeenCalled();
    });

    it("renders null indicator on non-touch (desktop) devices", () => {
        mockUseDeviceInfo.mockReturnValue({
            ...defaultDeviceInfo,
            hasTouch: false,
            type: "desktop",
        });

        const { container } = render(
            <PullToRefresh onRefresh={vi.fn()}>
                <div data-testid="child">Content</div>
            </PullToRefresh>
        );

        // Should still render children
        expect(screen.getByTestId("child")).toBeInTheDocument();

        // Should NOT have pull indicator elements (check for specific class)
        const pullIndicator = container.querySelector('[aria-hidden="true"]');
        expect(pullIndicator).not.toBeInTheDocument();
    });

    it("triggers haptic feedback when crossing threshold", async () => {
        const vibrateMock = vi.fn(() => true);
        Object.defineProperty(navigator, "vibrate", {
            value: vibrateMock,
            writable: true,
            configurable: true,
        });

        const { container } = render(
            <PullToRefresh onRefresh={vi.fn()} threshold={80}>
                <div>Content</div>
            </PullToRefresh>
        );

        const pullContainer = container.firstChild as HTMLElement;

        await act(async () => {
            fireEvent.touchStart(pullContainer, {
                touches: [{ clientY: 0 }],
            });

            // Move past threshold
            fireEvent.touchMove(pullContainer, {
                touches: [{ clientY: 100 }],
            });
        });

        expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it("does not trigger refresh when disabled", async () => {
        const onRefresh = vi.fn();
        const { container } = render(
            <PullToRefresh onRefresh={onRefresh} threshold={80} disabled>
                <div>Content</div>
            </PullToRefresh>
        );

        const pullContainer = container.firstChild as HTMLElement;

        await act(async () => {
            fireEvent.touchStart(pullContainer, {
                touches: [{ clientY: 0 }],
            });

            fireEvent.touchMove(pullContainer, {
                touches: [{ clientY: 100 }],
            });

            fireEvent.touchEnd(pullContainer);
        });

        expect(onRefresh).not.toHaveBeenCalled();
    });

    it("shows correct visual state when past threshold", async () => {
        const { container } = render(
            <PullToRefresh onRefresh={vi.fn()} threshold={80}>
                <div>Content</div>
            </PullToRefresh>
        );

        const pullContainer = container.firstChild as HTMLElement;

        await act(async () => {
            fireEvent.touchStart(pullContainer, {
                touches: [{ clientY: 0 }],
            });

            fireEvent.touchMove(pullContainer, {
                touches: [{ clientY: 100 }],
            });
        });

        // Check for emerald background (past threshold indicator)
        const indicator = container.querySelector(".bg-emerald-500");
        expect(indicator).toBeInTheDocument();
    });
});
