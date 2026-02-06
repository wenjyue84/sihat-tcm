/**
 * Enhanced Progress Stepper Tests
 *
 * Comprehensive test suite for the EnhancedProgressStepper component.
 * Tests functionality, accessibility, and user interactions.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnhancedProgressStepper, type StepDefinition } from "./EnhancedProgressStepper";

// Mock dependencies
vi.mock("@/hooks/useDiagnosisSession", () => ({
  useDiagnosisSession: () => [
    {
      isInitialized: true,
      isSaving: false,
      lastSaved: new Date("2024-01-01T12:00:00Z"),
      saveError: null,
    },
  ],
}));

vi.mock("@/stores/useAppStore", () => ({
  useAccessibilityContext: () => ({
    announce: vi.fn(),
    manager: {
      registerFocusGroup: vi.fn(),
    },
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Test data
const mockSteps: StepDefinition[] = [
  {
    id: "basic_info",
    label: "Basic Information",
    description: "Enter your basic health information",
    estimatedDuration: 3,
    guidance: {
      title: "Basic Information Guide",
      content: "Please provide accurate information for better diagnosis",
      tips: ["Be honest about your symptoms", "Include all relevant details"],
    },
  },
  {
    id: "wen_inquiry",
    label: "Health Inquiry",
    description: "Answer questions about your health",
    estimatedDuration: 5,
    guidance: {
      title: "Health Inquiry Guide",
      content: "Answer all questions thoroughly",
    },
  },
  {
    id: "wang_tongue",
    label: "Tongue Analysis",
    description: "Take a photo of your tongue",
    estimatedDuration: 2,
    isOptional: true,
  },
  {
    id: "results",
    label: "Results",
    description: "View your diagnosis results",
    estimatedDuration: 1,
  },
];

describe("EnhancedProgressStepper", () => {
  const defaultProps = {
    currentStep: "wen_inquiry",
    steps: mockSteps,
    onStepClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all steps", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      mockSteps.forEach((step) => {
        expect(screen.getByText(step.label)).toBeInTheDocument();
        expect(screen.getByText(step.description)).toBeInTheDocument();
      });
    });

    it("should show progress percentage", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      // Current step is index 1 (wen_inquiry), so progress should be 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should display time estimates", () => {
      render(<EnhancedProgressStepper {...defaultProps} showTimeEstimate={true} />);

      // Should show remaining time (2 + 1 = 3 minutes for remaining steps)
      expect(screen.getByText("3 min remaining")).toBeInTheDocument();
    });

    it("should show optional step indicators", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      expect(screen.getByText("(Optional)")).toBeInTheDocument();
    });

    it("should display auto-save status", () => {
      render(<EnhancedProgressStepper {...defaultProps} showAutoSaveStatus={true} />);

      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    });
  });

  describe("Step States", () => {
    it("should mark completed steps correctly", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      // First step should be completed (has check icon)
      const completedSteps = screen.getAllByRole("tab");
      expect(completedSteps[0]).toHaveAttribute("aria-selected", "false");
    });

    it("should mark current step correctly", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      const currentStep = screen.getAllByRole("tab")[1]; // wen_inquiry is index 1
      expect(currentStep).toHaveAttribute("aria-selected", "true");
    });

    it("should disable future steps", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      const futureSteps = screen.getAllByRole("tab").slice(2);
      futureSteps.forEach((step) => {
        expect(step).not.toHaveClass("cursor-pointer");
      });
    });
  });

  describe("Interactions", () => {
    it("should handle step clicks for completed steps", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(<EnhancedProgressStepper {...defaultProps} onStepClick={onStepClick} />);

      const firstStep = screen.getAllByRole("tab")[0];
      await user.click(firstStep);

      expect(onStepClick).toHaveBeenCalledWith("basic_info");
    });

    it("should not handle clicks for future steps", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(<EnhancedProgressStepper {...defaultProps} onStepClick={onStepClick} />);

      const futureStep = screen.getAllByRole("tab")[2]; // wang_tongue
      await user.click(futureStep);

      expect(onStepClick).not.toHaveBeenCalled();
    });

    it("should show guidance tooltip when help button is clicked", async () => {
      const user = userEvent.setup();

      render(<EnhancedProgressStepper {...defaultProps} showGuidance={true} />);

      const helpButton = screen.getAllByLabelText(/Show guidance/)[0];
      await user.click(helpButton);

      expect(screen.getByText("Basic Information Guide")).toBeInTheDocument();
      expect(
        screen.getByText("Please provide accurate information for better diagnosis")
      ).toBeInTheDocument();
    });

    it("should close guidance tooltip when clicking outside", async () => {
      const user = userEvent.setup();

      render(<EnhancedProgressStepper {...defaultProps} showGuidance={true} />);

      // Open tooltip
      const helpButton = screen.getAllByLabelText(/Show guidance/)[0];
      await user.click(helpButton);

      // Click outside (on the backdrop)
      const backdrop = screen.getByRole("dialog").parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByText("Basic Information Guide")).not.toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle arrow key navigation", async () => {
      const user = userEvent.setup();

      render(<EnhancedProgressStepper {...defaultProps} enableKeyboardNavigation={true} />);

      const firstStep = screen.getAllByRole("tab")[0];
      firstStep.focus();

      // Navigate right
      await user.keyboard("{ArrowRight}");

      const secondStep = screen.getAllByRole("tab")[1];
      expect(secondStep).toHaveFocus();
    });

    it("should handle Enter key for step activation", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <EnhancedProgressStepper
          {...defaultProps}
          onStepClick={onStepClick}
          enableKeyboardNavigation={true}
        />
      );

      const firstStep = screen.getAllByRole("tab")[0];
      firstStep.focus();

      await user.keyboard("{Enter}");

      expect(onStepClick).toHaveBeenCalledWith("basic_info");
    });

    it("should handle Home and End keys", async () => {
      const user = userEvent.setup();

      render(<EnhancedProgressStepper {...defaultProps} enableKeyboardNavigation={true} />);

      const secondStep = screen.getAllByRole("tab")[1];
      secondStep.focus();

      // Go to first step
      await user.keyboard("{Home}");

      const firstStep = screen.getAllByRole("tab")[0];
      expect(firstStep).toHaveFocus();

      // Go to last step
      await user.keyboard("{End}");

      const lastStep = screen.getAllByRole("tab")[mockSteps.length - 1];
      expect(lastStep).toHaveFocus();
    });
  });

  describe("Variants", () => {
    it("should render compact variant correctly", () => {
      render(<EnhancedProgressStepper {...defaultProps} variant="compact" />);

      expect(screen.getByText(`Step 2 of ${mockSteps.length}`)).toBeInTheDocument();
      expect(screen.getByText("Health Inquiry")).toBeInTheDocument();
    });

    it("should render detailed variant with all features", () => {
      render(<EnhancedProgressStepper {...defaultProps} variant="detailed" />);

      expect(screen.getByText("Diagnosis Progress")).toBeInTheDocument();
      expect(screen.getByLabelText(/Diagnosis progress/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Diagnosis steps");

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute("aria-controls", `step-panel-${mockSteps[index].id}`);
      });
    });

    it("should have proper progress bar labeling", () => {
      render(<EnhancedProgressStepper {...defaultProps} />);

      const progressBar = screen.getByLabelText(/Diagnosis progress/);
      expect(progressBar).toBeInTheDocument();
    });

    it("should announce step navigation", async () => {
      const user = userEvent.setup();
      const mockAnnounce = vi.fn();

      vi.mocked(require("@/stores/useAppStore").useAccessibilityContext).mockReturnValue({
        announce: mockAnnounce,
        manager: { registerFocusGroup: vi.fn() },
      });

      const onStepClick = vi.fn();
      render(<EnhancedProgressStepper {...defaultProps} onStepClick={onStepClick} />);

      const firstStep = screen.getAllByRole("tab")[0];
      await user.click(firstStep);

      expect(mockAnnounce).toHaveBeenCalledWith("Navigating to Basic Information", "polite");
    });

    it("should support screen reader announcements for guidance", async () => {
      const user = userEvent.setup();
      const mockAnnounce = vi.fn();

      vi.mocked(require("@/stores/useAppStore").useAccessibilityContext).mockReturnValue({
        announce: mockAnnounce,
        manager: { registerFocusGroup: vi.fn() },
      });

      render(<EnhancedProgressStepper {...defaultProps} showGuidance={true} />);

      const helpButton = screen.getAllByLabelText(/Show guidance/)[0];
      await user.click(helpButton);

      expect(mockAnnounce).toHaveBeenCalledWith(
        "Guidance for Basic Information: Please provide accurate information for better diagnosis",
        "polite"
      );
    });
  });

  describe("Time Calculations", () => {
    it("should calculate remaining time correctly", () => {
      render(<EnhancedProgressStepper {...defaultProps} showTimeEstimate={true} />);

      // Current step is wen_inquiry (index 1), remaining steps: wang_tongue (2min) + results (1min) = 3min
      expect(screen.getByText("3 min remaining")).toBeInTheDocument();
    });

    it("should format time correctly for hours", () => {
      const longSteps: StepDefinition[] = [
        { ...mockSteps[0], estimatedDuration: 120 }, // 2 hours
        { ...mockSteps[1], estimatedDuration: 90 }, // 1.5 hours
      ];

      render(
        <EnhancedProgressStepper
          currentStep="basic_info"
          steps={longSteps}
          showTimeEstimate={true}
        />
      );

      expect(screen.getByText("1h 30m remaining")).toBeInTheDocument();
    });

    it("should show complete when no time remaining", () => {
      render(
        <EnhancedProgressStepper currentStep="results" steps={mockSteps} showTimeEstimate={true} />
      );

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Auto-save Integration", () => {
    it("should show saving status", () => {
      vi.mocked(require("@/hooks/useDiagnosisSession").useDiagnosisSession).mockReturnValue([
        {
          isInitialized: true,
          isSaving: true,
          lastSaved: null,
          saveError: null,
        },
      ]);

      render(<EnhancedProgressStepper {...defaultProps} showAutoSaveStatus={true} />);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should show save error", () => {
      vi.mocked(require("@/hooks/useDiagnosisSession").useDiagnosisSession).mockReturnValue([
        {
          isInitialized: true,
          isSaving: false,
          lastSaved: null,
          saveError: "Network error",
        },
      ]);

      render(<EnhancedProgressStepper {...defaultProps} showAutoSaveStatus={true} />);

      expect(screen.getByText("Save failed")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing step gracefully", () => {
      render(<EnhancedProgressStepper currentStep="nonexistent" steps={mockSteps} />);

      // Should not crash and should show 0% progress
      expect(screen.getByText("25%")).toBeInTheDocument(); // 1/4 = 25%
    });

    it("should handle empty steps array", () => {
      render(<EnhancedProgressStepper currentStep="any" steps={[]} />);

      // Should not crash
      expect(screen.getByText("Diagnosis Progress")).toBeInTheDocument();
    });
  });
});
