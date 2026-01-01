/**
 * Session Recovery Modal
 * 
 * Modal component for displaying and managing recoverable diagnosis sessions.
 * Allows users to resume interrupted consultations.
 */

import React from 'react';
import { format } from 'date-fns';
import { Clock, FileText, Play, Trash2, X } from 'lucide-react';
import type { PendingResumeState } from '@/types/diagnosis';

interface SessionRecoveryModalProps {
  isOpen: boolean;
  sessions: PendingResumeState[];
  onClose: () => void;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  isLoading?: boolean;
}

export function SessionRecoveryModal({
  isOpen,
  sessions,
  onClose,
  onResumeSession,
  onDeleteSession,
  isLoading = false
}: SessionRecoveryModalProps) {
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Unknown date';
    }
  };

  const getStepDisplayName = (step: string) => {
    const stepNames: Record<string, string> = {
      'basic_info': 'Basic Information',
      'wen_inquiry': 'Health Inquiry',
      'wang_tongue': 'Tongue Analysis',
      'wang_face': 'Face Analysis',
      'wang_part': 'Body Analysis',
      'wen_audio': 'Voice Analysis',
      'qie': 'Pulse Reading',
      'smart_connect': 'Device Connection',
      'analysis': 'Analysis',
      'results': 'Results'
    };
    return stepNames[step] || step;
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Previous Session
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              We found {sessions.length} incomplete consultation{sessions.length !== 1 ? 's' : ''}. 
              Would you like to continue where you left off?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recoverable sessions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <div
                  key={session.sessionId || session.timestamp || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Session info */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {formatTimestamp(session.timestamp)}
                          </span>
                        </div>
                        
                        {session.completionPercentage !== undefined && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionColor(session.completionPercentage)}`}>
                            {session.completionPercentage}% complete
                          </div>
                        )}
                      </div>

                      {/* Current step */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">
                          Last step: {getStepDisplayName(session.step)}
                        </p>
                      </div>

                      {/* Progress bar */}
                      {session.completionPercentage !== undefined && (
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${session.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Session data preview */}
                      {session.data && Object.keys(session.data).length > 0 && (
                        <div className="text-xs text-gray-500">
                          <p>
                            Data collected: {Object.keys(session.data).filter(key => {
                              const value = (session.data as any)[key];
                              return value && 
                                typeof value === 'object' && 
                                Object.keys(value).length > 0;
                            }).length} sections
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onResumeSession(session.sessionId!)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </button>
                      
                      {onDeleteSession && (
                        <button
                          onClick={() => onDeleteSession(session.sessionId!)}
                          disabled={isLoading}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Sessions are automatically saved and can be resumed within 24 hours.
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionRecoveryModal;