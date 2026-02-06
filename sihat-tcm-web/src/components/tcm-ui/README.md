# TCM UI Component Library

Traditional Chinese Medicine themed component library implementing TCM healthcare colors and Apple-inspired design patterns.

## Color Palette

The TCM UI library uses colors inspired by Traditional Chinese Medicine:

| Color            | CSS Variable           | Usage                       |
| ---------------- | ---------------------- | --------------------------- |
| **Jade Green**   | `oklch(0.55 0.10 160)` | Healing, primary actions    |
| **Earth Brown**  | `oklch(0.60 0.08 60)`  | Grounding, neutral states   |
| **Ginseng Gold** | `oklch(0.75 0.15 85)`  | Highlights, warnings        |
| **Health Cyan**  | `oklch(0.60 0.12 210)` | Trust, diagnostic contexts  |
| **Health Green** | `oklch(0.50 0.14 150)` | Success, healing completion |

## Components

### TCMCard

Card component with TCM styling variants.

```tsx
import { TCMCard } from "@/components/tcm-ui";

// Default variant
<TCMCard>
  <div className="p-6">
    <h3>Patient Information</h3>
    <p>Name: John Doe</p>
  </div>
</TCMCard>

// Jade variant (healing green)
<TCMCard variant="jade">
  <div className="p-6">
    <h3>Pulse Analysis</h3>
    <p>Heart rate: 72 bpm</p>
  </div>
</TCMCard>

// Earth variant (grounding brown)
<TCMCard variant="earth">
  <div className="p-6">Constitution Type: Yang</div>
</TCMCard>

// Gold variant (highlight)
<TCMCard variant="gold">
  <div className="p-6">Special Notice</div>
</TCMCard>

// Diagnostic variant (trust cyan)
<TCMCard variant="diagnostic">
  <div className="p-6">Diagnostic Results</div>
</TCMCard>
```

**Props:**

- `variant`: `"default" | "jade" | "earth" | "gold" | "diagnostic"`
- Extends all standard `div` props

---

### TCMButton

Button component with TCM theme and loading states.

```tsx
import { TCMButton } from "@/components/tcm-ui";

// Primary (jade green)
<TCMButton variant="primary" size="lg">
  Start Diagnosis
</TCMButton>

// Secondary (cyan)
<TCMButton variant="secondary">
  View History
</TCMButton>

// Accent (gold)
<TCMButton variant="accent">
  Premium Feature
</TCMButton>

// Ghost (transparent)
<TCMButton variant="ghost">
  Cancel
</TCMButton>

// With loading state
<TCMButton variant="primary" isLoading>
  Saving...
</TCMButton>

// Small size
<TCMButton size="sm">
  Quick Action
</TCMButton>
```

**Props:**

- `variant`: `"primary" | "secondary" | "accent" | "ghost"`
- `size`: `"sm" | "md" | "lg"`
- `isLoading`: `boolean` - Shows spinner and disables button
- `asChild`: `boolean` - Render as Slot for composition
- Extends all standard `button` props

---

### TCMProgressBar

Step progress indicator with TCM color gradient (orange → cyan → green).

```tsx
import { TCMProgressBar } from "@/components/tcm-ui";

// Simple usage
<TCMProgressBar current={2} total={7} />

// With percentage display
<TCMProgressBar current={4} total={7} showPercentage />

// In diagnosis wizard
<div className="space-y-4">
  <h2>Diagnosis Progress</h2>
  <TCMProgressBar
    current={currentStep}
    total={totalSteps}
    showPercentage
  />
</div>
```

**Props:**

- `current`: `number` - Current step (0-indexed)
- `total`: `number` - Total number of steps
- `showPercentage`: `boolean` - Show percentage text (default: `false`)
- Extends all standard `div` props

**Color Gradient:**

- 0-33%: Orange (warning/start)
- 34-66%: Cyan (trust/progress)
- 67-100%: Green (healing/completion)

---

### TCMBadge

Badge for status and labels with TCM styling.

```tsx
import { TCMBadge } from "@/components/tcm-ui";

// Success (green)
<TCMBadge variant="success">Completed</TCMBadge>

// Warning (gold)
<TCMBadge variant="warning">Pending Review</TCMBadge>

// Info (cyan)
<TCMBadge variant="info">New Feature</TCMBadge>

// Neutral (earth)
<TCMBadge variant="neutral">Draft</TCMBadge>

// Different sizes
<TCMBadge variant="success" size="sm">Small</TCMBadge>
<TCMBadge variant="warning" size="md">Medium</TCMBadge>
<TCMBadge variant="info" size="lg">Large</TCMBadge>
```

**Props:**

- `variant`: `"success" | "warning" | "info" | "neutral"`
- `size`: `"sm" | "md" | "lg"`
- Extends all standard `div` props

---

### TCMInput

Form input with Traditional Chinese Medicine themed styling.

