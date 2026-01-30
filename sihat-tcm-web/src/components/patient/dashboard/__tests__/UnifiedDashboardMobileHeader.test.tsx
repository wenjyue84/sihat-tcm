/**
 * Unit Tests for UnifiedDashboardMobileHeader
 * Tests responsive behavior, touch interactions, and navigation
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedDashboardMobileHeader } from "../UnifiedDashboardMobileHeader";

// Mock next/link
jest.mock("next/link", () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock translations
const mockTranslations = {
    patientDashboard: {
        navigation: {
            newDiagnosis: "New Diagnosis",
        },
    },
};

describe("UnifiedDashboardMobileHeader", () => {
    const mockOnMenuOpen = jest.fn();

    beforeEach(() => {
        mockOnMenuOpen.mockClear();
    });

    describe("Rendering", () => {
        it("renders the mobile header with all elements", () => {
            render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            // Check hamburger menu button exists
            expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();

            // Check branding
            expect(screen.getByText("Patient")).toBeInTheDocument();
            expect(screen.getByText("Portal")).toBeInTheDocument();

            // Check quick action link
            expect(screen.getByRole("link")).toHaveAttribute("href", "/");
        });

        it("has correct fixed positioning classes", () => {
            const { container } = render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const header = container.querySelector("header");
            expect(header).toHaveClass("fixed", "top-0", "left-0", "right-0", "h-14", "z-40");
        });

        it("is hidden on md+ screens via md:hidden class", () => {
            const { container } = render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const header = container.querySelector("header");
            expect(header).toHaveClass("md:hidden");
        });
    });

    describe("Interactions", () => {
        it("calls onMenuOpen when hamburger is clicked", () => {
            render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const menuButton = screen.getByRole("button", { name: /open menu/i });
            fireEvent.click(menuButton);

            expect(mockOnMenuOpen).toHaveBeenCalledTimes(1);
        });

        it("hamburger button has 44px+ touch target", () => {
            const { container } = render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const menuButton = container.querySelector('button[aria-label="Open menu"]');
            // Check for w-11 h-11 classes (44px = 11 * 4px in Tailwind)
            expect(menuButton).toHaveClass("w-11", "h-11");
        });

        it("has active:scale-95 for touch feedback on hamburger", () => {
            const { container } = render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const menuButton = container.querySelector('button[aria-label="Open menu"]');
            expect(menuButton).toHaveClass("active:scale-95");
        });
    });

    describe("Translations", () => {
        it("uses translation for new diagnosis button", () => {
            render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            expect(screen.getByText("New Diagnosis")).toBeInTheDocument();
        });

        it("falls back to 'New' when translation is missing", () => {
            render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={{}}
                />
            );

            expect(screen.getByText("New")).toBeInTheDocument();
        });
    });

    describe("Responsive Behavior", () => {
        // Note: These tests verify CSS classes, actual media query behavior
        // should be tested via visual regression or browser testing
        it("has proper mobile-first responsive classes", () => {
            const { container } = render(
                <UnifiedDashboardMobileHeader
                    onMenuOpen={mockOnMenuOpen}
                    t={mockTranslations}
                />
            );

            const header = container.querySelector("header");
            // Should be visible on mobile (no explicit show class needed)
            // Should be hidden on md+ (md:hidden)
            expect(header?.className).toContain("md:hidden");
            expect(header?.className).not.toContain("hidden");
        });
    });
});
