'use client';

import { useState } from 'react';
import { CameraCapture } from '@/components/diagnosis/camera-capture';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestCameraPage() {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState(0);

    const handleCameraComplete = (data: { image: string }) => {
        console.log('Camera capture complete:', data);
        setCapturedImage(data.image);
    };

    const handleReset = () => {
        setCapturedImage(null);
        setResetKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Camera Component Test</h1>
                    <Button onClick={handleReset} variant="outline">
                        Reset Test
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Tongue Diagnosis Mode</h2>
                        {!capturedImage ? (
                            <CameraCapture
                                key={`camera-${resetKey}`}
                                mode="tongue"
                                onComplete={handleCameraComplete}
                            />
                        ) : (
                            <div className="text-center p-8 bg-emerald-50 rounded-lg">
                                <h3 className="text-emerald-800 font-medium mb-4">Image Captured Successfully!</h3>
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    className="max-w-md mx-auto rounded-lg shadow-md border-4 border-white"
                                />
                                <div className="mt-6">
                                    <Button onClick={handleReset}>Retake Photo</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                            <li><strong>Has Secure Context:</strong> {typeof window !== 'undefined' && window.isSecureContext ? 'Yes' : 'No'}</li>
                            <li><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Server'}</li>
                            <li><strong>MediaDevices API:</strong> {typeof navigator !== 'undefined' && navigator.mediaDevices ? 'Available' : 'Unavailable'}</li>
                            <li><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
