/**
 * Diagnosis Session Manager
 * 
 * Handles automatic session persistence, recovery, and cleanup for diagnosis consultations.
 * Provides seamless user experience with auto-save and resume functionality.
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  DiagnosisWizardData, 
  PendingResumeState,
  DiagnosisSession,
  SaveDiagnosisInput 
} from '@/types/diagnosis';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';

export interface SessionManagerConfig {
  autoSaveInterval: number; // milliseconds
  maxRetries: number;
  sessionTimeout: number; // milliseconds
  enableLocalBackup: boolean;
}

export interface SessionMetadata {
  sessionId: string;
  userId?: string;
  guestToken?: string;
  isGuest: boolean;
  startTime: Date;
  lastSaved: Date;
  currentStep: string;
  completionPercentage: number;
  estimatedTimeRemaining?: number;
}

export interface SessionSaveResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  timestamp: Date;
}

export interface SessionRecoveryOptions {
  includeIncomplete: boolean;
  maxAge: number; // hours
  userId?: string;
  guestToken?: string;
}

/**
 * DiagnosisSessionManager handles all aspects of diagnosis session lifecycle
 */
export class DiagnosisSessionManager {
  private supabase = createClient();
  private config: SessionManagerConfig;
  private autoSaveTimer?: NodeJS.Timeout;
  private currentSession?: SessionMetadata;
  private pendingChanges: boolean = false;
  private retryCount: number = 0;

  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = {
      autoSaveInterval: 30000, // 30 seconds
      maxRetries: 3,
      sessionTimeout: 3600000, // 1 hour
      enableLocalBackup: true,
      ...config
    };
  }

  /**
   * Initialize a new diagnosis session
   */
  async initializeSession(
    userId?: string, 
    guestToken?: string,
    initialData?: Partial<DiagnosisWizardData>
  ): Promise<SessionMetadata> {
    try {
      const sessionId = this.generateSessionId();
      const isGuest = !userId;
      
      const metadata: SessionMetadata = {
        sessionId,
        userId,
        guestToken,
        isGuest,
        startTime: new Date(),
        lastSaved: new Date(),
        currentStep: 'basic_info',
        completionPercentage: 0
      };

      // Save initial session state
      if (initialData) {
        await this.saveSessionData(sessionId, initialData, metadata);
      }

      this.currentSession = metadata;
      this.startAutoSave();

      logger.info('Diagnosis session initialized', { 
        sessionId, 
        userId, 
        isGuest 
      });

      return metadata;
    } catch (error) {
      logger.error('Failed to initialize session', { error, userId });
      throw new Error('Failed to initialize diagnosis session');
    }
  }

  /**
   * Save session data with automatic retry logic
   */
  async saveSessionData(
    sessionId: string,
    data: Partial<DiagnosisWizardData>,
    metadata: SessionMetadata
  ): Promise<SessionSaveResult> {
    try {
      const timestamp = new Date();
      
      // Prepare session data for storage
      const sessionData = {
        session_id: sessionId,
        user_id: metadata.userId,
        guest_token: metadata.guestToken,
        data: data,
        metadata: {
          currentStep: metadata.currentStep,
          completionPercentage: metadata.completionPercentage,
          startTime: metadata.startTime.toISOString(),
          lastSaved: timestamp.toISOString(),
          estimatedTimeRemaining: metadata.estimatedTimeRemaining
        },
        created_at: timestamp.toISOString(),
        updated_at: timestamp.toISOString()
      };

      // Save to database
      const { error } = await this.supabase
        .from('diagnosis_session_drafts')
        .upsert(sessionData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      // Local backup if enabled
      if (this.config.enableLocalBackup) {
        this.saveLocalBackup(sessionId, sessionData);
      }

      this.pendingChanges = false;
      this.retryCount = 0;
      
      if (this.currentSession) {
        this.currentSession.lastSaved = timestamp;
      }

      logger.debug('Session data saved successfully', { sessionId });

      return {
        success: true,
        sessionId,
        timestamp
      };

    } catch (error) {
      logger.error('Failed to save session data', { 
        error, 
        sessionId, 
        retryCount: this.retryCount 
      });

      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        await this.delay(1000 * this.retryCount); // Exponential backoff
        return this.saveSessionData(sessionId, data, metadata);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Recover available sessions for a user or guest
   */
  async recoverSessions(options: SessionRecoveryOptions): Promise<PendingResumeState[]> {
    try {
      const maxAgeDate = new Date();
      maxAgeDate.setHours(maxAgeDate.getHours() - options.maxAge);

      let query = this.supabase
        .from('diagnosis_session_drafts')
        .select('*')
        .gte('updated_at', maxAgeDate.toISOString())
        .order('updated_at', { ascending: false });

      // Filter by user or guest
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else if (options.guestToken) {
        query = query.eq('guest_token', options.guestToken);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const sessions: PendingResumeState[] = (data || [])
        .filter(session => {
          // Filter incomplete sessions if requested
          if (!options.includeIncomplete) {
            return session.metadata?.completionPercentage === 100;
          }
          return true;
        })
        .map(session => ({
          step: session.metadata?.currentStep || 'basic_info',
          data: session.data || {},
          timestamp: session.updated_at,
          sessionId: session.session_id,
          completionPercentage: session.metadata?.completionPercentage || 0
        }));

      logger.info('Sessions recovered', { 
        count: sessions.length, 
        userId: options.userId,
        guestToken: options.guestToken 
      });

      return sessions;

    } catch (error) {
      logger.error('Failed to recover sessions', { error, options });
      
      // Fallback to local storage if available
      if (this.config.enableLocalBackup) {
        return this.recoverFromLocalBackup(options);
      }
      
      return [];
    }
  }

  /**
   * Resume a specific session
   */
  async resumeSession(sessionId: string): Promise<{ data: DiagnosisWizardData; metadata: SessionMetadata } | null> {
    try {
      const { data, error } = await this.supabase
        .from('diagnosis_session_drafts')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        logger.warn('Session not found for resume', { sessionId, error });
        return null;
      }

      const metadata: SessionMetadata = {
        sessionId: data.session_id,
        userId: data.user_id,
        guestToken: data.guest_token,
        isGuest: !data.user_id,
        startTime: new Date(data.metadata?.startTime || data.created_at),
        lastSaved: new Date(data.updated_at),
        currentStep: data.metadata?.currentStep || 'basic_info',
        completionPercentage: data.metadata?.completionPercentage || 0,
        estimatedTimeRemaining: data.metadata?.estimatedTimeRemaining
      };

      this.currentSession = metadata;
      this.startAutoSave();

      logger.info('Session resumed successfully', { sessionId });

      return {
        data: data.data || {},
        metadata
      };

    } catch (error) {
      logger.error('Failed to resume session', { error, sessionId });
      return null;
    }
  }

  /**
   * Complete and finalize a session
   */
  async completeSession(
    sessionId: string,
    finalData: DiagnosisWizardData,
    diagnosisResult: SaveDiagnosisInput
  ): Promise<{ success: boolean; diagnosisId?: string; error?: string }> {
    try {
      // Save final diagnosis to main table
      const { data: diagnosis, error: diagnosisError } = await this.supabase
        .from('diagnosis_sessions')
        .insert(diagnosisResult)
        .select('id')
        .single();

      if (diagnosisError) {
        throw diagnosisError;
      }

      // Clean up draft session
      await this.cleanupSession(sessionId);

      // Stop auto-save
      this.stopAutoSave();
      this.currentSession = undefined;

      logger.info('Session completed successfully', { 
        sessionId, 
        diagnosisId: diagnosis.id 
      });

      return {
        success: true,
        diagnosisId: diagnosis.id
      };

    } catch (error) {
      logger.error('Failed to complete session', { error, sessionId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up completed or abandoned sessions
   */
  async cleanupSession(sessionId: string): Promise<void> {
    try {
      // Remove from database
      const { error } = await this.supabase
        .from('diagnosis_session_drafts')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        logger.warn('Failed to cleanup session from database', { error, sessionId });
      }

      // Remove local backup
      if (this.config.enableLocalBackup) {
        this.removeLocalBackup(sessionId);
      }

      logger.debug('Session cleaned up', { sessionId });

    } catch (error) {
      logger.error('Failed to cleanup session', { error, sessionId });
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredDate = new Date();
      expiredDate.setTime(expiredDate.getTime() - this.config.sessionTimeout);

      const { data, error } = await this.supabase
        .from('diagnosis_session_drafts')
        .delete()
        .lt('updated_at', expiredDate.toISOString())
        .select('session_id');

      if (error) {
        throw error;
      }

      const cleanedCount = data?.length || 0;
      
      logger.info('Expired sessions cleaned up', { count: cleanedCount });
      
      return cleanedCount;

    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
  }

  /**
   * Update session progress
   */
  updateProgress(step: string, completionPercentage: number, estimatedTimeRemaining?: number): void {
    if (this.currentSession) {
      this.currentSession.currentStep = step;
      this.currentSession.completionPercentage = completionPercentage;
      this.currentSession.estimatedTimeRemaining = estimatedTimeRemaining;
      this.pendingChanges = true;
    }
  }

  /**
   * Get current session metadata
   */
  getCurrentSession(): SessionMetadata | undefined {
    return this.currentSession;
  }

  /**
   * Start automatic saving
   */
  private startAutoSave(): void {
    this.stopAutoSave(); // Clear any existing timer
    
    this.autoSaveTimer = setInterval(() => {
      if (this.pendingChanges && this.currentSession) {
        // Auto-save will be triggered by the component using this manager
        logger.debug('Auto-save triggered', { 
          sessionId: this.currentSession.sessionId 
        });
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop automatic saving
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save local backup
   */
  private saveLocalBackup(sessionId: string, data: any): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`diagnosis_session_${sessionId}`, JSON.stringify(data));
      }
    } catch (error) {
      logger.warn('Failed to save local backup', { error, sessionId });
    }
  }

  /**
   * Remove local backup
   */
  private removeLocalBackup(sessionId: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`diagnosis_session_${sessionId}`);
      }
    } catch (error) {
      logger.warn('Failed to remove local backup', { error, sessionId });
    }
  }

  /**
   * Recover from local backup
   */
  private recoverFromLocalBackup(options: SessionRecoveryOptions): PendingResumeState[] {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const sessions: PendingResumeState[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('diagnosis_session_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const sessionData = JSON.parse(data);
              const sessionAge = Date.now() - new Date(sessionData.updated_at).getTime();
              
              if (sessionAge <= options.maxAge * 3600000) { // Convert hours to ms
                sessions.push({
                  step: sessionData.metadata?.currentStep || 'basic_info',
                  data: sessionData.data || {},
                  timestamp: sessionData.updated_at,
                  sessionId: sessionData.session_id
                });
              }
            } catch (parseError) {
              logger.warn('Failed to parse local backup', { parseError, key });
            }
          }
        }
      }

      return sessions;

    } catch (error) {
      logger.error('Failed to recover from local backup', { error });
      return [];
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoSave();
    this.currentSession = undefined;
    this.pendingChanges = false;
    this.retryCount = 0;
  }
}

// Export singleton instance for global use
export const diagnosisSessionManager = new DiagnosisSessionManager();

// Export factory function for custom configurations
export function createDiagnosisSessionManager(config?: Partial<SessionManagerConfig>): DiagnosisSessionManager {
  return new DiagnosisSessionManager(config);
}