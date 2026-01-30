"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviceInfo } from "@/hooks/usePlatformOptimizer";

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => void | Promise<void>;
    threshold?: number;
    maxPull?: number;
    className?: string;
    disabled?: boolean;
}

/**
 * PullToRefresh Component
 *
 * Native-feeling pull-to-refresh gesture for mobile/touch devices.
 * Automatically hidden on non-touch devices.
 *
 * Features:
 * - Touch gesture detection (touchstart/touchmove/touchend)
 * - Visual pull indicator with animated icon
 * - Haptic feedback on threshold reached
 * - Debounced to prevent rapid refreshes
 */
export function PullToRefresh({
    children,
    onRefresh,
    threshold = 80,
    maxPull = 120,
    className,
    disabled = false,
}: PullToRefreshProps) {
    const deviceInfo = useDeviceInfo();
    const containerRef = useRef<HTMLDivElement>(null);

    // Use refs for mutable logic state to avoid stale closures in event handlers
    const stateRef = useRef({
        startY: 0,
        currentY: 0,
        isPulling: false,
        isRefreshing: false,
        hapticTriggered: false
    });

    // UI state for rendering
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const progress = Math.min(pullDistance / threshold, 1);
    const isPastThreshold = pullDistance >= threshold;

    // Haptic feedback helper
    const triggerHaptic = useCallback(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10); // Short vibration
        }
    }, []);

    // Handle touch start
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (disabled || stateRef.current.isRefreshing) return;

            // Check both container and window scroll position
            const scrollTop = (containerRef.current?.scrollTop || 0) + (typeof window !== 'undefined' ? window.scrollY : 0);

            // Only trigger if at the top
            if (scrollTop > 5) return; // Allow small buffer

            const clientY = e.touches[0].clientY;

            stateRef.current = {
                ...stateRef.current,
                startY: clientY,
                currentY: clientY,
                isPulling: true,
                hapticTriggered: false
            };
        },
        [disabled]
    );

    // Handle touch move
    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            // Logic check using ref to ensure freshness
            if (!stateRef.current.isPulling || stateRef.current.isRefreshing) return;

            const clientY = e.touches[0].clientY;
            const newPullDistance = Math.max(0, Math.min(
                clientY - stateRef.current.startY,
                maxPull
            ));

            // Only prevent default if pulling down (not scrolling up)
            if (newPullDistance > 0 && e.cancelable) {
                // Optionally prevent default to stop native scroll behaviors if needed
                // e.preventDefault(); 
            }

            stateRef.current.currentY = clientY;

            // Update UI state
            setPullDistance(newPullDistance);

            // Trigger haptic once when crossing threshold
            if (newPullDistance >= threshold && !stateRef.current.hapticTriggered) {
                triggerHaptic();
                stateRef.current.hapticTriggered = true;
            }
        },
        [maxPull, threshold, triggerHaptic]
    );

    // Handle touch end
    const handleTouchEnd = useCallback(async () => {
        if (!stateRef.current.isPulling) return;

        const finalDistance = Math.max(0, Math.min(
            stateRef.current.currentY - stateRef.current.startY,
            maxPull
        ));
        const isPast = finalDistance >= threshold;

        stateRef.current.isPulling = false;

        if (isPast && !stateRef.current.isRefreshing) {
            // Trigger refresh
            stateRef.current.isRefreshing = true;
            setIsRefreshing(true);

            try {
                await onRefresh();
            } finally {
                // Reset after animation delay
                setTimeout(() => {
                    stateRef.current = {
                        startY: 0,
                        currentY: 0,
                        isPulling: false,
                        isRefreshing: false,
                        hapticTriggered: false
                    };
                    setPullDistance(0);
                    setIsRefreshing(false);
                }, 500);
            }
        } else {
            // Reset without refresh
            stateRef.current.isPulling = false;
            setPullDistance(0);
        }
    }, [maxPull, threshold, onRefresh]);

    // Reset on orientation change
    useEffect(() => {
        const handleOrientationChange = () => {
            stateRef.current = {
                startY: 0,
                currentY: 0,
                isPulling: false,
                isRefreshing: false,
                hapticTriggered: false
            };
            setPullDistance(0);
            setIsRefreshing(false);
        };

        window.addEventListener("orientationchange", handleOrientationChange);
        return () => window.removeEventListener("orientationchange", handleOrientationChange);
    }, []);

    // Don't render pull indicator on non-touch devices (PC mode invisible)
    if (!deviceInfo.hasTouch) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Pull Indicator */}
            <div
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200 ease-out pointer-events-none",
                    pullDistance > 0 || isRefreshing
                        ? "opacity-100"
                        : "opacity-0"
                )}
                style={{
                    top: Math.max(-40, pullDistance - 50),
                    transform: `translateX(-50%) rotate(${progress * 180}deg)`,
                }}
                aria-hidden="true"
            >
                <div
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200",
                        isPastThreshold || isRefreshing
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-stone-600 border border-stone-200"
                    )}
                >
                    {isRefreshing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                        <ArrowDown
                            className={cn(
                                "w-5 h-5 transition-transform duration-200",
                                isPastThreshold && "rotate-180"
                            )}
                        />
                    )}
                </div>
            </div>

            {/* Pull Progress Bar */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className="absolute top-0 left-0 right-0 h-1 bg-emerald-100 z-40 overflow-hidden"
                    aria-hidden="true"
                >
                    <div
                        className={cn(
                            "h-full transition-all duration-150 ease-out",
                            isPastThreshold || isRefreshing
                                ? "bg-emerald-500"
                                : "bg-emerald-300"
                        )}
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            )}

            {/* Content with pull offset */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{
                    transform:
                        pullDistance > 0 || isRefreshing
                            ? `translateY(${Math.min(pullDistance * 0.4, 48)}px)`
                            : "translateY(0)",
                }}
            >
                {children}
            </div>
        </div>
    );
}

export default PullToRefresh;
