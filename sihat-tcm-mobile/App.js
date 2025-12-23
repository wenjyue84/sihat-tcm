import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import DoctorDashboardScreen from './screens/dashboard/DoctorDashboardScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSelector, LanguageButton } from './components/LanguageSelector';
import { performBiometricLogin, hasStoredCredentials, isBiometricEnabled } from './lib/biometricAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApiKey } from './lib/apiConfig';


// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

const COLORS = {
  emeraldDeep: '#022c22',
  emeraldDark: '#064e3b',
  emeraldMedium: '#10b981',
  amberStart: '#fbbf24',
  amberEnd: '#d97706',
  white: '#ffffff',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassBg: 'rgba(255, 255, 255, 0.1)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  inputBg: 'rgba(0, 0, 0, 0.2)',
};

const FloatingLabelInput = ({ label, value, onChangeText, secureTextEntry, icon, keyboardType, autoCapitalize, onFocus, onBlur, hasError, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  // Glowing border animation when focused
  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Icon pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(iconPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
      iconPulseAnim.setValue(1);
    }
  }, [isFocused]);

  // Shake animation for errors
  useEffect(() => {
    if (hasError) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [hasError]);

  const labelStyle = {
    position: 'absolute',
    left: 48,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 6],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.textSecondary, COLORS.amberStart],
    }),
    fontWeight: isFocused ? '600' : '400',
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.amberStart, COLORS.amberEnd],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const iconColor = isFocused ? COLORS.amberStart : COLORS.textSecondary;
  const isSecure = secureTextEntry && !showPassword;

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          borderColor: isFocused ? borderColor : 'transparent',
          transform: [{ translateX: shakeAnim }],
        },
        isFocused && {
          shadowColor: COLORS.amberStart,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: shadowOpacity,
          shadowRadius: 10,
          elevation: 5,
        }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: iconPulseAnim }] }}>
        <Ionicons name={icon} size={20} color={iconColor} style={styles.inputIcon} />
      </Animated.View>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[styles.input, secureTextEntry && { paddingRight: 40 }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          setIsFocused(false);
          if (onBlur) onBlur();
        }}
        secureTextEntry={isSecure}
        placeholderTextColor="transparent"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...props}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => {
            setShowPassword(!showPassword);
            Haptics.selectionAsync();
          }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassCardContainer, style]}>
    <LinearGradient
      colors={[COLORS.glassBg, COLORS.glassBg]}
      style={StyleSheet.absoluteFillObject}
    />
    {/* Explicitly fallback for Android stability */}
    {/* <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} /> */}
    <View style={styles.glassInner}>
      {children}
    </View>
  </View>
);

const MOCKED_ACCOUNTS = [
  { label: 'Pt', role: 'Patient', email: 'patient@sihat.tcm', pass: 'Patient123' },
  { label: 'Dr', role: 'Doctor', email: 'doctor@sihat.tcm', pass: 'Doctor123' },
  { label: 'Adm', role: 'Admin', email: 'admin@sihat.tcm', pass: 'Admin123' },
  { label: 'Dev', role: 'Developer', email: 'dev@sihat.tcm', pass: 'Dev123' },
];

