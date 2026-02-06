"use client";

/**
 * TCM UI Component Library Examples
 *
 * This file demonstrates all TCM UI components in various configurations.
 * Use this as a reference for implementing TCM-themed interfaces.
 */

import * as React from "react";
import { User, Mail, Phone, Calendar } from "lucide-react";
import {
  TCMCard,
  TCMButton,
  TCMProgressBar,
  TCMBadge,
  TCMInput,
} from "@/components/tcm-ui";

export function TCMCardExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">TCMCard Examples</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Default Card */}
        <TCMCard>
          <div className="p-6">
            <h3 className="font-semibold text-lg">Default Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Standard card with neutral background
            </p>
          </div>
        </TCMCard>

        {/* Jade Card */}
        <TCMCard variant="jade">
          <div className="p-6">
            <h3 className="font-semibold text-lg">Jade Healing</h3>
            <p className="text-sm opacity-90 mt-2">Healing jade green theme</p>
          </div>
        </TCMCard>

        {/* Earth Card */}
        <TCMCard variant="earth">
          <div className="p-6">
            <h3 className="font-semibold text-lg">Earth Element</h3>
            <p className="text-sm opacity-90 mt-2">Grounding earth brown</p>
          </div>
        </TCMCard>

        {/* Gold Card */}
        <TCMCard variant="gold">
          <div className="p-6">
            <h3 className="font-semibold text-lg">Ginseng Gold</h3>
            <p className="text-sm text-muted-foreground mt-2">Highlight accent color</p>
          </div>
        </TCMCard>

        {/* Diagnostic Card */}
        <TCMCard variant="diagnostic">
          <div className="p-6">
            <h3 className="font-semibold text-lg">Diagnostic Context</h3>
            <p className="text-sm opacity-90 mt-2">Healthcare cyan for trust</p>
          </div>
        </TCMCard>
      </div>
    </div>
  );
}

