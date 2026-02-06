# TCM UI Quick Start Guide

Fast reference for using TCM UI components in your pages.

## Installation (Already Done)

Components are located at: `src/components/tcm-ui/`

## Import

```tsx
import {
  TCMCard,
  TCMButton,
  TCMProgressBar,
  TCMBadge,
  TCMInput,
} from "@/components/tcm-ui";
```

## Cheat Sheet

### TCMCard - Quick Reference

```tsx
// Basic
<TCMCard>Content</TCMCard>

// Variants
<TCMCard variant="jade">Healing theme</TCMCard>
<TCMCard variant="earth">Grounding theme</TCMCard>
<TCMCard variant="gold">Highlight theme</TCMCard>
<TCMCard variant="diagnostic">Diagnostic theme</TCMCard>
```

### TCMButton - Quick Reference

```tsx
// Basic
<TCMButton>Click me</TCMButton>

// Variants
<TCMButton variant="primary">Primary</TCMButton>
<TCMButton variant="secondary">Secondary</TCMButton>
<TCMButton variant="accent">Accent</TCMButton>
<TCMButton variant="ghost">Ghost</TCMButton>

// Sizes
<TCMButton size="sm">Small</TCMButton>
<TCMButton size="md">Medium</TCMButton>
<TCMButton size="lg">Large</TCMButton>

// Loading
<TCMButton isLoading>Saving...</TCMButton>
```

### TCMProgressBar - Quick Reference

```tsx
// Basic
<TCMProgressBar current={2} total={7} />

// With percentage
<TCMProgressBar current={4} total={7} showPercentage />
```

### TCMBadge - Quick Reference

```tsx
// Variants
<TCMBadge variant="success">Done</TCMBadge>
<TCMBadge variant="warning">Pending</TCMBadge>
<TCMBadge variant="info">New</TCMBadge>
<TCMBadge variant="neutral">Draft</TCMBadge>

// Sizes
<TCMBadge size="sm">Small</TCMBadge>
<TCMBadge size="md">Medium</TCMBadge>
<TCMBadge size="lg">Large</TCMBadge>
```

### TCMInput - Quick Reference

```tsx
import { User } from "lucide-react";

// Basic
<TCMInput label="Name" placeholder="Enter name" />

// With icon
<TCMInput
  label="Email"
  startIcon={<User size={16} />}
/>

// With error
<TCMInput
  label="Age"
  error="Must be 0-120"
/>

// With helper
<TCMInput
  label="Phone"
  helperText="Format: +60 12-345 6789"
/>
```

## Common Patterns

### Diagnosis Card

```tsx
<TCMCard variant="diagnostic">
  <div className="p-6 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Diagnosis</h3>
      <TCMBadge variant="warning">In Progress</TCMBadge>
    </div>
    <TCMProgressBar current={3} total={7} showPercentage />
    <TCMButton variant="primary" className="w-full">
      Continue
    </TCMButton>
  </div>
</TCMCard>
```

### Patient Form

```tsx
import { User, Mail } from "lucide-react";

<form className="space-y-4">
  <TCMInput
    label="Name"
    startIcon={<User size={16} />}
    required
  />
  <TCMInput
    label="Email"
    type="email"
    startIcon={<Mail size={16} />}
  />
  <div className="flex gap-3">
    <TCMButton variant="ghost" className="flex-1">Cancel</TCMButton>
    <TCMButton variant="primary" className="flex-1">Save</TCMButton>
  </div>
</form>
```

### Status Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <TCMCard>
    <div className="p-4">
      <TCMBadge variant="success" size="sm">Done</TCMBadge>
      <h4 className="mt-2 font-medium">Pulse Analysis</h4>
    </div>
  </TCMCard>
  {/* More cards... */}
</div>
```

## Color Reference

| Name | Value | When to Use |
|------|-------|-------------|
| Jade | `oklch(0.55 0.10 160)` | Primary actions, healing |
| Earth | `oklch(0.60 0.08 60)` | Neutral states, grounding |
| Gold | `oklch(0.75 0.15 85)` | Highlights, warnings |
| Cyan | `oklch(0.60 0.12 210)` | Trust, diagnostics |
| Green | `oklch(0.50 0.14 150)` | Success, completion |

## Tips

1. **Use TCMCard for containers** - Better than plain div for visual hierarchy
2. **TCMButton for CTAs** - Use `primary` for main actions
3. **TCMProgressBar in wizards** - Great for multi-step flows
4. **TCMBadge for status** - Quick visual indicators
5. **TCMInput for forms** - Built-in error handling

## See Also

- Full documentation: [README.md](./README.md)
- Live examples: [examples.tsx](./examples.tsx)
- Design system: [MASTER.md](../../../../design-system/sihat-tcm/MASTER.md)
