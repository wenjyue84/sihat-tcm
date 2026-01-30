// React and React Native core
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';

// Expo packages
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local screens
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import DoctorDashboardScreen from './screens/dashboard/DoctorDashboardScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { AuthScreen } from './screens/auth';

// Local contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Local constants
import { Colors } from './constants/Colors';

// Local utilities
import { fetchApiKey } from './lib/apiConfig';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


function AppContent() {
  // Controls whether to show main app content (true) or auth screen (false)
  // Note: This was previously 'isGuest' but renamed for clarity
  const [showMainApp, setShowMainApp] = useState(false);
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
    setShowMainApp(true);
  };

  // Handle guest mode continue
  const handleGuestContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMainApp(true);
    setCurrentScreen('diagnosis');
  };

  // Show loading while checking onboarding status
  if (showOnboarding === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Main App Content (Dashboard/Diagnosis)
  if (showMainApp) {
    // Show Diagnosis Screen
    if (currentScreen === 'diagnosis') {
      return (
        <DiagnosisScreen
          isLoggedIn={currentUser !== null}
          onExitToDashboard={() => setCurrentScreen('dashboard')}
          onExitToLogin={() => {
            setShowMainApp(false);
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
            setShowMainApp(false);
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
          setShowMainApp(false);
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
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Main App wrapper with ThemeProvider and LanguageProvider

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