```tsx
import { TCMInput } from "@/components/tcm-ui";

// Basic usage
<TCMInput
  label="Patient Name"
  placeholder="Enter name"
/>

// With helper text
<TCMInput
  label="Email Address"
  type="email"
  helperText="We'll never share your email"
/>

// With error
<TCMInput
  label="Age"
  type="number"
  value={age}
  error={ageError}
/>

// With icons
import { User, Mail } from "lucide-react";

<TCMInput
  label="Username"
  startIcon={<User size={16} />}
/>

<TCMInput
  label="Email"
  type="email"
  startIcon={<Mail size={16} />}
/>

// Disabled state
<TCMInput
  label="Read-only Field"
  value="Cannot edit"
  disabled
/>
```

**Props:**

- `label`: `string` - Label text for the input
- `helperText`: `string` - Helper text below input
- `error`: `string` - Error message (sets aria-invalid and error styling)
- `startIcon`: `React.ReactNode` - Icon at the start of input
- `endIcon`: `React.ReactNode` - Icon at the end of input
- Extends all standard `input` props

**Features:**

- TCM-inspired focus states (jade green ring)
- Proper label-input association with `htmlFor`
- Error state support with visual feedback
- Accessibility compliant (ARIA attributes)
- Apple-inspired spacing and touch targets (min 44px)

---

## Design Principles

### 1. Accessibility First

- All components follow WCAG guidelines
- Minimum touch targets: 44x44px (Apple standard)
- Proper ARIA attributes
- Keyboard navigation support
- Focus states clearly visible

### 2. Apple-Inspired Design

- Smooth transitions (200-300ms)
- Depth system using shadow-depth-1 to shadow-depth-4
- Rounded corners (10px, 18px)
- Hover states with subtle transforms

### 3. TCM Color Philosophy

- Colors represent healing journey
- Jade green: Primary healing energy
- Earth brown: Grounding stability
- Gold: Highlighting important elements
- Cyan: Trust and calm
- Green: Success and completion

### 4. Responsive Design

- Mobile-first approach
- Touch-friendly targets
- Adapts to screen sizes

---

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
import type {
  TCMCardProps,
  TCMButtonProps,
  TCMProgressBarProps,
  TCMBadgeProps,
  TCMInputProps,
} from "@/components/tcm-ui";
```

---

## Usage with Existing UI

TCM UI components can be used alongside existing shadcn/ui components:

```tsx
import { Card } from "@/components/ui/card";
import { TCMButton } from "@/components/tcm-ui";

<Card>
  <CardHeader>
    <CardTitle>Diagnosis Session</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Ready to begin?</p>
  </CardContent>
  <CardFooter>
    <TCMButton variant="primary">Start Diagnosis</TCMButton>
  </CardFooter>
</Card>;
```

---

## Examples

### Diagnosis Card with Progress

```tsx
import { TCMCard, TCMProgressBar, TCMButton } from "@/components/tcm-ui";

<TCMCard variant="diagnostic">
  <div className="p-6 space-y-4">
    <h3 className="text-lg font-semibold">Diagnosis in Progress</h3>
    <TCMProgressBar current={3} total={7} showPercentage />
    <p>Completing visual analysis step...</p>
    <TCMButton variant="primary" className="w-full">
      Continue
    </TCMButton>
  </div>
</TCMCard>;
```

### Status Dashboard

```tsx
import { TCMCard, TCMBadge } from "@/components/tcm-ui";

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <TCMCard>
    <div className="p-6">
      <TCMBadge variant="success">Completed</TCMBadge>
      <h4 className="mt-2">Pulse Analysis</h4>
      <p className="text-sm text-muted-foreground">3 readings captured</p>
    </div>
  </TCMCard>

  <TCMCard>
    <div className="p-6">
      <TCMBadge variant="warning">In Progress</TCMBadge>
      <h4 className="mt-2">Visual Examination</h4>
      <p className="text-sm text-muted-foreground">2 of 4 images</p>
    </div>
  </TCMCard>

  <TCMCard>
    <div className="p-6">
      <TCMBadge variant="neutral">Pending</TCMBadge>
      <h4 className="mt-2">Audio Analysis</h4>
      <p className="text-sm text-muted-foreground">Not started</p>
    </div>
  </TCMCard>
</div>;
```

### Patient Form

```tsx
import { TCMInput, TCMButton } from "@/components/tcm-ui";
import { User, Calendar, Phone } from "lucide-react";

<form className="space-y-4">
  <TCMInput
    label="Full Name"
    placeholder="Enter patient name"
    startIcon={<User size={16} />}
    required
  />

  <TCMInput
    label="Date of Birth"
    type="date"
    startIcon={<Calendar size={16} />}
    helperText="Format: YYYY-MM-DD"
  />

  <TCMInput
    label="Contact Number"
    type="tel"
    placeholder="+60 12-345 6789"
    startIcon={<Phone size={16} />}
  />

  <div className="flex gap-3">
    <TCMButton variant="ghost" className="flex-1">
      Cancel
    </TCMButton>
    <TCMButton variant="primary" className="flex-1">
      Save Patient
    </TCMButton>
  </div>
</form>;
```

---

## Related Documentation

- [Design System Master](../../../../design-system/sihat-tcm/MASTER.md)
- [globals.css](../../../app/globals.css) - TCM color variables
- [React Rules](../../../../.claude/rules/react.md)
- [TypeScript Rules](../../../../.claude/rules/typescript.md)
