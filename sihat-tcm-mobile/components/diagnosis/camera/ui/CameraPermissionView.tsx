/**
 * Camera Permission View Component
 * 
 * Displays permission request UI when camera access is not granted.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../../../types';

interface CameraPermissionViewProps {
  theme: Theme;
  onRequestPermission: () => void;
  style?: any;
}

export const CameraPermissionView: React.FC<CameraPermissionViewProps> = ({
  theme,
  onRequestPermission,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.permissionContainer}>
        <Ionicons 
          name="camera-off" 
          size={64} 
          color={theme.text.secondary} 
        />
        <Text style={[styles.permissionText, { color: theme.text.secondary }]}>
          Camera access is required for image capture and TCM analysis.
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.accent.primary }]}
          onPress={onRequestPermission}
        >
          <Text style={styles.permissionButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default CameraPermissionView;