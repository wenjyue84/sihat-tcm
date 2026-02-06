# IoT Connection Wizard

> **Last updated:** 2026-02-06 (Initial creation)
> **Status:** Active
> **Tags:** #diagnosis #iot #device-integration

## What This Is

The IoT Connection Wizard (`IoTConnectionWizard.tsx`) manages the connection flow for TCM diagnostic devices (pulse, blood pressure, oxygen, temperature, HRV, stress). It provides both automatic device discovery and manual input with validation.

## Common Mistakes & Fixes

### 1. Import Error - Default vs Named Export {#import-error}

**Problem:**
- Import fails with "IoTConnectionWizard is not exported from module"
- Build errors or runtime crashes

**Root Cause:**
- Component uses **default export**, not named export
- Developers commonly assume named export pattern

**Fix:**
```typescript
// ❌ Wrong
import { IoTConnectionWizard } from "@/components/diagnosis/IoTConnectionWizard";

// ✅ Correct
import IoTConnectionWizard from "@/components/diagnosis/IoTConnectionWizard";
```

**Prevention:**
- Always check export pattern before importing
- Prefer default exports for main components
- Document export type in component file header

---

### 2. Platform Detection Missing {#platform-detection}

**Problem:**
- Device connection works on web but fails on mobile
- WebSocket errors on iOS/Android

**Root Cause:**
- Mobile platforms don't support WebSocket for BLE devices
- Need platform-specific transport configuration

**Fix:**
```typescript
import { Platform } from "react-native";

const transport = Platform.OS === "ios" || Platform.OS === "android"
  ? "ble"  // Bluetooth Low Energy for mobile
  : "ws";  // WebSocket for web
```

**Prevention:**
- Always test IoT features on both web and mobile before PR
- Add platform checks in device configuration
- Document platform limitations in component props

---

### 3. Device Validation Rules Not Applied

**Problem:**
- Invalid device data accepted (e.g., pulse = 300 BPM)
- Backend rejects data after wizard completion

**Root Cause:**
- Validation rules exist but not enforced in manual input mode
- Different validation between auto-connect and manual input

**Fix:**
- Enforce same validation rules in both modes
- Use centralized validation from `src/lib/constants/index.ts`
- Show real-time validation feedback

**Prevention:**
- Test manual input with edge cases (min/max values)
- Add validation tests to component test suite
- Display validation rules in UI

---

## Decisions Made

| Date | Decision | Rationale | PR |
|------|----------|-----------|-----|
| 2026-01-15 | Default export for main component | Consistency with Next.js page patterns | #89 |
| 2026-01-20 | Manual input as fallback | Device auto-discovery not reliable in all environments | #92 |
| 2026-02-01 | Platform-specific transport | BLE required for mobile, WebSocket for web | #98 |

## Related Files

- `sihat-tcm-web/src/components/diagnosis/IoTConnectionWizard.tsx` - Main component
- `sihat-tcm-web/src/types/diagnosis.ts` - `SmartConnectData` type definition
- `sihat-tcm-web/src/lib/constants/index.ts` - Device validation rules
- `sihat-tcm-mobile/lib/device-integration.ts` - Mobile BLE implementation

## Related Notes

- [Error Handling Patterns](../patterns/error-handling.md) - Device connection error handling
- [Session Recovery](./session-recovery.md) - Saving IoT data in drafts
- [Type Safety](../patterns/type-safety.md) - Device data type validation

## Architecture Notes

**Device Types Supported:**
- Pulse (BPM, quality, rhythm, strength)
- Blood Pressure (systolic, diastolic)
- Oxygen Saturation (SpO2)
- Temperature (celsius)
- HRV (heart rate variability)
- Stress Level (calculated metric)

**Connection Flow:**
1. Select device type
2. Auto-discover devices (or skip to manual)
3. Connect to device (or enter manually)
4. Validate readings
5. Save to `SmartConnectData`

## Testing Checklist

- [ ] Default import works correctly
- [ ] Platform detection on iOS/Android/Web
- [ ] Manual input validation (min/max values)
- [ ] Device auto-discovery timeout handling
- [ ] Error states display correctly
- [ ] Session recovery includes IoT data

## Update History

| Date | PR | Change | Author |
|------|----|--------|--------|
| 2026-02-06 | N/A | Initial creation with known issues | Claude |
