/**
 * Enhanced Progress Stepper Example
 * 
 * Example component demonstrating the enhanced progress stepper with
 * all features including time estimates, guidance, and accessibility.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedProgressStepper } from '@/components/diagnosis/EnhancedProgressStepper';
import { useDiagnosisSteps } from '@/hooks/useDiagnosisSteps';
import { Play, RotateCcw, Settings, Eye } from 'lucide-react';

export function EnhancedProgressStepperExample() {
  const [currentStep, setCurrentStep] = useState('wen_inquiry');
  const [variant, setVariant] = useState<'default' | 'compact' | 'detailed'>('default');
  const [showTimeEstimate, setShowTimeEstimate] = useState(true);
  const [showGuidance, setShowGuidance] = useState(true);
  const [showAutoSaveStatus, setShowAutoSaveStatus] = useState(true);
  const [includeOptionalSteps, setIncludeOptionalSteps] = useState(true);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const { steps, getStepProgress, getRemainingTime, totalEstimatedTime } = useDiagnosisSteps({
    includeOptionalSteps,
    userLevel
  });

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const handleNextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleReset = () => {
    setCurrentStep('basic_info');
  };

  const currentStepData = steps.find(s => s.id === currentStep);
  const progress = getStepProgress(currentStep);
  const remainingTime = getRemainingTime(currentStep);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Progress Stepper Demo
        </h1>
        <p className="text-gray-600">
          Interactive demonstration of the enhanced diagnosis progress stepper
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Variant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant
              </label>
              <div className="flex gap-2">
                {(['default', 'compact', 'detailed'] as const).map((v) => (
                  <Button
                    key={v}
                    variant={variant === v ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVariant(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* User Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Level
              </label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={userLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUserLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showTimeEstimate}
                    onChange={(e) => setShowTimeEstimate(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Time Estimates</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showGuidance}
                    onChange={(e) => setShowGuidance(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Guidance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showAutoSaveStatus}
                    onChange={(e) => setShowAutoSaveStatus(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-save Status</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeOptionalSteps}
                    onChange={(e) => setIncludeOptionalSteps(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Optional Steps</span>
                </label>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handlePreviousStep} variant="outline" size="sm">
              Previous Step
            </Button>
            <Button onClick={handleNextStep} variant="outline" size="sm">
              Next Step
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Step</div>
              <div className="font-semibold">{currentStepData?.label}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Progress</div>
              <div className="font-semibold">{Math.round(progress)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Remaining Time</div>
              <div className="font-semibold">
                {remainingTime < 60 
                  ? `${remainingTime} min` 
                  : `${Math.floor(remainingTime / 60)}h ${remainingTime % 60}m`
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Steps</div>
              <div className="font-semibold flex items-center gap-2">
                {steps.length}
                <Badge variant="secondary" className="text-xs">
                  {steps.filter(s => s.isOptional).length} optional
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Stepper Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Progress Stepper Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedProgressStepper
            currentStep={currentStep}
            steps={steps}
            onStepClick={handleStepClick}
            showTimeEstimate={showTimeEstimate}
            showGuidance={showGuidance}
            showAutoSaveStatus={showAutoSaveStatus}
            variant={variant}
            enableKeyboardNavigation={true}
          />
        </CardContent>
      </Card>

      {/* Current Step Details */}
      {currentStepData && (
        <Card>
          <CardHeader>
            <CardTitle>Step Details: {currentStepData.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700">{currentStepData.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                <p className="text-gray-700">{currentStepData.estimatedDuration} minutes</p>
              </div>
              
              {currentStepData.isOptional && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                  <Badge variant="secondary">Optional</Badge>
                </div>
              )}
              
              {currentStepData.prerequisites && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Prerequisites</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentStepData.prerequisites.map(prereq => (
                      <Badge key={prereq} variant="outline" className="text-xs">
                        {steps.find(s => s.id === prereq)?.label || prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {currentStepData.guidance && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Guidance</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">
                    {currentStepData.guidance.title}
                  </h5>
                  <p className="text-blue-800 mb-3">
                    {currentStepData.guidance.content}
                  </p>
                  {currentStepData.guidance.tips && (
                    <div>
                      <h6 className="font-medium text-blue-900 mb-2">Tips:</h6>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                        {currentStepData.guidance.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Keyboard Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd> - Navigate between elements</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Enter/Space</kbd> - Activate step</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Arrow Keys</kbd> - Navigate steps</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Home/End</kbd> - First/Last step</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Screen Reader Support</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• ARIA labels and descriptions</li>
                <li>• Progress announcements</li>
                <li>• Step navigation feedback</li>
                <li>• Guidance content reading</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedProgressStepperExample;