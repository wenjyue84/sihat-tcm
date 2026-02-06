/**
 * Accessibility Store
 *
 * Manages accessibility preferences and features
 * for the Sihat TCM application.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  AccessibilityManager,
  AccessibilityPreferences,
  getAccessibilityManager,
} from "@/lib/accessibilityManager";
import { logger } from "@/lib/clientLogger";
import { AccessibilityStore, STORAGE_KEYS } from "../interfaces/StoreInterfaces";

export const useAccessibilityStore = create<AccessibilityStore>()(
  subscribeWithSelector((set, get) => ({
    // ============================================================================
    // INITIAL STATE
    // ============================================================================
    accessibilityManager: null,
    accessibilityPreferences: {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: "medium",
      focusIndicatorStyle: "default",
      announcements: true,
      colorBlindnessSupport: false,
      autoplayMedia: true,
      animationSpeed: "normal",
      textSpacing: "normal",
    },

    // ============================================================================
    // ACTIONS
    // ============================================================================
    updateAccessibilityPreferences: (newPreferences) => {
      const { accessibilityManager, accessibilityPreferences } = get();

      if (!accessibilityManager) {
        logger.warn("AccessibilityStore", "Cannot update preferences: manager not initialized");
        return;
      }

      const updatedPreferences = { ...accessibilityPreferences, ...newPreferences };

      // Update the manager
      accessibilityManager.updatePreferences(newPreferences);

      // Update local state
      set({ accessibilityPreferences: updatedPreferences });

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEYS.accessibility, JSON.stringify(updatedPreferences));
          logger.debug("AccessibilityStore", "Preferences saved to localStorage");
        } catch (error) {
          logger.warn("AccessibilityStore", "Failed to save accessibility preferences", error);
        }
      }

      // Announce changes if announcements are enabled
      if (accessibilityPreferences.announcements) {
        const changes = Object.keys(newPreferences)
          .map((key) => {
            const value = newPreferences[key as keyof AccessibilityPreferences];
            return `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${value}`;
          })
          .join(", ");

        accessibilityManager.announce(`Accessibility settings updated: ${changes}`, "polite", 500);
      }

      logger.info("AccessibilityStore", "Accessibility preferences updated", {
        newPreferences,
        updatedPreferences,
      });
    },

    announce: (message, priority = "polite", delay = 0) => {
      const { accessibilityManager } = get();

      if (!accessibilityManager) {
        logger.warn("AccessibilityStore", "Cannot announce: manager not initialized");
        return;
      }

      accessibilityManager.announce(message, priority, delay);
      logger.debug("AccessibilityStore", "Announcement made", { message, priority, delay });
    },

    initializeAccessibility: () => {
      let savedPreferences: Partial<AccessibilityPreferences> = {};

      // Load saved preferences from localStorage
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.accessibility);
          if (saved) {
            savedPreferences = JSON.parse(saved);
            logger.debug(
              "AccessibilityStore",
              "Loaded preferences from localStorage",
              savedPreferences
            );
          }
        } catch (error) {
          logger.warn("AccessibilityStore", "Failed to load accessibility preferences", error);
        }
      }

      // Merge with defaults
      const mergedPreferences: AccessibilityPreferences = {
        highContrast: false,
        reducedMotion: false,
        screenReaderEnabled: false,
        keyboardNavigation: true,
        fontSize: "medium",
        focusIndicatorStyle: "default",
        announcements: true,
        colorBlindnessSupport: false,
        autoplayMedia: true,
        animationSpeed: "normal",
        textSpacing: "normal",
        ...savedPreferences,
      };

      // Initialize the accessibility manager
      const accessibilityManager = getAccessibilityManager(mergedPreferences);

      set({
        accessibilityManager,
        accessibilityPreferences: { ...mergedPreferences, ...accessibilityManager.getPreferences() },
      });

      // Load accessibility styles
      if (typeof document !== "undefined") {
        const styleId = "accessibility-styles";
        if (!document.getElementById(styleId)) {
          const link = document.createElement("link");
          link.id = styleId;
          link.rel = "stylesheet";
          link.href = "/styles/accessibility.css";
          document.head.appendChild(link);

          logger.debug("AccessibilityStore", "Accessibility styles loaded");
        }
      }

      logger.info("AccessibilityStore", "Accessibility system initialized", {
        preferences: mergedPreferences,
      });
    },
  }))
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export const useAccessibilityContext = () => {
  const manager = useAccessibilityStore((state) => state.accessibilityManager);
  const preferences = useAccessibilityStore((state) => state.accessibilityPreferences);
  const updatePreferences = useAccessibilityStore((state) => state.updateAccessibilityPreferences);
  const announce = useAccessibilityStore((state) => state.announce);

  return {
    manager,
    preferences,
    updatePreferences,
    announce,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    isScreenReaderEnabled: preferences.screenReaderEnabled,
    fontSize: preferences.fontSize,
    focusIndicatorStyle: preferences.focusIndicatorStyle,
    keyboardNavigation: preferences.keyboardNavigation,
    announcements: preferences.announcements,
  };
};

// ============================================================================
// FEATURE-SPECIFIC HOOKS
// ============================================================================

/**
 * Hook for high contrast mode
 */
export const useHighContrast = () => {
  const isHighContrast = useAccessibilityStore(
    (state) => state.accessibilityPreferences.highContrast
  );
  const updatePreferences = useAccessibilityStore((state) => state.updateAccessibilityPreferences);

  const toggleHighContrast = () => {
    updatePreferences({ highContrast: !isHighContrast });
  };

  return {
    isHighContrast,
    toggleHighContrast,
  };
};

/**
 * Hook for reduced motion
 */
export const useReducedMotion = () => {
  const isReducedMotion = useAccessibilityStore(
    (state) => state.accessibilityPreferences.reducedMotion
  );
  const updatePreferences = useAccessibilityStore((state) => state.updateAccessibilityPreferences);

  const toggleReducedMotion = () => {
    updatePreferences({ reducedMotion: !isReducedMotion });
  };

  return {
    isReducedMotion,
    toggleReducedMotion,
  };
};

/**
 * Hook for font size control
 */
export const useFontSize = () => {
  const fontSize = useAccessibilityStore((state) => state.accessibilityPreferences.fontSize);
  const updatePreferences = useAccessibilityStore((state) => state.updateAccessibilityPreferences);

  const setFontSize = (size: AccessibilityPreferences["fontSize"]) => {
    updatePreferences({ fontSize: size });
  };

  const increaseFontSize = () => {
    const sizes: AccessibilityPreferences["fontSize"][] = [
      "small",
      "medium",
      "large",
      "extra-large",
    ];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: AccessibilityPreferences["fontSize"][] = [
      "small",
      "medium",
      "large",
      "extra-large",
    ];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  return {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    canIncrease: fontSize !== "extra-large",
    canDecrease: fontSize !== "small",
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const announce = useAccessibilityStore((state) => state.announce);
  const isScreenReaderEnabled = useAccessibilityStore(
    (state) => state.accessibilityPreferences.screenReaderEnabled
  );
  const announcements = useAccessibilityStore(
    (state) => state.accessibilityPreferences.announcements
  );

  const announceIfEnabled = (
    message: string,
    priority: "polite" | "assertive" = "polite",
    delay = 0
  ) => {
    if (announcements) {
      announce(message, priority, delay);
    }
  };

  return {
    announce: announceIfEnabled,
    isScreenReaderEnabled,
    announcementsEnabled: announcements,
  };
};
