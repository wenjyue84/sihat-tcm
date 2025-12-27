/**
 * Apple-inspired Motion System
 * 
 * Provides animation presets that match Apple's design language:
 * - Natural easing curves
 * - Spring animations for organic feel
 * - Consistent timing
 */

/**
 * Apple's standard easing curve
 * cubic-bezier(0.25, 0.1, 0.25, 1)
 */
export const appleEase = [0.25, 0.1, 0.25, 1] as const;

/**
 * Apple-inspired spring configuration
 * Natural, bouncy feel without being excessive
 */
export const appleSpring = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 300,
  mass: 1,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const appleDurations = {
  instant: 100, // Button press, quick feedback
  fast: 200, // Hover states, small transitions
  normal: 300, // Modal enter/exit, card animations
  slow: 500, // Complex animations, page transitions
} as const;

/**
 * Framer Motion variants for common animations
 */
export const appleMotionVariants = {
  // Button press animation
  buttonPress: {
    scale: 0.97,
    transition: {
      duration: appleDurations.instant / 1000,
      ease: appleEase,
    },
  },

  // Card hover animation
  cardHover: {
    y: -2,
    transition: {
      duration: appleDurations.fast / 1000,
      ease: appleEase,
    },
  },

  // Modal enter animation
  modalEnter: {
    scale: [0.95, 1],
    opacity: [0, 1],
    transition: {
      duration: appleDurations.normal / 1000,
      ease: appleEase,
    },
  },

  // Modal exit animation
  modalExit: {
    scale: [1, 0.95],
    opacity: [1, 0],
    transition: {
      duration: appleDurations.normal / 1000,
      ease: appleEase,
    },
  },

  // Fade in animation
  fadeIn: {
    opacity: [0, 1],
    transition: {
      duration: appleDurations.fast / 1000,
      ease: appleEase,
    },
  },

  // Slide up animation
  slideUp: {
    y: [20, 0],
    opacity: [0, 1],
    transition: {
      duration: appleDurations.normal / 1000,
      ease: appleEase,
    },
  },

  // List item stagger animation
  listItem: {
    opacity: [0, 1],
    y: [10, 0],
    transition: {
      duration: appleDurations.fast / 1000,
      ease: appleEase,
    },
  },
} as const;

/**
 * CSS transition strings for non-Framer Motion animations
 */
export const appleTransitions = {
  fast: `all ${appleDurations.fast}ms cubic-bezier(${appleEase.join(', ')})`,
  normal: `all ${appleDurations.normal}ms cubic-bezier(${appleEase.join(', ')})`,
  slow: `all ${appleDurations.slow}ms cubic-bezier(${appleEase.join(', ')})`,
} as const;

