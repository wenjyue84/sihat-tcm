/**
 * Camera Controls Component
 * 
 * Provides camera control buttons including capture, flash, facing toggle, and gallery access.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraSettings } from '../interfaces/CameraInterfaces';

interface CameraControlsProps {
  settings: CameraSettings;
  isCapturing: boolean;
  timerCount: number;
  capturedImagesCount: number;
  maxImages: number;
  captureMode: 'single' | 'burst' | 'timer';
  captureAnimation: Animated.Value;
  onCapture: () => void;
  onToggleFlash: () => void;
  onToggleFacing: () => void;
  onPickFromGallery: () => void;
  onCancel: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  settings,
  isCapturing,
  timerCount,
  capturedImagesCount,
  maxImages,
  captureMode,
  captureAnimation,
  onCapture,
  onToggleFlash,
  onToggleFacing,
  onPickFromGallery,
  onCancel,
}) => {
  return (
    <View style={styles.controlsContainer}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={onCancel}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.topControlsRight}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={onToggleFlash}
          >
            <Ionicons 
              name={settings.flash === 'off' ? 'flash-off' : 'flash'} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={onToggleFacing}
          >
            <Ionicons name="camera-reverse" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={onPickFromGallery}
        >
          <Ionicons name="images" size={24} color="#ffffff" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: captureAnimation }] }}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              {
                backgroundColor: isCapturing 
                  ? 'rgba(255,255,255,0.5)' 
                  : '#ffffff',
              },
            ]}
            onPress={onCapture}
            disabled={isCapturing || timerCount > 0}
          >
            <View style={[
              styles.captureButtonInner,
              {
                backgroundColor: isCapturing ? '#ff6b6b' : '#ffffff',
              }
            ]} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.captureInfo}>
          <Text style={[styles.captureMode, { color: '#ffffff' }]}>
            {captureMode.toUpperCase()}
          </Text>
          {capturedImagesCount > 0 && (
            <Text style={[styles.captureCount, { color: '#ffffff' }]}>
              {capturedImagesCount}/{maxImages}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topControlsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  captureInfo: {
    alignItems: 'center',
    minWidth: 50,
  },
  captureMode: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  captureCount: {
    fontSize: 10,
    opacity: 0.8,
  },
});

export default CameraControls;