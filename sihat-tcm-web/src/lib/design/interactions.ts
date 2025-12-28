/**
 * Apple-inspired Interaction Utilities
 * 
 * Provides utilities for delightful micro-interactions
 */

import { appleDurations, appleEase } from './motion';

/**
 * CSS classes for common interactions
 */
export const appleInteractionClasses = {
  /**
   * Button press interaction
   * Scale down slightly with opacity change
   */
  buttonPress: 'active:scale-[0.97] active:opacity-80 transition-transform transition-opacity duration-100',

  /**
   * Card hover interaction
   * Subtle lift with brightness increase
   */
  cardHover: 'hover:-translate-y-0.5 hover:brightness-[1.02] transition-all duration-200',

  /**
   * Input focus interaction
   * Smooth border and ring transition
   */
  inputFocus: 'transition-all duration-200 focus:ring-3 focus:ring-primary/10',

  /**
   * Smooth transitions for all interactive elements
   */
  smoothTransition: `transition-all duration-${appleDurations.fast} ease-[${appleEase.join(',')}]`,
} as const;

/**
 * Interaction utilities for programmatic use
 */
export const appleInteractions = {
  /**
   * Get transition string for smooth animations
   */
  getTransition: (duration: number = appleDurations.fast) => {
    return `all ${duration}ms cubic-bezier(${appleEase.join(', ')})`;
  },

  /**
   * Button press styles
   */
  buttonPress: {
    transform: 'scale(0.97)',
    opacity: 0.8,
    transition: `all ${appleDurations.instant}ms cubic-bezier(${appleEase.join(', ')})`,
  },

  /**
   * Card hover styles
   */
  cardHover: {
    transform: 'translateY(-2px)',
    filter: 'brightness(1.02)',
    transition: `all ${appleDurations.fast}ms cubic-bezier(${appleEase.join(', ')})`,
  },

  /**
   * Input focus styles
   */
  inputFocus: {
    transition: `all ${appleDurations.fast}ms cubic-bezier(${appleEase.join(', ')})`,
  },
} as const;

