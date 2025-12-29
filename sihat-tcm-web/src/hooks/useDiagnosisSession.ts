/**
 * useDiagnosisSession Hook
 * 
 * React hook for managing diagnosis session state with auto-save functionality.
 * Provides seamless session management for the diagnosis wizard.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { 
  DiagnosisSessionManager, 
  diagnosisSessionManager,
  type SessionMetadata,
  type SessionSaveResult,
  type SessionRecoveryOptions 
} from '@/lib/diagnostic/core/DiagnosisSessionManager';
import type { 
  DiagnosisWizardData, 
  PendingResumeState,
  SaveDiagnosisInput 
} from '@/types/diagnosis';
import { logger } from '@/lib/logger';

export interface UseDiagnosisSessionOptions {
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  enableRecovery?: boolean;
  maxRecoveryAge?: number; // hours
  guestToken?: string;
}

export interface DiagnosisSessionState {
  // Session metadata
  sessionId?: string;
  isInitialized: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  
  // Progress tracking
  currentStep: string;
  completionPercentage: number;
  estimatedTimeRemaining?: number;
  
  // Session data
  data: Partial<DiagnosisWizardData>;
  
  // Recovery
  availableSessions: PendingResumeState[];
  hasRecoverableSessions: boolean;
  
  // Error handling
  error?: string;
  saveError?: string;
}

export interface DiagnosisSessionActions {
  // Session lifecycle
  initializeSession: (initialData?: Partial<DiagnosisWizardData>) => Promise<void>;
  saveSession: (data: Partial<DiagnosisWizardData>) => Promise<SessionSaveResult>;
  completeSession: (finalData: DiagnosisWizardData, diagnosisResult: SaveDiagnosisInput) => Promise<{ success: boolean; diagnosisId?: string; error?: string }>;
  
  // Data management
  updateData: (updates: Partial<DiagnosisWizardData>) => void;
  updateProgress: (step: string, percentage: number, estimatedTime?: number) => void;
  
  // Recovery
  loadAvailableSessions: () => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  
  // Cleanup
  clearSession: () => void;
  clearError: () => void;
}

export function useDiagnosisSession(
  options: UseDiagnosisSessionOptions = {}
): [DiagnosisSessionState, DiagnosisSessionActions] {
  
  const user = useUser();
  const {
    autoSaveEnabled = true,
    autoSaveInterval = 30000,
    enableRecovery = true,
    maxRecoveryAge = 24,
    guestToken
  } = options;

  // State
  const [state, setState] = useState<DiagnosisSessionState>({
    isInitialized: false,
    isLoading: false,
    isSaving: false,
    currentStep: 'basic_info',
    completionPercentage: 0,
    data: {},
    availableSessions: [],
    hasRecoverableSessions: false
  });

  // Refs for managing auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const sessionManagerRef = useRef<DiagnosisSessionManager>(diagnosisSessionManager);
  const pendingDataRef = useRef<Partial<DiagnosisWizardData>>({});

  // Initialize session
  const initializeSession = useCallback(async (initialData?: Partial<DiagnosisWizardData>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const metadata = await sessionManagerRef.current.initializeSession(
        user?.id,
        guestToken,
        initialData
      );

      setState(prev => ({
        ...prev,
        sessionId: metadata.sessionId,
        isInitialized: true,
        isLoading: false,
        currentStep: metadata.currentStep,
        completionPercentage: metadata.completionPercentage,
        lastSaved: metadata.lastSaved,
        data: initialData || {}
      }));

      if (initialData) {
        pendingDataRef.current = initialData;
      }

      logger.info('Diagnosis session initialized via hook', { sessionId: metadata.sessionId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      logger.error('Failed to initialize session via hook', { error });
    }
  }, [user?.id, guestToken]);

  // Save session data
  const saveSession = useCallback(async (data: Partial<DiagnosisWizardData>): Promise<SessionSaveResult> => {
    if (!state.sessionId || !state.isInitialized) {
      throw new Error('Session not initialized');
    }

    try {
      setState(prev => ({ ...prev, isSaving: true, saveError: undefined }));

      const currentSession = sessionManagerRef.current.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session found');
      }

      const result = await sessionManagerRef.current.saveSessionData(
        state.sessionId,
        data,
        currentSession
      );

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: result.timestamp,
        data: { ...prev.data, ...data },
        saveError: result.success ? undefined : result.error
      }));

      if (result.success) {
        pendingDataRef.current = {};
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save session';
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        saveError: errorMessage 
      }));
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }, [state.sessionId, state.isInitialized]);

  // Update data with auto-save
  const updateData = useCallback((updates: Partial<DiagnosisWizardData>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }));

    // Merge with pending data for auto-save
    pendingDataRef.current = { ...pendingDataRef.current, ...updates };

    // Trigger auto-save if enabled
    if (autoSaveEnabled && state.isInitialized) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        if (Object.keys(pendingDataRef.current).length > 0) {
          saveSession(pendingDataRef.current);
        }
      }, 2000); // Debounce auto-save by 2 seconds
    }
  }, [autoSaveEnabled, state.isInitialized, saveSession]);

  // Update progress
  const updateProgress = useCallback((step: string, percentage: number, estimatedTime?: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      completionPercentage: percentage,
      estimatedTimeRemaining: estimatedTime
    }));

    sessionManagerRef.current.updateProgress(step, percentage, estimatedTime);
  }, []);

  // Load available sessions for recovery
  const loadAvailableSessions = useCallback(async () => {
    if (!enableRecovery) return;

    try {
      const recoveryOptions: SessionRecoveryOptions = {
        includeIncomplete: true,
        maxAge: maxRecoveryAge,
        userId: user?.id,
        guestToken
      };

      const sessions = await sessionManagerRef.current.recoverSessions(recoveryOptions);
      
      setState(prev => ({
        ...prev,
        availableSessions: sessions,
        hasRecoverableSessions: sessions.length > 0
      }));

    } catch (error) {
      logger.error('Failed to load available sessions', { error });
    }
  }, [enableRecovery, maxRecoveryAge, user?.id, guestToken]);

  // Resume a specific session
  const resumeSession = useCallback(async (sessionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const result = await sessionManagerRef.current.resumeSession(sessionId);
      
      if (result) {
        setState(prev => ({
          ...prev,
          sessionId: result.metadata.sessionId,
          isInitialized: true,
          isLoading: false,
          currentStep: result.metadata.currentStep,
          completionPercentage: result.metadata.completionPercentage,
          estimatedTimeRemaining: result.metadata.estimatedTimeRemaining,
          lastSaved: result.metadata.lastSaved,
          data: result.data
        }));

        pendingDataRef.current = {};
        
        logger.info('Session resumed via hook', { sessionId });
      } else {
        throw new Error('Failed to resume session');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume session';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  }, []);

  // Complete session
  const completeSession = useCallback(async (
    finalData: DiagnosisWizardData, 
    diagnosisResult: SaveDiagnosisInput
  ) => {
    if (!state.sessionId) {
      throw new Error('No active session to complete');
    }

    try {
      setState(prev => ({ ...prev, isSaving: true }));

      const result = await sessionManagerRef.current.completeSession(
        state.sessionId,
        finalData,
        diagnosisResult
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          completionPercentage: 100
        }));
      }

      return result;

    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      throw error;
    }
  }, [state.sessionId]);

  // Clear session
  const clearSession = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    sessionManagerRef.current.destroy();
    pendingDataRef.current = {};
    
    setState({
      isInitialized: false,
      isLoading: false,
      isSaving: false,
      currentStep: 'basic_info',
      completionPercentage: 0,
      data: {},
      availableSessions: [],
      hasRecoverableSessions: false
    });
  }, []);

  // Clear errors
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined, saveError: undefined }));
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !state.isInitialized) return;

    const interval = setInterval(() => {
      if (Object.keys(pendingDataRef.current).length > 0 && !state.isSaving) {
        saveSession(pendingDataRef.current);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, state.isInitialized, state.isSaving, autoSaveInterval, saveSession]);

  // Load available sessions on mount
  useEffect(() => {
    if (enableRecovery) {
      loadAvailableSessions();
    }
  }, [enableRecovery, loadAvailableSessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const actions: DiagnosisSessionActions = {
    initializeSession,
    saveSession,
    completeSession,
    updateData,
    updateProgress,
    loadAvailableSessions,
    resumeSession,
    clearSession,
    clearError
  };

  return [state, actions];
}