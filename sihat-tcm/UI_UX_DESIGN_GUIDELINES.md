# UI/UX Design Guidelines
## Sihat TCM - Standard Design System

### Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Platform-Specific Guidelines](#platform-specific-guidelines)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Interaction Patterns](#interaction-patterns)
8. [Accessibility](#accessibility)
9. [Responsive Design](#responsive-design)
10. [Animation & Transitions](#animation--transitions)

---

## Design Philosophy

### Core Principles
1. **Clarity First**: Information hierarchy must be clear and unambiguous
2. **Accessibility**: WCAG 2.1 AA compliance minimum
3. **Cultural Sensitivity**: Respectful representation of TCM traditions
4. **Trust & Professionalism**: Healthcare-grade design standards
5. **Consistency**: Unified experience across all platforms
6. **Progressive Enhancement**: Graceful degradation across devices

### Design Goals
- Reduce cognitive load for medical information
- Support multilingual interfaces (EN, MS, ZH)
- Ensure usability for all age groups
- Maintain professional medical aesthetic
- Enable efficient data entry and review

---

## Platform-Specific Guidelines

### Mobile App (React Native)
**Target Devices**: iOS 13+, Android 8.0+
**Screen Sizes**: 320px - 428px width

**Key Considerations**:
- **Touch Targets**: Minimum 44x44pt (iOS) / 48x48dp (Android)
- **Navigation**: Native navigation patterns (Stack, Tab, Drawer)
- **Gestures**: Support platform-native gestures (swipe, pull-to-refresh)
- **Status Bar**: Respect safe areas and notches
- **Keyboard**: Handle keyboard appearance gracefully
- **Performance**: Optimize for 60fps animations

**Layout Patterns**:
- Single-column layouts preferred
- Bottom navigation for primary actions
- Floating action buttons for key actions
- Full-screen modals for complex forms

### Mobile Web
**Target Devices**: Mobile browsers (iOS Safari, Chrome Mobile)
**Screen Sizes**: 320px - 768px width

**Key Considerations**:
- **Viewport**: Proper meta viewport tags
- **Touch Targets**: Minimum 48x48px
- **Scrolling**: Smooth, native-feeling scroll
- **URL Bar**: Account for dynamic viewport height
- **Browser Compatibility**: Support last 2 major versions

**Layout Patterns**:
- Responsive grid that collapses to single column
- Hamburger menu for navigation
- Bottom sheets for secondary actions
- Sticky headers for important actions

### PC Web (Desktop)
**Target Devices**: Desktop browsers (Chrome, Firefox, Safari, Edge)
**Screen Sizes**: 1024px - 2560px+ width

**Key Considerations**:
- **Mouse Interaction**: Hover states, precise clicks
- **Keyboard Navigation**: Full keyboard accessibility
- **Multi-column Layouts**: Efficient use of horizontal space
- **Window Management**: Support for resizing and multi-window
- **Browser Compatibility**: Support last 2 major versions

**Layout Patterns**:
- Multi-column layouts (2-3 columns)
- Sidebar navigation
- Modal dialogs for focused interactions
- Data tables with sorting/filtering

---

## Color System

### Primary Palette
```
Primary (TCM Theme):
- Primary 50:  #F0F9F4   (Lightest background)
- Primary 100: #D1F2E0   (Light background)
- Primary 200: #A3E5C1   (Light accent)
- Primary 300: #75D8A2   (Medium accent)
- Primary 400: #47CB83   (Base primary)
- Primary 500: #2DB870  (Main brand color - TCM green)
- Primary 600: #25965A   (Dark primary)
- Primary 700: #1C7443   (Darker primary)
- Primary 800: #13522D   (Darkest primary)
- Primary 900: #0A3017   (Deepest primary)
```

### Semantic Colors
```
Success:
- Success 50:  #F0FDF4
- Success 500: #22C55E
- Success 700: #15803D

Warning:
- Warning 50:  #FFFBEB
- Warning 500: #F59E0B
- Warning 700: #B45309

Error:
- Error 50:    #FEF2F2
- Error 500:   #EF4444
- Error 700:   #B91C1C

Info:
- Info 50:     #EFF6FF
- Info 500:    #3B82F6
- Info 700:    #1D4ED8
```

### Neutral Colors
```
Neutral:
- Neutral 50:  #FAFAFA   (Background)
- Neutral 100: #F5F5F5   (Subtle background)
- Neutral 200: #E5E5E5   (Borders)
- Neutral 300: #D4D4D4   (Disabled)
- Neutral 400: #A3A3A3   (Placeholder)
- Neutral 500: #737373   (Secondary text)
- Neutral 600: #525252   (Body text)
- Neutral 700: #404040   (Heading text)
- Neutral 800: #262626   (Dark text)
- Neutral 900: #171717   (Darkest text)
```

### Usage Guidelines
- **Primary**: Main actions, links, brand elements
- **Success**: Confirmations, positive states, completed steps
- **Warning**: Cautionary messages, pending states
- **Error**: Errors, destructive actions, required field indicators
- **Info**: Informational messages, help text
- **Neutral**: Text, borders, backgrounds, disabled states

### Contrast Requirements
- **Text on Background**: Minimum 4.5:1 (WCAG AA)
- **Large Text**: Minimum 3:1 (WCAG AA)
- **Interactive Elements**: Minimum 3:1 contrast ratio
- **Focus Indicators**: Minimum 3:1 contrast ratio

---

## Typography

### Font Families

**Primary Font (Web)**:
- English: `Inter` or `System UI` (sans-serif)
- Chinese: `Noto Sans SC` or `PingFang SC`
- Malay: `Inter` or `System UI`

**Primary Font (Mobile App)**:
- iOS: `SF Pro Display` / `SF Pro Text`
- Android: `Roboto`
- Chinese: Platform default Chinese font

### Type Scale

**Desktop Web**:
```
Display:    48px / 56px (1.167 line-height)  - Hero headings
H1:         36px / 44px (1.222)              - Page titles
H2:         30px / 38px (1.267)              - Section headings
H3:         24px / 32px (1.333)              - Subsection headings
H4:         20px / 28px (1.4)                - Card titles
H5:         18px / 26px (1.444)              - Small headings
H6:         16px / 24px (1.5)                - Micro headings
Body Large: 18px / 28px (1.556)              - Large body text
Body:       16px / 24px (1.5)                - Default body text
Body Small: 14px / 20px (1.429)              - Small body text
Caption:    12px / 16px (1.333)              - Captions, labels
```

**Mobile Web & App**:
```
Display:    32px / 40px (1.25)               - Hero headings
H1:         28px / 36px (1.286)              - Page titles
H2:         24px / 32px (1.333)              - Section headings
H3:         20px / 28px (1.4)                - Subsection headings
H4:         18px / 26px (1.444)              - Card titles
H5:         16px / 24px (1.5)                - Small headings
Body Large: 16px / 24px (1.5)                - Large body text
Body:       14px / 20px (1.429)              - Default body text
Body Small: 12px / 18px (1.5)                - Small body text
Caption:    11px / 16px (1.455)              - Captions, labels
```

### Font Weights
- **Light**: 300 (rarely used)
- **Regular**: 400 (body text)
- **Medium**: 500 (emphasis, buttons)
- **Semibold**: 600 (headings, important text)
- **Bold**: 700 (strong emphasis, page titles)

### Typography Usage
- **Headings**: Use semantic HTML (h1-h6), maintain hierarchy
- **Body Text**: Maximum 75 characters per line for readability
- **Line Height**: Minimum 1.4 for body text
- **Letter Spacing**: -0.01em for headings, 0 for body text
- **Chinese Text**: Slightly larger line-height (1.6-1.8) for readability

---

## Spacing & Layout

### Spacing Scale
```
Base Unit: 4px

0:   0px
1:   4px    (0.25rem)
2:   8px    (0.5rem)
3:   12px   (0.75rem)
4:   16px   (1rem)
5:   20px   (1.25rem)
6:   24px   (1.5rem)
8:   32px   (2rem)
10:  40px   (2.5rem)
12:  48px   (3rem)
16:  64px   (4rem)
20:  80px   (5rem)
24:  96px   (6rem)
```

### Layout Guidelines

**Container Widths**:
- Mobile: Full width (with 16px padding)
- Tablet: Max 768px (with 24px padding)
- Desktop: Max 1280px (with 32px padding)
- Large Desktop: Max 1440px (with 40px padding)

**Grid System**:
- **Mobile**: 4-column grid, 16px gutters
- **Tablet**: 8-column grid, 24px gutters
- **Desktop**: 12-column grid, 32px gutters

**Content Areas**:
- **Reading Width**: Maximum 680px for long-form content
- **Form Width**: Maximum 600px for forms
- **Card Width**: Flexible, minimum 280px

**Vertical Rhythm**:
- Consistent spacing between sections: 32px (mobile), 48px (desktop)
- Consistent spacing between related elements: 16px
- Consistent spacing between unrelated elements: 24px

---

## Components

### Buttons

**Sizes**:
- **Large**: Height 48px, Padding 16px 24px (Desktop primary actions)
- **Medium**: Height 44px, Padding 12px 20px (Standard actions)
- **Small**: Height 36px, Padding 8px 16px (Secondary actions)
- **Icon Only**: 44x44px minimum (mobile), 40x40px (desktop)

**Variants**:
- **Primary**: Solid background, white text
- **Secondary**: Outlined border, colored text
- **Tertiary**: Text only, no border
- **Ghost**: Transparent background, colored text
- **Danger**: Red variant for destructive actions

**States**:
- Default, Hover, Active, Focus, Disabled, Loading

**Touch Targets**:
- Minimum 44x44px (mobile)
- Minimum 40x40px (desktop)

### Forms

**Input Fields**:
- **Height**: 44px (mobile), 40px (desktop)
- **Padding**: 12px 16px
- **Border**: 1px solid Neutral 200, 2px on focus
- **Border Radius**: 8px
- **Focus State**: Primary 500 border, subtle shadow
- **Error State**: Error 500 border, error message below

**Labels**:
- Position: Above input (preferred) or floating label
- Size: 14px, Medium weight
- Color: Neutral 700
- Required Indicator: Red asterisk (*)

**Validation**:
- Real-time validation feedback
- Error messages: 12px, Error 500 color
- Success indicators: Checkmark icon, Success 500 color

### Cards

**Variants**:
- **Elevated**: Shadow (0 1px 3px rgba(0,0,0,0.1))
- **Outlined**: 1px border, Neutral 200
- **Filled**: Background Neutral 50

**Padding**:
- **Mobile**: 16px
- **Desktop**: 24px

**Border Radius**: 12px

**Spacing**:
- Margin between cards: 16px (mobile), 24px (desktop)

### Navigation

**Mobile App**:
- **Tab Bar**: Height 60px (iOS), 56px (Android)
- **Tab Icons**: 24x24px
- **Tab Labels**: 10px, Regular weight
- **Active State**: Primary 500 color
- **Inactive State**: Neutral 400

**Mobile Web**:
- **Hamburger Menu**: 24x24px icon, top-left
- **Drawer Width**: 280px
- **Menu Items**: 48px height, 16px padding

**Desktop Web**:
- **Sidebar Width**: 240px (collapsed: 64px)
- **Top Nav Height**: 64px
- **Nav Items**: 40px height, 16px horizontal padding
- **Active Indicator**: Left border, 3px, Primary 500

### Modals & Dialogs

**Sizes**:
- **Small**: 400px width (mobile: full width)
- **Medium**: 600px width (mobile: full width)
- **Large**: 800px width (mobile: full width)
- **Full Screen**: Mobile only, for complex forms

**Padding**: 24px

**Backdrop**: rgba(0, 0, 0, 0.5)

**Close Button**: Top-right, 32x32px touch target

### Data Tables

**Desktop**:
- **Row Height**: 56px
- **Header Height**: 48px
- **Cell Padding**: 16px
- **Border**: 1px solid Neutral 200 between rows
- **Hover**: Background Neutral 50

**Mobile**:
- Convert to card-based layout
- Each row becomes a card
- Key information prominently displayed

---

## Interaction Patterns

### Loading States
- **Skeleton Screens**: Preferred for content loading
- **Spinners**: For actions (button loading states)
- **Progress Bars**: For multi-step processes
- **Placeholder Content**: Neutral 200 background, shimmer effect

### Feedback
- **Success**: Toast notification, green, 3-5 second duration
- **Error**: Toast notification, red, 5-7 second duration
- **Info**: Toast notification, blue, 3-5 second duration
- **Warning**: Toast notification, orange, 5-7 second duration

### Gestures (Mobile)
- **Swipe Right**: Navigate back
- **Swipe Left**: Delete/Archive (with confirmation)
- **Pull Down**: Refresh content
- **Long Press**: Context menu
- **Pinch**: Zoom (where applicable)

### Hover States (Desktop)
- **Buttons**: Slight scale (1.02) or brightness change
- **Cards**: Elevation increase (shadow)
- **Links**: Underline or color change
- **Interactive Elements**: Cursor pointer

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text: 4.5:1 minimum
- Large Text (18px+): 3:1 minimum
- Interactive Elements: 3:1 minimum

**Keyboard Navigation**:
- All interactive elements keyboard accessible
- Visible focus indicators (2px outline, Primary 500)
- Logical tab order
- Skip links for main content

**Screen Readers**:
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Form labels properly associated

**Touch Targets**:
- Minimum 44x44px (iOS), 48x48dp (Android)
- Adequate spacing between targets (8px minimum)

**Text Scaling**:
- Support up to 200% zoom without horizontal scrolling
- Text remains readable at all sizes

**Motion**:
- Respect `prefers-reduced-motion`
- Provide option to disable animations
- Essential animations only

### Accessibility Checklist
- [ ] All images have alt text
- [ ] All forms have labels
- [ ] All interactive elements are keyboard accessible
- [ ] Color is not the only indicator
- [ ] Focus indicators are visible
- [ ] Text meets contrast requirements
- [ ] Touch targets meet size requirements
- [ ] Screen reader testing completed

---

## Responsive Design

### Breakpoints

```
Mobile:     320px - 767px
Tablet:     768px - 1023px
Desktop:    1024px - 1439px
Large:      1440px+
```

### Responsive Patterns

**Navigation**:
- Mobile: Hamburger menu / Bottom tabs
- Tablet: Collapsible sidebar
- Desktop: Full sidebar / Top nav

**Grid**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

**Typography**:
- Scale down font sizes on mobile (see Typography section)
- Maintain readability at all sizes

**Images**:
- Responsive images (srcset)
- Appropriate sizes for each breakpoint
- Lazy loading for performance

**Forms**:
- Full width on mobile
- Max width on desktop (600px)
- Stack fields vertically on mobile

---

## Animation & Transitions

### Duration
- **Micro**: 100ms (hover states, small changes)
- **Fast**: 200ms (button clicks, toggles)
- **Normal**: 300ms (modals, page transitions)
- **Slow**: 500ms (complex animations, page loads)

### Easing Functions
- **Ease Out**: `cubic-bezier(0.0, 0, 0.2, 1)` - Most common
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - Entering elements
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Complex transitions
- **Linear**: `linear` - Progress indicators

### Animation Types

**Page Transitions**:
- Fade: 200ms ease-out
- Slide: 300ms ease-out
- No page transitions on mobile web (native feel)

**Modal/Dialog**:
- Backdrop: Fade in 200ms
- Content: Scale + fade, 300ms ease-out
- Exit: Reverse animation

**Button Interactions**:
- Hover: Scale 1.02, 150ms
- Click: Scale 0.98, 100ms
- Loading: Spinner rotation, infinite

**Form Feedback**:
- Error shake: 300ms
- Success checkmark: 200ms bounce
- Field focus: Border color + shadow, 200ms

**List Animations**:
- Stagger: 50ms delay between items
- Fade in: 300ms ease-out

### Performance
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Limit simultaneous animations
- Respect `prefers-reduced-motion`

---

## Platform-Specific Patterns

### Mobile App (React Native)

**Navigation**:
- Use React Navigation
- Native stack animations
- Platform-specific back button handling

**Components**:
- Use native components when possible
- Platform-specific styling (iOS vs Android)
- Safe area handling

**Gestures**:
- React Native Gesture Handler
- Platform-native feel

### Mobile Web

**Progressive Web App**:
- Installable
- Offline support
- App-like experience

**Touch Optimization**:
- Larger touch targets
- Swipe gestures
- Pull-to-refresh

**Performance**:
- Lazy load images
- Code splitting
- Optimize for 3G networks

### Desktop Web

**Mouse Interactions**:
- Hover states
- Right-click context menus
- Drag and drop (where applicable)

**Keyboard Shortcuts**:
- Document common shortcuts
- Provide keyboard hints

**Multi-window Support**:
- Responsive to window resizing
- Maintain state across tabs

---

## Implementation Notes

### CSS Variables
Use CSS custom properties for theming:
```css
:root {
  --color-primary-500: #2DB870;
  --spacing-4: 16px;
  --font-size-body: 16px;
  /* ... */
}
```

### Design Tokens
Maintain design tokens in a centralized location:
- Colors
- Spacing
- Typography
- Shadows
- Border radius
- Animation durations

### Component Library
- Build reusable components following these guidelines
- Document component API
- Provide examples for each variant
- Test across platforms

### Design Review Checklist
- [ ] Follows spacing scale
- [ ] Uses correct typography scale
- [ ] Meets contrast requirements
- [ ] Responsive across breakpoints
- [ ] Accessible (keyboard, screen reader)
- [ ] Consistent with design system
- [ ] Performance optimized
- [ ] Platform-appropriate patterns

---

## Version History

**v1.0.0** (Initial)
- Created comprehensive design guidelines
- Defined color system, typography, spacing
- Platform-specific guidelines
- Accessibility standards

---

## Resources

### Tools
- **Color Contrast**: WebAIM Contrast Checker
- **Typography**: Type Scale Calculator
- **Spacing**: 8px Grid System
- **Accessibility**: WAVE, axe DevTools

### References
- Material Design Guidelines
- Human Interface Guidelines (Apple)
- WCAG 2.1 Guidelines
- Web Content Accessibility Guidelines

---

**Last Updated**: [Current Date]
**Maintained By**: Design & Development Team

