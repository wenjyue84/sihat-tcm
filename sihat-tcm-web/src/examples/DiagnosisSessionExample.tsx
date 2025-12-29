/**
 * Diagnosis Session Manager Example
 * 
 * Example component demonstrating how to use the DiagnosisSessionManager
 * with the useDiagnosisSession hook for auto-save and recovery functionality.
 */

import React, { useState, useEffect } from 'react';
import { Save, Play, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDiagnosisSession } from '@/hooks/useDiagnosisSession';
import { SessionRecoveryModal } from '@/components/diagnosis/SessionRecoveryModal';
import type { DiagnosisWizardData } from '@/types/diagnosis';

export function DiagnosisSessionExample() {
  const [sessionState, sessionActions] = useDiagnosisSession({
    autoSaveEnabled: true,
    autoSaveInterval: 10000, // 10 seconds
    enableRecovery: true,
    maxRecoveryAge: 24, // 24 hours
    guestToken: 'example-guest-token' // For demo purposes
  });

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [currentStepData, setCurrentStepData] = useState({
    name: '',
    age: '',
    symptoms: ''
  });

  // Show recovery modal if there are recoverable sessions
  useEffect(() => {
    if (sessionState.hasRecoverableSessions && !sessionState.isInitialized) {
      setShowRecoveryModal(true);
    }
  }, [sessionState.hasRecoverableSessions, sessionState.isInitialized]);

  const handleStartNewSession = async () => {
    const initialData: Partial<DiagnosisWizardData> = {
      basic_info: {
        name: currentStepData.name || undefined,
        age: currentStepData.age ? parseInt(currentStepData.age) : undefined,
        symptoms: currentStepData.symptoms || undefined
      }
    };

    await sessionActions.initializeSession(initialData);
    setShowRecoveryModal(false);
  };

  const handleUpdateData = () => {
    const updatedData: Partial<DiagnosisWizardData> = {
      basic_info: {
        name: currentStepData.name,
        age: currentStepData.age ? parseInt(currentStepData.age) : undefined,
        symptoms: currentStepData.symptoms
      }
    };

    sessionActions.updateData(updatedData);
  };

  const handleProgressStep = () => {
    const steps = ['basic_info', 'wen_inquiry', 'wang_tongue', 'wang_face', 'qie', 'results'];
    const currentIndex = steps.indexOf(sessionState.currentStep);
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
    const nextStep = steps[nextIndex];
    const percentage = ((nextIndex + 1) / steps.length) * 100;

    sessionActions.updateProgress(nextStep, percentage);
  };

  const handleManualSave = async () => {
    if (sessionState.isInitialized) {
      const result = await sessionActions.saveSession(sessionState.data);
      if (result.success) {
        alert('Session saved successfully!');
      } else {
        alert(`Save failed: ${result.error}`);
      }
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    await sessionActions.resumeSession(sessionId);
    setShowRecoveryModal(false);
    
    // Update form data from resumed session
    if (sessionState.data.basic_info) {
      setCurrentStepData({
        name: sessionState.data.basic_info.name || '',
        age: sessionState.data.basic_info.age?.toString() || '',
        symptoms: sessionState.data.basic_info.symptoms || ''
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // In a real implementation, you'd call a delete method
    console.log('Delete session:', sessionId);
    await sessionActions.loadAvailableSessions();
  };

  const getStepDisplayName = (step: string) => {
    const stepNames: Record<string, string> = {
      'basic_info': 'Basic Information',
      'wen_inquiry': 'Health Inquiry',
      'wang_tongue': 'Tongue Analysis',
      'wang_face': 'Face Analysis',
      'qie': 'Pulse Reading',
      'results': 'Results'
    };
    return stepNames[step] || step;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Diagnosis Session Manager Example
        </h1>

        {/* Session Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Session Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Status:</span>
              <div className="flex items-center gap-2 mt-1">
                {sessionState.isInitialized ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Not Started</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium">Current Step:</span>
              <div className="mt-1 text-gray-700">
                {getStepDisplayName(sessionState.currentStep)}
              </div>
            </div>
            
            <div>
              <span className="font-medium">Progress:</span>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sessionState.completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-1">
                  {sessionState.completionPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div>
              <span className="font-medium">Last Saved:</span>
              <div className="mt-1 text-gray-700">
                {sessionState.lastSaved 
                  ? sessionState.lastSaved.toLocaleTimeString()
                  : 'Never'
                }
              </div>
            </div>
          </div>

          {sessionState.isSaving && (
            <div className="mt-3 flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}

          {sessionState.saveError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Save Error: {sessionState.saveError}</p>
            </div>
          )}
        </div>

        {/* Form Example */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Basic Information Form</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={currentStepData.name}
                onChange={(e) => {
                  setCurrentStepData(prev => ({ ...prev, name: e.target.value }));
                  handleUpdateData();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={currentStepData.age}
                onChange={(e) => {
                  setCurrentStepData(prev => ({ ...prev, age: e.target.value }));
                  handleUpdateData();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your age"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms
              </label>
              <input
                type="text"
                value={currentStepData.symptoms}
                onChange={(e) => {
                  setCurrentStepData(prev => ({ ...prev, symptoms: e.target.value }));
                  handleUpdateData();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe symptoms"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!sessionState.isInitialized ? (
            <button
              onClick={handleStartNewSession}
              disabled={sessionState.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Start New Session
            </button>
          ) : (
            <>
              <button
                onClick={handleManualSave}
                disabled={sessionState.isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Manual Save
              </button>
              
              <button
                onClick={handleProgressStep}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Next Step
              </button>
              
              <button
                onClick={sessionActions.clearSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Session
              </button>
            </>
          )}

          <button
            onClick={() => setShowRecoveryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Show Recovery Modal
          </button>
        </div>

        {/* Session Data Preview */}
        {sessionState.isInitialized && Object.keys(sessionState.data).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-md font-semibold mb-2">Session Data Preview</h3>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(sessionState.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Recovery Modal */}
      <SessionRecoveryModal
        isOpen={showRecoveryModal}
        sessions={sessionState.availableSessions}
        onClose={() => setShowRecoveryModal(false)}
        onResumeSession={handleResumeSession}
        onDeleteSession={handleDeleteSession}
        isLoading={sessionState.isLoading}
      />
    </div>
  );
}

export default DiagnosisSessionExample;