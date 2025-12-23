---
description: Verify the Infographic Generator feature on mobile
---

1. Open the mobile app in Expo Go.
2. Complete a diagnosis flow or go to the "History" tab and open a past report.
3. On the Results screen, verify the "Visual" button appears in the bottom floating dock (next to "Ask AI").
4. Tap "Visual". Verify the "Create Infographic" modal opens.
5. Test Style Selection:
   - Tap different styles (Modern, Traditional, Minimal, Colorful).
   - Ensure the selection visual updates (border/check).
6. Test Content Toggles:
   - Toggle different sections (Dietary, Lifestyle, etc.).
7. Test Generation:
   - Tap "Generate".
   - Verify:
     - "Generating..." spinner appears.
     - Haptic feedback occurs.
     - Infographic preview is displayed after delay.
     - Preview reflects the selected style colors.
     - Preview shows the correct sections based on toggles.
8. Test Saving:
   - Tap "Save to Photos".
   - Verify permission request (if first time) and success message.
   - Check your device's photo gallery for the new image.
9. Test Sharing:
   - Tap "Share".
   - Verify the native share sheet opens.
   - Try sharing to another app (e.g., Messages, WhatsApp).
10. Test Closing:
    - Tap "Close" or the "X" button.
    - Verify modal closes and returns to Results screen.
