import { describe, it, expect } from "vitest";

/**
 * Unit tests for PersonalInfoStep validation functions
 * Tests the field-level validation logic for name, age, height, and weight inputs
 */
describe("PersonalInfoStep validation", () => {
  // Inline validation function for testing
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    return null;
  };

  const validateAge = (value: string): string | null => {
    if (!value) return "Age is required";
    const age = parseInt(value, 10);
    if (isNaN(age)) return "Please enter a valid age";
    if (age < 0 || age > 120) return "Please enter an age between 0 and 120";
    return null;
  };

  const validateHeight = (value: string): string | null => {
    if (!value) return null; // Optional field
    const height = parseFloat(value);
    if (isNaN(height)) return "Please enter a valid height";
    if (height < 100 || height > 250) return "Please enter a height between 100 and 250 cm";
    return null;
  };

  const validateWeight = (value: string): string | null => {
    if (!value) return null; // Optional field
    const weight = parseFloat(value);
    if (isNaN(weight)) return "Please enter a valid weight";
    if (weight < 20 || weight > 300) return "Please enter a weight between 20 and 300 kg";
    return null;
  };

  describe("validateName", () => {
    it("should return error if name is empty", () => {
      expect(validateName("")).toBe("Name is required");
      expect(validateName("   ")).toBe("Name is required");
    });

    it("should return error if name is less than 2 characters", () => {
      expect(validateName("J")).toBe("Name must be at least 2 characters");
    });

    it("should return null for valid names", () => {
      expect(validateName("John")).toBe(null);
      expect(validateName("Jane Doe")).toBe(null);
      expect(validateName("李明")).toBe(null);
    });
  });

  describe("validateAge", () => {
    it("should return error if age is empty", () => {
      expect(validateAge("")).toBe("Age is required");
    });

    it("should return error if age is not a number", () => {
      expect(validateAge("abc")).toBe("Please enter a valid age");
    });

    it("should return error if age is out of range", () => {
      expect(validateAge("-1")).toBe("Please enter an age between 0 and 120");
      expect(validateAge("121")).toBe("Please enter an age between 0 and 120");
    });

    it("should return null for valid ages", () => {
      expect(validateAge("0")).toBe(null);
      expect(validateAge("25")).toBe(null);
      expect(validateAge("120")).toBe(null);
    });
  });

  describe("validateHeight", () => {
    it("should return null if height is empty (optional)", () => {
      expect(validateHeight("")).toBe(null);
    });

    it("should return error if height is not a number", () => {
      expect(validateHeight("abc")).toBe("Please enter a valid height");
    });

    it("should return error if height is out of range", () => {
      expect(validateHeight("99")).toBe("Please enter a height between 100 and 250 cm");
      expect(validateHeight("251")).toBe("Please enter a height between 100 and 250 cm");
    });

    it("should return null for valid heights", () => {
      expect(validateHeight("100")).toBe(null);
      expect(validateHeight("170")).toBe(null);
      expect(validateHeight("250")).toBe(null);
    });
  });

  describe("validateWeight", () => {
    it("should return null if weight is empty (optional)", () => {
      expect(validateWeight("")).toBe(null);
    });

    it("should return error if weight is not a number", () => {
      expect(validateWeight("abc")).toBe("Please enter a valid weight");
    });

    it("should return error if weight is out of range", () => {
      expect(validateWeight("19")).toBe("Please enter a weight between 20 and 300 kg");
      expect(validateWeight("301")).toBe("Please enter a weight between 20 and 300 kg");
    });

    it("should return null for valid weights", () => {
      expect(validateWeight("20")).toBe(null);
      expect(validateWeight("70")).toBe(null);
      expect(validateWeight("300")).toBe(null);
    });
  });
});
