import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "../MobileBottomNav";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
    motion: {
        button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => (
            <button {...props}>{children}</button>
        ),
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
}));

describe("MobileBottomNav", () => {
    const defaultProps = {
        activeSection: "journey" as const,
        onSectionChange: vi.fn(),
        onMoreClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock matchMedia for responsive behavior testing
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders all 5 navigation items", () => {
        render(<MobileBottomNav {...defaultProps} />);

        expect(screen.getByLabelText("Journey")).toBeInTheDocument();
        expect(screen.getByLabelText("Profile")).toBeInTheDocument();
        expect(screen.getByLabelText("Meals")).toBeInTheDocument();
        expect(screen.getByLabelText("Heart")).toBeInTheDocument();
        expect(screen.getByLabelText("More")).toBeInTheDocument();
    });

    it("highlights the active section correctly", () => {
        render(<MobileBottomNav {...defaultProps} activeSection="journey" />);

        const journeyButton = screen.getByLabelText("Journey");
        expect(journeyButton).toHaveAttribute("aria-current", "page");

        const profileButton = screen.getByLabelText("Profile");
        expect(profileButton).not.toHaveAttribute("aria-current");
    });

    it("calls onSectionChange when a section button is clicked", () => {
        const onSectionChange = vi.fn();
        render(<MobileBottomNav {...defaultProps} onSectionChange={onSectionChange} />);

        fireEvent.click(screen.getByLabelText("Profile"));

        expect(onSectionChange).toHaveBeenCalledWith("profile");
        expect(onSectionChange).toHaveBeenCalledTimes(1);
    });

    it("calls onMoreClick when More button is clicked", () => {
        const onMoreClick = vi.fn();
        render(<MobileBottomNav {...defaultProps} onMoreClick={onMoreClick} />);

        fireEvent.click(screen.getByLabelText("More"));

        expect(onMoreClick).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onSectionChange when More is clicked", () => {
        const onSectionChange = vi.fn();
        const onMoreClick = vi.fn();
        render(
            <MobileBottomNav
                {...defaultProps}
                onSectionChange={onSectionChange}
                onMoreClick={onMoreClick}
            />
        );

        fireEvent.click(screen.getByLabelText("More"));

        expect(onSectionChange).not.toHaveBeenCalled();
        expect(onMoreClick).toHaveBeenCalled();
    });

    it("shows More as active when activeSection is not in bottom nav", () => {
        // "settings" is not in bottom nav items
        render(<MobileBottomNav {...defaultProps} activeSection="settings" />);

        const moreButton = screen.getByLabelText("More");
        expect(moreButton).toHaveAttribute("aria-current", "page");

        // Other buttons should not be active
        const journeyButton = screen.getByLabelText("Journey");
        expect(journeyButton).not.toHaveAttribute("aria-current");
    });

    it("has correct accessibility attributes", () => {
        render(<MobileBottomNav {...defaultProps} />);

        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Main navigation");
    });

    it("has md:hidden class for desktop hiding", () => {
        const { container } = render(<MobileBottomNav {...defaultProps} />);

        const nav = container.querySelector("nav");
        expect(nav).toHaveClass("md:hidden");
    });
});
