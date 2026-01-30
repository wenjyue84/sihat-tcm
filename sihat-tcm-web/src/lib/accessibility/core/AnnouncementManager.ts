/**
 * Announcement Manager
 * 
 * Manages screen reader announcements and accessibility notifications
 * with intelligent queuing and priority handling.
 */

import { logger } from "@/lib/clientLogger";
import type {
  AnnouncementManager as IAnnouncementManager,
  AccessibilityAnnouncement,
  ScreenReaderConfig
} from "../interfaces/AccessibilityInterfaces";

/**
 * Announcement manager implementation
 */
export class AnnouncementManager implements IAnnouncementManager {
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private announcementQueue: AccessibilityAnnouncement[] = [];
  private isProcessingQueue: boolean = false;
  private config: ScreenReaderConfig;
  private announcementHistory: AccessibilityAnnouncement[] = [];

  constructor(config: Partial<ScreenReaderConfig> = {}) {
    this.config = {
      enabled: true,
      verbosity: 'normal',
      announceChanges: true,
      announceNavigation: true,
      announceErrors: true,
      speechRate: 1,
      speechPitch: 1,
      speechVolume: 1,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize the announcement manager
   */
  private initialize(): void {
    if (typeof document === "undefined" || !this.config.enabled) return;

    this.createLiveRegions();
    this.setupSpeechSynthesis();
    
    logger.info("AnnouncementManager", "Initialized successfully");
  }

  /**
   * Create ARIA live regions for announcements
   */
  private createLiveRegions(): void {
    if (typeof document === "undefined") return;

    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('class', 'sr-only');
    this.politeRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.setAttribute('class', 'sr-only');
    this.assertiveRegion.style.cssText = this.politeRegion.style.cssText;
    document.body.appendChild(this.assertiveRegion);

    logger.debug("AnnouncementManager", "Live regions created");
  }

  /**
   * Setup speech synthesis if available
   */
  private setupSpeechSynthesis(): void {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return;

    // Configure speech synthesis
    if (this.config.customVoice) {
      // Voice will be set when making announcements
    }

    logger.debug("AnnouncementManager", "Speech synthesis available");
  }

  /**
   * Make an accessibility announcement
   */
  public announce(announcement: AccessibilityAnnouncement): void {
    if (!this.config.enabled) return;

    // Add to history
    this.announcementHistory.push({
      ...announcement,
      timestamp: Date.now(),
    });

    // Trim history if too long
    if (this.announcementHistory.length > 100) {
      this.announcementHistory.shift();
    }

    // Add to queue
    this.announcementQueue.push(announcement);

    // Process queue
    this.processAnnouncementQueue();

    logger.debug("AnnouncementManager", "Announcement queued", {
      message: announcement.message,
      priority: announcement.priority,
      category: announcement.category,
    });
  }

  /**
   * Announce an error message
   */
  public announceError(message: string, persistent: boolean = false): void {
    this.announce({
      message: `Error: ${message}`,
      priority: 'assertive',
      category: 'error',
      persistent,
    });
  }

  /**
   * Announce a success message
   */
  public announceSuccess(message: string): void {
    this.announce({
      message: `Success: ${message}`,
      priority: 'polite',
      category: 'success',
    });
  }

  /**
   * Announce navigation changes
   */
  public announceNavigation(message: string): void {
    if (!this.config.announceNavigation) return;

    this.announce({
      message: `Navigated to: ${message}`,
      priority: 'polite',
      category: 'navigation',
    });
  }

  /**
   * Process the announcement queue
   */
  private async processAnnouncementQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.announcementQueue.length > 0) {
        const announcement = this.announcementQueue.shift()!;
        
        // Apply delay if specified
        if (announcement.delay) {
          await this.delay(announcement.delay);
        }

        // Make the announcement
        await this.makeAnnouncement(announcement);

        // Small delay between announcements to prevent overlap
        await this.delay(100);
      }
    } catch (error) {
      logger.error("AnnouncementManager", "Error processing announcement queue", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Make a single announcement
   */
  private async makeAnnouncement(announcement: AccessibilityAnnouncement): Promise<void> {
    // Use ARIA live regions
    await this.announceToLiveRegion(announcement);

    // Use speech synthesis if available and configured
    if (this.shouldUseSpeechSynthesis()) {
      await this.announceWithSpeechSynthesis(announcement);
    }
  }

  /**
   * Announce to ARIA live region
   */
  private async announceToLiveRegion(announcement: AccessibilityAnnouncement): Promise<void> {
    const targetRegion = announcement.priority === 'assertive' 
      ? this.assertiveRegion 
      : this.politeRegion;

    if (!targetRegion) return;

    // Clear the region first
    targetRegion.textContent = '';

    // Small delay to ensure screen readers notice the change
    await this.delay(50);

    // Set the announcement text
    targetRegion.textContent = announcement.message;

    logger.debug("AnnouncementManager", "Announced to live region", {
      priority: announcement.priority,
      message: announcement.message,
    });
  }

  /**
   * Announce with speech synthesis
   */
  private async announceWithSpeechSynthesis(announcement: AccessibilityAnnouncement): Promise<void> {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(announcement.message);
      
      // Configure utterance
      utterance.rate = this.config.speechRate;
      utterance.pitch = this.config.speechPitch;
      utterance.volume = this.config.speechVolume;

      if (this.config.customVoice) {
        utterance.voice = this.config.customVoice;
      }

      // Handle completion
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Continue even if speech fails

      // Speak the utterance
      window.speechSynthesis.speak(utterance);

      logger.debug("AnnouncementManager", "Announced with speech synthesis", {
        message: announcement.message,
      });
    });
  }

  /**
   * Check if speech synthesis should be used
   */
  private shouldUseSpeechSynthesis(): boolean {
    return (
      typeof window !== "undefined" &&
      'speechSynthesis' in window &&
      this.config.verbosity !== 'minimal'
    );
  }

  /**
   * Clear announcements by category
   */
  public clearAnnouncements(category?: string): void {
    if (category) {
      this.announcementQueue = this.announcementQueue.filter(
        announcement => announcement.category !== category
      );
    } else {
      this.announcementQueue = [];
    }

    // Clear live regions
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }

    // Stop speech synthesis
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    logger.debug("AnnouncementManager", "Announcements cleared", { category });
  }

  /**
   * Set announcement preferences
   */
  public setAnnouncementPreferences(config: Partial<ScreenReaderConfig>): void {
    this.config = { ...this.config, ...config };
    
    logger.info("AnnouncementManager", "Preferences updated", { config });
  }

  /**
   * Get announcement history
   */
  public getAnnouncementHistory(limit?: number): AccessibilityAnnouncement[] {
    const history = [...this.announcementHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    totalAnnouncements: number;
  } {
    return {
      queueLength: this.announcementQueue.length,
      isProcessing: this.isProcessingQueue,
      totalAnnouncements: this.announcementHistory.length,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy the announcement manager
   */
  public destroy(): void {
    // Clear queue and stop processing
    this.announcementQueue = [];
    this.isProcessingQueue = false;

    // Remove live regions
    if (this.politeRegion && this.politeRegion.parentNode) {
      this.politeRegion.parentNode.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion && this.assertiveRegion.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }

    // Stop speech synthesis
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Clear references
    this.politeRegion = null;
    this.assertiveRegion = null;
    this.announcementHistory = [];

    logger.info("AnnouncementManager", "Destroyed successfully");
  }
}