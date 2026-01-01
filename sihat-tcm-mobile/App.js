import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  UIManager,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import DoctorDashboardScreen from './screens/dashboard/DoctorDashboardScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSelector } from './components/LanguageSelector';
import { performBiometricLogin, hasStoredCredentials, isBiometricEnabled } from './lib/biometricAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuestSessionToken, clearGuestSessionToken } from './lib/guestSession';
import { API_CONFIG, fetchApiKey } from './lib/apiConfig';

// Extracted components and constants
import { AUTH_COLORS as COLORS } from './constants/AuthColors';
import { MOCKED_ACCOUNTS } from './constants/MockedAccounts';
import { FloatingLabelInput } from './components/auth/FloatingLabelInput';
import { GlassCard } from './components/ui/GlassCard';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

import { AuthScreen } from './screens/auth';

function AppContent() {
  const [isGuest, setIsGuest] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'diagnosis'
  const [userRole, setUserRole] = useState('patient'); // 'patient' | 'doctor' | 'admin'
  const [currentUser, setCurrentUser] = useState(null); // Track logged-in user

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading, true/false = checked

  // Get translations
  const { language } = useLanguage();

  // Fetch API key from server on mount
  useEffect(() => {
    const initApiKey = async () => {
      try {
        console.log('[App] Fetching API key from admin dashboard...');
        await fetchApiKey();
        console.log('[App] API key initialized successfully');
      } catch (error) {
        console.warn('[App] Failed to fetch API key, using fallback:', error.message);
      }
    };
    initApiKey();
  }, []);

  // Check if onboarding is completed on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('@onboarding_completed');
        setShowOnboarding(completed !== 'true');
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setShowOnboarding(false); // Skip onboarding on error
      }
    };
    checkOnboarding();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Handle successful authentication
  const handleAuthSuccess = (user) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentUser(user);
    setUserRole(user.role || 'patient');
    setIsGuest(true); // isGuest here actually means "should show main app"
  };

  // Handle guest mode continue
  const handleGuestContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGuest(true);
    setCurrentScreen('diagnosis');
  };

  // Show loading while checking onboarding status
  if (showOnboarding === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Main App Content (Dashboard/Diagnosis)
  if (isGuest) {
    // Show Diagnosis Screen
    if (currentScreen === 'diagnosis') {
      return (
        <DiagnosisScreen
          isLoggedIn={currentUser !== null}
          onExitToDashboard={() => setCurrentScreen('dashboard')}
          onExitToLogin={() => {
            setIsGuest(false);
            setCurrentScreen('dashboard');
          }}
        />
      );
    }

    // Show Doctor Dashboard for doctors
    if (userRole === 'doctor') {
      return (
        <DoctorDashboardScreen
          user={currentUser}
          profile={{ role: 'doctor' }}
          onLogout={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsGuest(false);
            setUserRole('patient');
            setCurrentUser(null);
            setCurrentScreen('dashboard');
          }}
        />
      );
    }

    // Show Patient Dashboard (default after login)
    return (
      <DashboardScreen
        user={currentUser}
        profile={null}
        onStartDiagnosis={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCurrentScreen('diagnosis');
        }}
        onLogout={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsGuest(false);
          setUserRole('patient');
          setCurrentUser(null);
          setCurrentScreen('dashboard');
        }}
      />
    );
  }

  // Default: Show Authentication Screen
  return (
    <AuthScreen
      onAuthSuccess={handleAuthSuccess}
      onGuestMode={handleGuestContinue}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B', // COLORS.emeraldDeep
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Main App wrapper with ThemeProvider and LanguageProvider
import ResultsDockTest from './screens/diagnosis/ResultsDockTest';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
        {/* <ResultsDockTest /> */}
      </LanguageProvider>
    </ThemeProvider>
  );
}
