import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Animated,
    Alert,
    Switch,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/themes';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector, LanguageRow } from '../../components/LanguageSelector';
import {
    storeCredentials,
    clearStoredCredentials,
    isBiometricEnabled,
    checkBiometricSupport as checkBiometricSupportUtil,
    authenticateWithBiometrics,
} from '../../lib/biometricAuth';

/**
 * ProfileTab - User profile management with personal info, appearance, and security settings.
 * 
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user object
 * @param {Object} props.profile - User's profile data
 * @param {Function} props.onLogout - Logout callback
 * @param {Function} props.onUpdate - Callback when profile is updated
 * @param {Object} props.styles - Shared StyleSheet from parent
 * @param {Object} props.theme - Current theme object
 */
export function ProfileTab({ user, profile, onLogout, onUpdate, styles, theme }) {
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        age: profile?.age?.toString() || '',
        gender: profile?.gender || '',
        height: (profile?.height?.toString() || '').replace(/[^0-9.]/g, ''),
        weight: (profile?.weight?.toString() || '').replace(/[^0-9.]/g, ''),
        medical_history: profile?.medical_history || '',
    });

    // Validation errors state
    const [errors, setErrors] = useState({
        age: '',
        height: '',
        weight: '',
    });

    // Focus states for input animations
    const [focusedField, setFocusedField] = useState(null);

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState({
        medicalHistory: false,
        appearance: false,
        security: false,
    });

    // Animation values for collapsible sections
    const medicalHistoryHeight = useRef(new Animated.Value(0)).current;
    const appearanceHeight = useRef(new Animated.Value(0)).current;
    const securityHeight = useRef(new Animated.Value(0)).current;

    // Animation values for input focus
    const inputScaleAnims = useRef({
        full_name: new Animated.Value(1),
        age: new Animated.Value(1),
        height: new Animated.Value(1),
        weight: new Animated.Value(1),
        medical_history: new Animated.Value(1),
    }).current;

    // Save button animation
    const saveButtonScale = useRef(new Animated.Value(1)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                full_name: profile.full_name || '',
                age: profile.age?.toString() || '',
                gender: profile.gender || '',
                height: (profile.height?.toString() || '').replace(/[^0-9.]/g, ''),
                weight: (profile.weight?.toString() || '').replace(/[^0-9.]/g, ''),
                medical_history: profile.medical_history || '',
            }));
        }
    }, [profile]);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { setThemeMode, preference, isDark } = useTheme();
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);

    const { t, language } = useLanguage();

    // Biometrics State
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [passwordForBiometric, setPasswordForBiometric] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        checkBiometricSupport();
        loadBiometricPreference();
    }, []);

    // Validation functions
    const validateAge = (value) => {
        if (!value) return '';
        const age = parseInt(value);
        if (isNaN(age)) return 'Please enter a valid number';
        if (age < 1) return 'Age must be at least 1';
        if (age > 120) return 'Age must be less than 120';
        return '';
    };

    const validateHeight = (value) => {
        if (!value) return '';
        const height = parseFloat(value);
        if (isNaN(height)) return 'Please enter a valid number';
        if (height < 30) return 'Height seems too low';
        if (height > 300) return 'Height must be less than 300 cm';
        return '';
    };

    const validateWeight = (value) => {
        if (!value) return '';
        const weight = parseFloat(value);
        if (isNaN(weight)) return 'Please enter a valid number';
        if (weight < 1) return 'Weight must be at least 1 kg';
        if (weight > 500) return 'Weight must be less than 500 kg';
        return '';
    };

    // Handle field change with validation
    const handleFieldChange = (field, value) => {
        let sanitizedValue = value;
        let error = '';

        if (field === 'age') {
            sanitizedValue = value.replace(/[^0-9]/g, '');
            error = validateAge(sanitizedValue);
        } else if (field === 'height' || field === 'weight') {
            sanitizedValue = value.replace(/[^0-9.]/g, '');
            error = field === 'height' ? validateHeight(sanitizedValue) : validateWeight(sanitizedValue);
        }

        setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    // Handle input focus animation
    const handleFocus = (field) => {
        setFocusedField(field);
        Animated.spring(inputScaleAnims[field], {
            toValue: 1.02,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
        Haptics.selectionAsync();
    };

    // Handle input blur animation
    const handleBlur = (field) => {
        setFocusedField(null);
        Animated.spring(inputScaleAnims[field], {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    // Toggle collapsible section
    const toggleSection = (section) => {
        const isExpanding = !expandedSections[section];
        setExpandedSections(prev => ({ ...prev, [section]: isExpanding }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const animValue = section === 'medicalHistory' ? medicalHistoryHeight :
            section === 'appearance' ? appearanceHeight : securityHeight;

        Animated.spring(animValue, {
            toValue: isExpanding ? 1 : 0,
            friction: 8,
            tension: 50,
            useNativeDriver: false,
        }).start();
    };

    const checkBiometricSupport = async () => {
        const result = await checkBiometricSupportUtil();
        setIsBiometricSupported(result.supported && result.enrolled);
    };

    const loadBiometricPreference = async () => {
        try {
            const enabled = await isBiometricEnabled();
            setBiometricsEnabled(enabled);
        } catch (e) {
            console.log('Error loading biometric preference:', e);
        }
    };

    const toggleBiometrics = async (value) => {
        Haptics.selectionAsync();
        if (value) {
            if (!user?.email) {
                Alert.alert(
                    'Login Required',
                    'Please sign in with your email and password first to enable biometric login.',
                    [{ text: 'OK' }]
                );
                return;
            }
            setShowPasswordPrompt(true);
        } else {
            await clearStoredCredentials();
            setBiometricsEnabled(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleEnableBiometrics = async () => {
        if (!passwordForBiometric) {
            Alert.alert('Error', 'Password is required');
            return;
        }

        setShowPasswordPrompt(false);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordForBiometric,
            });

            if (error) {
                Alert.alert('Error', 'Invalid password. Please try again.');
                setPasswordForBiometric('');
                return;
            }

            const authResult = await authenticateWithBiometrics('Confirm to enable biometric login');
            if (!authResult.success) {
                if (authResult.error !== 'user_cancel') {
                    Alert.alert('Error', 'Biometric authentication failed');
                }
                setPasswordForBiometric('');
                return;
            }

            const stored = await storeCredentials(user.email, passwordForBiometric);
            if (stored) {
                setBiometricsEnabled(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Success',
                    'Biometric login enabled! You can now use Face ID or Fingerprint to sign in.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', 'Failed to store credentials securely');
            }
        } catch (error) {
            console.error('Biometric setup error:', error);
            Alert.alert('Error', 'Failed to enable biometric login');
        } finally {
            setPasswordForBiometric('');
        }
    };

    // Check if form has validation errors
    const hasErrors = Object.values(errors).some(error => error !== '');

    const handleSave = async () => {
        // Validate all fields before saving
        const ageError = validateAge(formData.age);
        const heightError = validateHeight(formData.height);
        const weightError = validateWeight(formData.weight);

        setErrors({ age: ageError, height: heightError, weight: weightError });

        if (ageError || heightError || weightError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Validation Error', 'Please fix the highlighted fields before saving.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Button press animation
        Animated.sequence([
            Animated.timing(saveButtonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(saveButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            if (user?.id) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        age: parseInt(formData.age) || null,
                        gender: formData.gender,
                        height: parseFloat(formData.height) || null,
                        weight: parseFloat(formData.weight) || null,
                        medical_history: formData.medical_history,
                    })
                    .eq('id', user.id);

                if (error) throw error;
            }

            setSaved(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Checkmark success animation
            Animated.spring(checkmarkScale, {
                toValue: 1,
                friction: 5,
                tension: 100,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                setSaved(false);
                checkmarkScale.setValue(0);
            }, 2000);

            if (onUpdate) onUpdate();
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSaving(false);
        }
    };

    const genderOptions = ['male', 'female', 'other'];
    const themeOptions = [
        { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
        { id: 'light', label: 'Light', icon: 'sunny-outline' },
        { id: 'dark', label: 'Dark', icon: 'moon-outline' },
    ];

    // Dynamic input style based on focus and error state
    const getInputStyle = (field) => {
        const baseStyle = [styles.formInput];
        if (focusedField === field) {
            baseStyle.push(styles.formInputFocused);
        }
        if (errors[field]) {
            baseStyle.push(styles.formInputError);
        }
        return baseStyle;
    };

    // Collapsible section header component
    const CollapsibleHeader = ({ title, section, icon }) => (
        <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection(section)}
            activeOpacity={0.7}
        >
            <View style={styles.collapsibleHeaderLeft}>
                <Ionicons name={icon} size={20} color={theme.accent.primary} />
                <Text style={styles.formSectionTitle}>{title}</Text>
            </View>
            <Animated.View
                style={{
                    transform: [{
                        rotate: (section === 'medicalHistory' ? medicalHistoryHeight :
                            section === 'appearance' ? appearanceHeight : securityHeight).interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '180deg'],
                            }),
                    }],
                }}
            >
                <Ionicons name="chevron-down" size={20} color={theme.text.secondary} />
            </Animated.View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={theme.gradients.success}
                        style={styles.avatarGradient}
                    >
                        <Text style={styles.avatarText}>
                            {formData.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </LinearGradient>
                </View>
                <Text style={styles.profileName}>{formData.full_name || 'Your Name'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'guest@sihat.tcm'}</Text>
            </View>

            {/* Form Fields - Personal Information */}
            <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Personal Information</Text>

                {/* Full Name Field */}
                <View style={styles.formField}>
                    <Text style={styles.formLabel}>Full Name</Text>
                    <Animated.View style={{ transform: [{ scale: inputScaleAnims.full_name }] }}>
                        <TextInput
                            style={getInputStyle('full_name')}
                            value={formData.full_name}
                            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                            onFocus={() => handleFocus('full_name')}
                            onBlur={() => handleBlur('full_name')}
                            placeholderTextColor={COLORS.textSecondary}
                            placeholder="Enter your name"
                        />
                    </Animated.View>
                </View>

                {/* Age and Gender Row */}
                <View style={styles.formRow}>
                    <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Age</Text>
                        <Animated.View style={{ transform: [{ scale: inputScaleAnims.age }] }}>
                            <TextInput
                                style={getInputStyle('age')}
                                value={formData.age}
                                onChangeText={(text) => handleFieldChange('age', text)}
                                onFocus={() => handleFocus('age')}
                                onBlur={() => handleBlur('age')}
                                keyboardType="numeric"
                                placeholder="Age"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </Animated.View>
                        {errors.age ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{errors.age}</Text>
                            </View>
                        ) : null}
                    </View>
                    <View style={[styles.formField, { flex: 1.5, marginLeft: 12 }]}>
                        <Text style={styles.formLabel}>Gender</Text>
                        <View style={styles.genderRow}>
                            {genderOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        formData.gender === option && styles.genderOptionActive,
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, gender: option });
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            formData.gender === option && styles.genderTextActive,
                                        ]}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Height and Weight Row */}
                <View style={styles.formRow}>
                    <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Height (cm)</Text>
                        <Animated.View style={{ transform: [{ scale: inputScaleAnims.height }] }}>
                            <TextInput
                                style={getInputStyle('height')}
                                value={formData.height}
                                onChangeText={(text) => handleFieldChange('height', text)}
                                onFocus={() => handleFocus('height')}
                                onBlur={() => handleBlur('height')}
                                keyboardType="decimal-pad"
                                placeholder="170"
                                placeholderTextColor={theme.text.tertiary}
                            />
                        </Animated.View>
                        {errors.height ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{errors.height}</Text>
                            </View>
                        ) : null}
                    </View>
                    <View style={[styles.formField, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.formLabel}>Weight (kg)</Text>
                        <Animated.View style={{ transform: [{ scale: inputScaleAnims.weight }] }}>
                            <TextInput
                                style={getInputStyle('weight')}
                                value={formData.weight}
                                onChangeText={(text) => handleFieldChange('weight', text)}
                                onFocus={() => handleFocus('weight')}
                                onBlur={() => handleBlur('weight')}
                                keyboardType="decimal-pad"
                                placeholder="65"
                                placeholderTextColor={theme.text.tertiary}
                            />
                        </Animated.View>
                        {errors.weight ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{errors.weight}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>

            {/* Medical History - Collapsible */}
            <View style={styles.formSection}>
                <CollapsibleHeader
                    title="Medical History"
                    section="medicalHistory"
                    icon="medical-outline"
                />
                <Animated.View
                    style={{
                        overflow: 'hidden',
                        maxHeight: medicalHistoryHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                        }),
                        opacity: medicalHistoryHeight,
                    }}
                >
                    <View style={styles.collapsibleContent}>
                        <Animated.View style={{ transform: [{ scale: inputScaleAnims.medical_history }] }}>
                            <TextInput
                                style={[styles.formInput, styles.formTextarea]}
                                value={formData.medical_history}
                                onChangeText={(text) => setFormData({ ...formData, medical_history: text })}
                                onFocus={() => handleFocus('medical_history')}
                                onBlur={() => handleBlur('medical_history')}
                                placeholder="Any existing conditions, allergies, medications..."
                                placeholderTextColor={COLORS.textSecondary}
                                multiline
                                numberOfLines={4}
                            />
                        </Animated.View>
                    </View>
                </Animated.View>
            </View>

            {/* Save Button with Animation */}
            <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        saved && styles.saveButtonSuccess,
                        hasErrors && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <LinearGradient
                        colors={saved ? ['#22C55E', '#16A34A'] : hasErrors ? ['#9CA3AF', '#6B7280'] : theme.gradients.accent}
                        style={styles.saveButtonGradient}
                    >
                        {saving ? (
                            <Text style={styles.saveButtonText}>Saving...</Text>
                        ) : saved ? (
                            <>
                                <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                                </Animated.View>
                                <Text style={styles.saveButtonText}>Saved!</Text>
                            </>
                        ) : (
                            <Text style={styles.saveButtonText}>Save Profile</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Appearance Settings - Collapsible */}
            <View style={styles.formSection}>
                <CollapsibleHeader
                    title="Appearance"
                    section="appearance"
                    icon="color-palette-outline"
                />
                <Animated.View
                    style={{
                        overflow: 'hidden',
                        maxHeight: appearanceHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                        }),
                        opacity: appearanceHeight,
                    }}
                >
                    <View style={styles.collapsibleContent}>
                        <View style={styles.themeContainer}>
                            {themeOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.themeOption,
                                        preference === option.id && styles.themeOptionActive,
                                    ]}
                                    onPress={() => {
                                        setThemeMode(option.id);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={22}
                                        color={preference === option.id ? theme.accent.secondary : theme.text.secondary}
                                    />
                                    <Text
                                        style={[
                                            styles.themeText,
                                            preference === option.id && styles.themeTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.themeHint}>
                            {preference === 'system'
                                ? `Using system preference (${isDark ? 'Dark' : 'Light'} mode)`
                                : `Currently: ${isDark ? 'Dark' : 'Light'} mode`
                            }
                        </Text>
                        <View style={{ marginTop: 16 }}>
                            <LanguageRow onPress={() => setShowLanguageSelector(true)} />
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Security Settings - Collapsible */}
            <View style={styles.formSection}>
                <CollapsibleHeader
                    title="Security"
                    section="security"
                    icon="shield-checkmark-outline"
                />
                <Animated.View
                    style={{
                        overflow: 'hidden',
                        maxHeight: securityHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 120],
                        }),
                        opacity: securityHeight,
                    }}
                >
                    <View style={styles.collapsibleContent}>
                        <View style={styles.securityRow}>
                            <View style={styles.securityInfo}>
                                <Ionicons
                                    name="finger-print-outline"
                                    size={24}
                                    color={isBiometricSupported ? theme.accent.primary : theme.text.tertiary}
                                />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[
                                        styles.securityTitle,
                                        !isBiometricSupported && { color: theme.text.tertiary }
                                    ]}>
                                        Biometric Login
                                    </Text>
                                    <Text style={styles.securitySubtitle}>
                                        {isBiometricSupported
                                            ? "Use Face ID or Fingerprint to sign in"
                                            : "Biometrics not available on this device"}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: theme.surface.tertiary, true: theme.accent.primary }}
                                thumbColor={COLORS.white}
                                ios_backgroundColor={theme.surface.tertiary}
                                onValueChange={toggleBiometrics}
                                value={biometricsEnabled}
                                disabled={!isBiometricSupported}
                            />
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {/* Language Selector Modal */}
            <LanguageSelector
                visible={showLanguageSelector}
                onClose={() => setShowLanguageSelector(false)}
            />

            {/* Password Prompt Modal for Biometric Setup */}
            <Modal
                visible={showPasswordPrompt}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowPasswordPrompt(false);
                    setPasswordForBiometric('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.passwordModal}>
                        <Text style={styles.passwordModalTitle}>Enable Biometric Login</Text>
                        <Text style={styles.passwordModalSubtitle}>
                            Enter your password to securely store your credentials for biometric login
                        </Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInputField}
                                placeholder="Enter password"
                                placeholderTextColor={theme.text.tertiary}
                                secureTextEntry={!showPassword}
                                value={passwordForBiometric}
                                onChangeText={setPasswordForBiometric}
                                autoFocus
                            />
                            <TouchableOpacity
                                style={styles.passwordEyeButton}
                                onPress={() => {
                                    setShowPassword(!showPassword);
                                    Haptics.selectionAsync();
                                }}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={theme.text.secondary}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordModalButtons}>
                            <TouchableOpacity
                                style={styles.passwordModalCancel}
                                onPress={() => {
                                    setShowPasswordPrompt(false);
                                    setPasswordForBiometric('');
                                }}
                            >
                                <Text style={styles.passwordModalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.passwordModalEnable}
                                onPress={handleEnableBiometrics}
                            >
                                <LinearGradient
                                    colors={theme.gradients.accent}
                                    style={styles.passwordModalEnableGradient}
                                >
                                    <Text style={styles.passwordModalEnableText}>Enable</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

export default ProfileTab;