function AppContent() {
  // Progressive Disclosure: 'email' -> 'password' (existing user) or 'signup' (new user)
  const [authStep, setAuthStep] = useState('email'); // 'email' | 'password' | 'signup'
  const [isGuest, setIsGuest] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'diagnosis'
  const [userRole, setUserRole] = useState('patient'); // 'patient' | 'doctor' | 'admin'
  const [currentUser, setCurrentUser] = useState(null); // Track logged-in user for biometrics

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false); // For email check loading
  const [isEmailFocused, setIsEmailFocused] = useState(false); // For showing quick access buttons
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading, true/false = checked

  // Get translations
  const { t, language } = useLanguage();

  // Animation for step transitions
  const stepAnim = useRef(new Animated.Value(1)).current;

  const animateStepChange = (callback) => {
    Animated.sequence([
      Animated.timing(stepAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(stepAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  // Fetch API key from server on mount (for centralized API key management)
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

  // Validate email format
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Handle email continue - check if user exists
  const handleEmailContinue = async () => {
    if (!email.trim()) {
      Alert.alert(
        language === 'zh' ? '提示' : language === 'ms' ? 'Perhatian' : 'Notice',
        language === 'zh' ? '请输入邮箱地址' : language === 'ms' ? 'Sila masukkan alamat e-mel' : 'Please enter your email address'
      );
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert(
        language === 'zh' ? '无效邮箱' : language === 'ms' ? 'E-mel tidak sah' : 'Invalid Email',
        language === 'zh' ? '请输入有效的邮箱地址' : language === 'ms' ? 'Sila masukkan alamat e-mel yang sah' : 'Please enter a valid email address'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecking(true);

    try {
      // Check for mock accounts first
      const mockUser = MOCKED_ACCOUNTS.find(acc => acc.email === email.trim());
      if (mockUser) {
        animateStepChange(() => setAuthStep('password'));
        setChecking(false);
        return;
      }

      // Try to check if user exists by attempting a password reset
      // This doesn't actually send an email if we catch the error quickly
      // Alternative: We'll just proceed to password step and handle errors there
      // For simplicity, just go to password step - if login fails, offer signup
      animateStepChange(() => setAuthStep('password'));
    } catch (error) {
      console.log('Email check error:', error);
      animateStepChange(() => setAuthStep('password'));
    } finally {
      setChecking(false);
    }
  };

  // Handle back to email step
  const handleBackToEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStepChange(() => {
      setAuthStep('email');
      setPassword('');
      setFullName('');
    });
  };

  // Handle login attempt
  const handleLogin = async () => {
    if (loading) return;
    if (!password) {
      Alert.alert(
        language === 'zh' ? '提示' : language === 'ms' ? 'Perhatian' : 'Notice',
        language === 'zh' ? '请输入密码' : language === 'ms' ? 'Sila masukkan kata laluan' : 'Please enter your password'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Check for Mock Account Bypass (Fast Testing)
      const mockUser = MOCKED_ACCOUNTS.find(acc => acc.email === email && acc.pass === password);
      if (mockUser) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setUserRole(mockUser.role.toLowerCase());
        setCurrentUser({
          id: `mock-${mockUser.role.toLowerCase()}`,
          email: mockUser.email,
          role: mockUser.role.toLowerCase(),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsGuest(true);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Check if user doesn't exist - offer to create account
        if (error.message.includes('Invalid login credentials') ||
          error.message.includes('Email not confirmed') ||
          error.message.includes('User not found')) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            language === 'zh' ? '账户未找到' : language === 'ms' ? 'Akaun Tidak Dijumpai' : 'Account Not Found',
            language === 'zh'
              ? '该邮箱尚未注册，是否创建新账户？'
              : language === 'ms'
                ? 'E-mel ini belum didaftarkan. Buat akaun baharu?'
                : 'This email is not registered. Would you like to create an account?',
            [
              {
                text: language === 'zh' ? '取消' : language === 'ms' ? 'Batal' : 'Cancel',
                style: 'cancel'
              },
              {
                text: language === 'zh' ? '创建账户' : language === 'ms' ? 'Buat Akaun' : 'Create Account',
                onPress: () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  animateStepChange(() => setAuthStep('signup'));
                }
              }
            ]
          );
        } else {
          throw error;
        }
        return;
      }

      // Successful login
      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'patient',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsGuest(true);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'zh' ? '登录失败' : language === 'ms' ? 'Log Masuk Gagal' : 'Login Failed',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (loading) return;
    if (!fullName.trim()) {
      Alert.alert(
        language === 'zh' ? '提示' : language === 'ms' ? 'Perhatian' : 'Notice',
        language === 'zh' ? '请输入您的姓名' : language === 'ms' ? 'Sila masukkan nama anda' : 'Please enter your name'
      );
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert(
        language === 'zh' ? '密码太短' : language === 'ms' ? 'Kata laluan terlalu pendek' : 'Password Too Short',
        language === 'zh' ? '密码至少需要6个字符' : language === 'ms' ? 'Kata laluan mesti sekurang-kurangnya 6 aksara' : 'Password must be at least 6 characters'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'patient',
          },
        },
      });

      if (error) throw error;

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName.trim(),
          role: 'patient',
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          language === 'zh' ? '注册成功' : language === 'ms' ? 'Berjaya' : 'Success',
          language === 'zh'
            ? '账户创建成功！欢迎使用诗哈中医。'
            : language === 'ms'
              ? 'Akaun berjaya dibuat! Selamat datang ke Sihat TCM.'
              : 'Account created! Welcome to Sihat TCM.',
          [{
            text: 'OK',
            onPress: () => {
              // Auto-login the user since email confirmation is disabled
              setCurrentUser({
                id: user.id,
                email: user.email,
                role: 'patient',
              });
              setIsGuest(true);
            }
          }]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'zh' ? '注册失败' : language === 'ms' ? 'Pendaftaran Gagal' : 'Signup Failed',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Rotating Logo Animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Breathing Logo Animation
  const breathingAnim = useRef(new Animated.Value(1)).current;

  // Parallax Animation for Watermark
  const watermarkTranslateX = useRef(new Animated.Value(0)).current;
  const watermarkTranslateY = useRef(new Animated.Value(0)).current;
  const watermarkScale = useRef(new Animated.Value(1)).current;

  // Animate watermark parallax when step changes
  useEffect(() => {
    const targetX = authStep === 'signup' ? -30 : authStep === 'password' ? 0 : 30;
    Animated.spring(watermarkTranslateX, {
      toValue: targetX,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [authStep]);

  // Keyboard listeners for parallax effect
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const parallaxOffset = Math.min(keyboardHeight * 0.15, 50);

        Animated.parallel([
          Animated.spring(watermarkTranslateY, {
            toValue: -parallaxOffset,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(watermarkScale, {
            toValue: 1.08,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.parallel([
          Animated.spring(watermarkTranslateY, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(watermarkScale, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Golden Qi Flow: Rotating Gradient Ring
  const ringRotateAnim = useRef(new Animated.Value(0)).current;

  // Vitality Pulse: Heartbeat Animation
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Start the Golden Flow (Rotation)
    Animated.loop(
      Animated.timing(ringRotateAnim, {
        toValue: 1,
        duration: 8000, // 8 seconds per full rotation - smooth flow
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Start Watermark Rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Start the Vitality Pulse (Heartbeat) - Mimics a calm, strong heart
    // "Lub-Dub" pattern: Beat (small) -> Relax -> Beat (big) -> Relax -> Wait
    const pulseSequence = Animated.sequence([
      // Lub (First beat)
      Animated.timing(heartbeatAnim, {
        toValue: 1.08,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(heartbeatAnim, {
        toValue: 1.0,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      // Dub (Second beat - slightly stronger)
      Animated.timing(heartbeatAnim, {
        toValue: 1.12,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(heartbeatAnim, {
        toValue: 1.0,
        duration: 600, // Long exhale/relax
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Interaction pause
      Animated.delay(1500),
    ]);

    Animated.loop(pulseSequence).start();
  }, []);

  const ringSpin = ringRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Removed toggleMode - using progressive disclosure now

  // Handle Google Sign-In
  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Google Sign-In',
      'Google authentication requires OAuth setup. Would you like to continue as a guest for now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue as Guest', onPress: () => { setCurrentScreen('diagnosis'); setIsGuest(true); } }
      ]
    );
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Apple Sign-In',
      'Apple authentication requires OAuth setup. Would you like to continue as a guest for now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue as Guest', onPress: () => { setCurrentScreen('diagnosis'); setIsGuest(true); } }
      ]
    );
  };

  // Handle Biometric Authentication (Face ID / Fingerprint)
  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAuthenticating(true);

    try {
      // Check if biometrics are enabled and credentials exist
      const enabled = await isBiometricEnabled();
      const hasCredentials = await hasStoredCredentials();

      if (!enabled || !hasCredentials) {
        // No stored credentials - prompt user to enable in settings
        Alert.alert(
          'Biometric Login Not Set Up',
          'To use biometric login, first sign in with your email and password, then enable biometrics in your Profile settings.',
          [{ text: 'OK' }]
        );
        setIsAuthenticating(false);
        return;
      }

      // Perform biometric login with credential retrieval
      const result = await performBiometricLogin();

      if (result.success && result.credentials) {
        // Actually authenticate with Supabase using stored credentials
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
          email: result.credentials.email,
          password: result.credentials.password,
        });

        if (error) {
          // If stored credentials are invalid, clear them and show error
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            'Login Failed',
            'Your stored credentials are no longer valid. Please sign in with your email and password.',
            [{ text: 'OK' }]
          );
        } else {
          // Successful login!
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsGuest(true);
        }

        setLoading(false);
      } else if (result.error === 'user_cancel') {
        // User cancelled - do nothing
      } else if (result.error === 'not_supported') {
        Alert.alert(
          'Not Supported',
          'Your device does not support biometric authentication.',
          [{ text: 'OK' }]
        );
      } else if (result.error === 'not_enrolled') {
        Alert.alert(
          'Not Configured',
          'Please set up biometric authentication (Face ID or Fingerprint) in your device settings.',
          [{ text: 'OK' }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show loading while checking onboarding status
  if (showOnboarding === null) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.emeraldDeep, COLORS.emeraldDark, '#000000']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={COLORS.emeraldMedium} />
      </View>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (isGuest) {
    // Show Diagnosis Screen
    if (currentScreen === 'diagnosis') {
      return (
        <DiagnosisScreen
          isLoggedIn={currentUser !== null}
          onExitToDashboard={() => setCurrentScreen('dashboard')}
          onExitToLogin={() => {
            // Guest exits: go back to login/signup page
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

  const handleRestartOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.removeItem('@onboarding_completed');
    setShowOnboarding(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Background Gradient */}
        <LinearGradient
          colors={[COLORS.emeraldDeep, COLORS.emeraldDark, '#000000']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Rotating Watermark with Parallax Effect */}
        <View style={styles.watermarkContainer}>
          <Animated.Image
            source={require('./assets/icon.png')}
            style={[
              styles.watermark,
              {
                transform: [
                  { translateX: watermarkTranslateX },
                  { translateY: watermarkTranslateY },
                  { scale: watermarkScale },
                  { rotate: spin },
                ],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Main Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          {/* Header Area */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              {/* Golden Qi Flow Ring */}
              <View style={styles.ringContainer}>
                <Animated.View
                  style={[
                    styles.gradientRing,
                    { transform: [{ rotate: ringSpin }] }
                  ]}
                >
                  <LinearGradient
                    // Create a "broken" ring effect with transparent sections for dynamic rotation
                    colors={[COLORS.amberStart, 'transparent', COLORS.amberEnd, 'transparent', COLORS.amberStart]}
                    start={{ x: 0.0, y: 0.0 }}
                    end={{ x: 1.0, y: 1.0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                {/* Mask to create the ring width - matches background roughly */}
                <View style={styles.ringMask} />
              </View>

              <TouchableOpacity onPress={handleRestartOnboarding} activeOpacity={0.7}>
                <Animated.Image
                  source={require('./assets/logo.png')}
                  style={[
                    styles.logo,
                    { transform: [{ scale: heartbeatAnim }] }
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.headerTextContainer}>
              {/* Dynamic header based on step */}
              {authStep === 'email' && (
                <Text style={styles.welcomeTitle}>
                  {language === 'zh' ? '欢迎' : language === 'ms' ? 'Selamat Datang' : 'Welcome'}
                </Text>
              )}
              {authStep === 'password' && (
                <Text style={styles.welcomeTitle}>
                  {language === 'zh' ? '欢迎回来' : language === 'ms' ? 'Selamat Kembali' : 'Welcome Back'}
                </Text>
              )}
              {authStep === 'signup' && (
                <Text style={styles.welcomeTitle}>
                  {language === 'zh' ? '创建账户' : language === 'ms' ? 'Buat Akaun' : 'Create Account'}
                </Text>
              )}
              <Text style={styles.tagline}>{t.welcome?.subtitle || 'AI-Powered Traditional Chinese Medicine'}</Text>
            </View>
          </View>

          {/* Interactive Glass Portal */}
          <GlassCard style={styles.portalCard}>

            {/* Progressive Form Area */}
            <Animated.View style={[styles.formArea, { opacity: stepAnim }]}>

              {/* Step 1: Email Input */}
              {authStep === 'email' && (
                <>
                  <FloatingLabelInput
                    label={t.login?.email || 'Email Address'}
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={handleEmailContinue}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />

                  {/* Quick Login - Demo accounts (only shown when email is focused) */}
                  {isEmailFocused && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: COLORS.textSecondary, marginBottom: 8, fontSize: 12 }}>
                        {t.login?.quickAccess || 'Quick Access (Demo)'}:
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        {MOCKED_ACCOUNTS.map((account) => (
                          <TouchableOpacity
                            key={account.role}
                            style={{
                              backgroundColor: email === account.email ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.08)',
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: email === account.email ? COLORS.amberStart : 'transparent',
                              flex: 1,
                              alignItems: 'center'
                            }}
                            onPress={() => {
                              setEmail(account.email);
                              setPassword(account.pass);
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text style={{
                              color: email === account.email ? COLORS.amberStart : COLORS.textSecondary,
                              fontSize: 11,
                              fontWeight: '600'
                            }}>
                              {account.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleEmailContinue}
                    disabled={checking}
                  >
                    <LinearGradient
                      colors={[COLORS.amberStart, COLORS.amberEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {checking ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.actionButtonText}>
                            {language === 'zh' ? '继续' : language === 'ms' ? 'Teruskan' : 'Continue'}
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color={COLORS.emeraldDeep} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2a: Password Input (Existing User) */}
              {authStep === 'password' && (
                <>
                  {/* Email Display (Read-only) */}
                  <TouchableOpacity
                    style={styles.emailDisplayContainer}
                    onPress={handleBackToEmail}
                    activeOpacity={0.7}
                  >
                    <View style={styles.emailDisplayContent}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.amberStart} />
                      <Text style={styles.emailDisplayText} numberOfLines={1}>{email}</Text>
                    </View>
                    <Ionicons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <FloatingLabelInput
                    label={t.login?.password || 'Password'}
                    secureTextEntry
                    icon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    autoFocus
                  />

                  {/* Forgot Password Link */}
                  <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                      {t.login?.forgotPassword || 'Forgot Password?'}
                    </Text>
                  </TouchableOpacity>

                  {/* Sign In Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[COLORS.amberStart, COLORS.amberEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          {t.login?.signIn || 'Sign In'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* New User Link */}
                  <TouchableOpacity
                    style={{ marginTop: 16, alignSelf: 'center' }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      animateStepChange(() => setAuthStep('signup'));
                    }}
                  >
                    <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                      {t.login?.noAccount || "Don't have an account?"}{' '}
                      <Text style={{ color: COLORS.amberStart, fontWeight: '600' }}>
                        {language === 'zh' ? '注册' : language === 'ms' ? 'Daftar' : 'Sign Up'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2b: Signup Fields (New User) */}
              {authStep === 'signup' && (
                <>
                  {/* Email Display (Read-only) */}
                  <TouchableOpacity
                    style={styles.emailDisplayContainer}
                    onPress={handleBackToEmail}
                    activeOpacity={0.7}
                  >
                    <View style={styles.emailDisplayContent}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.amberStart} />
                      <Text style={styles.emailDisplayText} numberOfLines={1}>{email}</Text>
                    </View>
                    <Ionicons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <FloatingLabelInput
                    label={t.login?.fullName || 'Full Name'}
                    icon="person-outline"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoFocus
                  />

                  <FloatingLabelInput
                    label={t.login?.password || 'Password'}
                    secureTextEntry
                    icon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />

                  {/* Create Account Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSignup}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[COLORS.amberStart, COLORS.amberEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          {language === 'zh' ? '创建账户' : language === 'ms' ? 'Buat Akaun' : 'Create Account'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Already have account Link */}
                  <TouchableOpacity
                    style={{ marginTop: 16, alignSelf: 'center' }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      animateStepChange(() => setAuthStep('password'));
                    }}
                  >
                    <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                      {t.login?.hasAccount || "Already have an account?"}{' '}
                      <Text style={{ color: COLORS.amberStart, fontWeight: '600' }}>
                        {t.login?.signIn || 'Sign In'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

            </Animated.View>

          </GlassCard>

          {/* Social Login Options - Always visible on email step */}
          {authStep === 'email' && (
            <View style={styles.quickAccessContainer}>
              <Text style={styles.quickAccessLabel}>{t.login?.orContinueWith || 'Or continue with'}</Text>

              {/* Icon-only Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
                  <Ionicons name="logo-google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, isAuthenticating && styles.socialButtonDisabled]}
                  onPress={handleBiometricAuth}
                  disabled={isAuthenticating}
                >
                  <Ionicons name="scan-outline" size={24} color={isAuthenticating ? COLORS.textSecondary : COLORS.emeraldMedium} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.guestButton, { alignSelf: 'center' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentScreen('diagnosis');
              setIsGuest(true);
            }}
          >
            <MaterialCommunityIcons name="leaf" size={16} color={COLORS.amberStart} style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>
              {language === 'en' && 'Continue as Guest'}
              {language === 'zh' && '访客模式'}
              {language === 'ms' && 'Teruskan sebagai Tetamu'}
            </Text>
          </TouchableOpacity>

        </KeyboardAvoidingView>

        {/* Language Selector Modal */}
        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emeraldDeep,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  watermark: {
    width: width * 1.5,
    height: width * 1.5,
    opacity: 0.05,
    tintColor: COLORS.white,
  },
  headerLanguageButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  ringContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden', // Contain the gradient
    shadowColor: COLORS.amberStart,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  ringMask: {
    position: 'absolute',
    width: 144, // Creates a 3px ring border
    height: 144,
    borderRadius: 72,
    backgroundColor: COLORS.emeraldDeep, // Matches background to create "ring" effect
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    resizeMode: 'contain',
    shadowColor: COLORS.amberStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 12, // Reduced from 14
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  glassCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 30,
  },
  blurView: {
    width: '100%',
  },
  glassInner: {
    backgroundColor: COLORS.glassBg,
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.white,
    fontSize: 16,
    paddingTop: 16, // Space for floating label
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  actionButton: {
    marginTop: 10,
    shadowColor: COLORS.amberStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.emeraldDeep,
  },
  // Email display styles for progressive flow
  emailDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  emailDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emailDisplayText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.amberStart,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  quickAccessContainer: {
    alignItems: 'center',
    width: '100%',
  },
  quickAccessLabel: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  guestButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.amberStart,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  guestButtonText: {
    color: COLORS.amberStart,
    fontSize: 14,
    fontWeight: '600',
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
