/**
 * Camera Timer Hook
 * 
 * Manages timer functionality for delayed camera capture.
 */

import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

interface UseCameraTimerProps {
  timerDuration: number;
  timerAnimation: Animated.Value;
  onTimerComplete: () => Promise<void>;
  onTimerUpdate: (count: number) => void;
  onError: (error: string) => void;
}

export function useCameraTimer({
  timerDuration,
  timerAnimation,
  onTimerComplete,
  onTimerUpdate,
  onError,
}: UseCameraTimerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    onTimerUpdate(timerDuration);
    
    const countdown = setInterval(() => {
      onTimerUpdate(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          timerRef.current = null;
          
          // Capture after timer ends
          setTimeout(async () => {
            try {
              await onTimerComplete();
            } catch (error) {
              onError('Timer capture failed');
            }
            onTimerUpdate(0);
          }, 100);
          
          return 0;
        }
        
        // Animate timer
        Animated.sequence([
          Animated.timing(timerAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(timerAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = countdown;
  }, [timerDuration, timerAnimation, onTimerComplete, onTimerUpdate, onError]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      onTimerUpdate(0);
    }
  }, [onTimerUpdate]);

  const isTimerActive = useCallback(() => {
    return timerRef.current !== null;
  }, []);

  return {
    startTimer,
    cancelTimer,
    isTimerActive,
  };
}

export default useCameraTimer;