export function TCMButtonExamples() {
  const [loading, setLoading] = React.useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">TCMButton Examples</h2>

      {/* Variants */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Variants</h3>
        <div className="flex flex-wrap gap-3">
          <TCMButton variant="primary">Primary Button</TCMButton>
          <TCMButton variant="secondary">Secondary Button</TCMButton>
          <TCMButton variant="accent">Accent Button</TCMButton>
          <TCMButton variant="ghost">Ghost Button</TCMButton>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Sizes</h3>
        <div className="flex flex-wrap items-center gap-3">
          <TCMButton variant="primary" size="sm">
            Small
          </TCMButton>
          <TCMButton variant="primary" size="md">
            Medium
          </TCMButton>
          <TCMButton variant="primary" size="lg">
            Large
          </TCMButton>
        </div>
      </div>

      {/* Loading State */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Loading State</h3>
        <div className="flex flex-wrap gap-3">
          <TCMButton variant="primary" isLoading={loading} onClick={handleClick}>
            {loading ? "Saving..." : "Click to Load"}
          </TCMButton>
          <TCMButton variant="secondary" isLoading>
            Processing...
          </TCMButton>
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Disabled State</h3>
        <TCMButton variant="primary" disabled>
          Disabled Button
        </TCMButton>
      </div>
    </div>
  );
}

export function TCMProgressBarExamples() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">TCMProgressBar Examples</h2>

      {/* Animated Progress */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Animated Progress</h3>
        <TCMProgressBar current={progress} total={7} showPercentage />
      </div>

      {/* Different States */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Different States</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Early Stage (Orange)</p>
            <TCMProgressBar current={1} total={7} />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mid Stage (Cyan)</p>
            <TCMProgressBar current={3} total={7} showPercentage />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Near Complete (Green)</p>
            <TCMProgressBar current={6} total={7} showPercentage />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TCMBadgeExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">TCMBadge Examples</h2>

      {/* Variants */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Variants</h3>
        <div className="flex flex-wrap gap-2">
          <TCMBadge variant="success">Completed</TCMBadge>
          <TCMBadge variant="warning">Pending</TCMBadge>
          <TCMBadge variant="info">New</TCMBadge>
          <TCMBadge variant="neutral">Draft</TCMBadge>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Sizes</h3>
        <div className="flex flex-wrap items-center gap-3">
          <TCMBadge variant="success" size="sm">
            Small
          </TCMBadge>
          <TCMBadge variant="warning" size="md">
            Medium
          </TCMBadge>
          <TCMBadge variant="info" size="lg">
            Large
          </TCMBadge>
        </div>
      </div>

      {/* Use Case Examples */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Use Cases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TCMCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Pulse Analysis</h4>
                <TCMBadge variant="success" size="sm">
                  Complete
                </TCMBadge>
              </div>
              <p className="text-sm text-muted-foreground">3 readings captured</p>
            </div>
          </TCMCard>

          <TCMCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Visual Examination</h4>
                <TCMBadge variant="warning" size="sm">
                  In Progress
                </TCMBadge>
              </div>
              <p className="text-sm text-muted-foreground">2 of 4 images</p>
            </div>
          </TCMCard>
        </div>
      </div>
    </div>
  );
}

export function TCMInputExamples() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    age: "",
    phone: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    }
    if (!formData.email || !formData.email.includes("@")) {
      newErrors.email = "Valid email is required";
    }
    if (formData.age && (parseInt(formData.age) < 0 || parseInt(formData.age) > 120)) {
      newErrors.age = "Age must be between 0 and 120";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("Form submitted successfully!");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">TCMInput Examples</h2>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {/* Basic Input */}
        <TCMInput
          label="Full Name"
          placeholder="Enter patient name"
          startIcon={<User size={16} />}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        {/* Email Input */}
        <TCMInput
          label="Email Address"
          type="email"
          placeholder="patient@example.com"
          startIcon={<Mail size={16} />}
          helperText="We'll never share your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        {/* Number Input with Error */}
        <TCMInput
          label="Age"
          type="number"
          placeholder="Enter age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          error={errors.age}
        />

        {/* Phone Input */}
        <TCMInput
          label="Contact Number"
          type="tel"
          placeholder="+60 12-345 6789"
          startIcon={<Phone size={16} />}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        {/* Date Input */}
        <TCMInput
          label="Date of Birth"
          type="date"
          startIcon={<Calendar size={16} />}
          helperText="Format: YYYY-MM-DD"
        />

        {/* Disabled Input */}
        <TCMInput label="Read-only Field" value="Cannot edit this" disabled />

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <TCMButton variant="ghost" type="button" className="flex-1">
            Cancel
          </TCMButton>
          <TCMButton variant="primary" type="submit" className="flex-1">
            Submit Form
          </TCMButton>
        </div>
      </form>
    </div>
  );
}

/**
 * Complete TCM UI Examples Page
 * Demonstrates all components together
 */
export default function TCMUIExamples() {
  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">TCM UI Component Library</h1>
        <p className="text-muted-foreground">
          Traditional Chinese Medicine themed components with Apple-inspired design
        </p>
      </div>

      <TCMCardExamples />
      <TCMButtonExamples />
      <TCMProgressBarExamples />
      <TCMBadgeExamples />
      <TCMInputExamples />

      {/* Complete Example: Diagnosis Card */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Complete Example: Diagnosis Card</h2>
        <div className="max-w-md">
          <TCMCard variant="diagnostic">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Diagnosis Session</h3>
                <TCMBadge variant="warning" size="sm">
                  In Progress
                </TCMBadge>
              </div>

              <TCMProgressBar current={3} total={7} showPercentage />

              <div className="space-y-2">
                <p className="text-sm opacity-90">
                  Completing visual analysis step...
                </p>
                <p className="text-xs opacity-75">
                  Please upload images of your tongue and face
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <TCMButton variant="ghost" className="flex-1">
                  Save Draft
                </TCMButton>
                <TCMButton variant="primary" className="flex-1">
                  Continue
                </TCMButton>
              </div>
            </div>
          </TCMCard>
        </div>
      </div>
    </div>
  );
}
