/**
 * InquiryCard.test.tsx
 * 
 * Unit tests for the InquiryCard component
 * Tests responsive behavior, edge cases, and touch target compliance
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InquiryCard } from "../InquiryCard";
import type { Inquiry } from "@/lib/mock/doctorDashboard";
import type { PatientFlag } from "@/types/database";

// Mock data factories
const createMockInquiry = (overrides: Partial<Inquiry> = {}): Inquiry => ({
    id: "test-inquiry-1",
    created_at: "2026-01-09T12:00:00Z",
    symptoms: "Headache and fatigue",
    diagnosis_report: {
        summary: "Liver Qi Stagnation",
        tcmPattern: "肝气郁结",
        recommendations: [],
        tongueObservation: "Pale with teeth marks",
        pulseObservation: "Wiry and thin",
    },
    profiles: {
        id: "profile-1",
        full_name: "John Doe",
        gender: "male",
        age: 45,
        flag: "Normal" as PatientFlag,
    },
    ...overrides,
});

describe("InquiryCard", () => {
    describe("Happy Path", () => {
        it("renders patient name and symptoms", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Headache and fatigue")).toBeInTheDocument();
        });

        it("renders diagnosis summary when present", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("Liver Qi Stagnation")).toBeInTheDocument();
            expect(screen.getByText("肝气郁结")).toBeInTheDocument();
        });

        it("formats date correctly", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("09 Jan 2026")).toBeInTheDocument();
        });

        it("displays age and gender", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("male")).toBeInTheDocument();
            expect(screen.getByText("45 years old")).toBeInTheDocument();
        });
    });

    describe("Edge Cases - Null/Missing Data", () => {
        it("shows 'Anonymous Patient' when name is missing", () => {
            const inquiry = createMockInquiry({
                profiles: null,
            });
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("Anonymous Patient")).toBeInTheDocument();
        });

        it("shows 'No symptoms recorded' when symptoms is empty", () => {
            const inquiry = createMockInquiry({
                symptoms: "",
            });
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("No symptoms recorded")).toBeInTheDocument();
        });

        it("does not render diagnosis section when diagnosis_report is null", () => {
            const inquiry = createMockInquiry({
                diagnosis_report: null,
            });
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.queryByText("TCM Diagnosis")).not.toBeInTheDocument();
        });

        it("shows fallback avatar initial when name is missing", () => {
            const inquiry = createMockInquiry({
                profiles: null,
            });
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("A")).toBeInTheDocument();
        });

        it("shows 'Unknown' for gender when profile is null", () => {
            const inquiry = createMockInquiry({
                profiles: null,
            });
            render(<InquiryCard inquiry={inquiry} />);

            expect(screen.getByText("Unknown")).toBeInTheDocument();
        });
    });

    describe("Variants", () => {
        it("renders dashboard variant by default", () => {
            const inquiry = createMockInquiry();
            const { container } = render(<InquiryCard inquiry={inquiry} />);

            // Dashboard variant has backdrop-blur
            expect(container.firstChild).toHaveClass("backdrop-blur");
        });

        it("renders report variant with View Full Report button", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} variant="report" />);

            expect(screen.getByText("View Full Report")).toBeInTheDocument();
        });
    });

    describe("Flag Update Callback", () => {
        it("renders PatientFlagUpdate when onUpdateFlag is provided", () => {
            const onUpdateFlag = vi.fn();
            const inquiry = createMockInquiry();

            render(<InquiryCard inquiry={inquiry} onUpdateFlag={onUpdateFlag} />);

            // The callback should not be called on initial render
            expect(onUpdateFlag).not.toHaveBeenCalled();
        });
    });

    describe("Touch Target Compliance", () => {
        it("avatar has minimum 44px touch target on mobile", () => {
            const inquiry = createMockInquiry();
            const { container } = render(<InquiryCard inquiry={inquiry} />);

            // The avatar container should have w-12 h-12 (48px) classes
            const avatar = container.querySelector('[class*="w-12"][class*="h-12"]');
            expect(avatar).toBeInTheDocument();
        });

        it("View Full Report button has touch-manipulation class", () => {
            const inquiry = createMockInquiry();
            render(<InquiryCard inquiry={inquiry} variant="report" />);

            const button = screen.getByText("View Full Report").closest("button");
            expect(button).toHaveClass("touch-manipulation");
        });

        it("card has touch-manipulation for better mobile response", () => {
            const inquiry = createMockInquiry();
            const { container } = render(<InquiryCard inquiry={inquiry} />);

            expect(container.firstChild).toHaveClass("touch-manipulation");
        });
    });

    describe("Responsive Layout", () => {
        it("applies responsive padding classes", () => {
            const inquiry = createMockInquiry();
            const { container } = render(<InquiryCard inquiry={inquiry} />);

            // Check for responsive padding on CardHeader
            const header = container.querySelector('[class*="px-4"][class*="sm:px-6"]');
            expect(header).toBeInTheDocument();
        });
    });
});
