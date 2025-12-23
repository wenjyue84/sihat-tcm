/**
 * Language Selector Component for Sihat TCM Mobile
 * 
 * A native-first language picker with:
 * - Bottom sheet modal presentation
 * - Glassmorphism styling
 * - Haptic feedback
 * - Animated transitions
 */

import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { languageNames, SUPPORTED_LANGUAGES } from '../lib/translations';

const { width } = Dimensions.get('window');

// Language options with flags
const LANGUAGE_OPTIONS = [
    { code: 'en', flag: '🇺🇸', native: 'English', english: 'English' },
    { code: 'zh', flag: '🇨🇳', native: '中文', english: 'Chinese' },
    { code: 'ms', flag: '🇲🇾', native: 'Bahasa Malaysia', english: 'Malay' },
];

/**
 * Language Selector Modal Component
 * Displays a bottom sheet with language options
 */
export function LanguageSelector({ visible, onClose }) {
    const { language, setLanguage, t } = useLanguage();
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const handleSelectLanguage = (langCode) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLanguage(langCode);

        // Brief delay to show selection before closing
        setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
        }, 200);
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.sheetContainer}>
                    <BlurView
                        intensity={isDark ? 60 : 90}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.blurContainer}
                    >
                        {/* Handle bar */}
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {t.language.selectLanguage}
                            </Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={theme.text.secondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Language Options */}
                        <View style={styles.optionsContainer}>
                            {LANGUAGE_OPTIONS.map((option) => {
                                const isSelected = language === option.code;
                                return (
                                    <TouchableOpacity
                                        key={option.code}
                                        style={[
                                            styles.optionItem,
                                            isSelected && styles.optionItemSelected,
                                        ]}
                                        onPress={() => handleSelectLanguage(option.code)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.optionLeft}>
                                            <Text style={styles.optionFlag}>{option.flag}</Text>
                                            <View style={styles.optionTextContainer}>
                                                <Text style={[
                                                    styles.optionNative,
                                                    isSelected && styles.optionTextSelected,
                                                ]}>
                                                    {option.native}
                                                </Text>
                                                <Text style={styles.optionEnglish}>
                                                    {option.english}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={24}
                                                color={theme.accent.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Footer note */}
                        <Text style={styles.footerNote}>
                            {language === 'en' && 'Language will be applied immediately'}
                            {language === 'zh' && '语言将立即生效'}
                            {language === 'ms' && 'Bahasa akan digunakan serta-merta'}
                        </Text>
                    </BlurView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

/**
 * Language Button Component
 * A compact button to open the language selector
 */
export function LanguageButton({ onPress, style, compact = false }) {
    const { language } = useLanguage();
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactButton, style]}
                onPress={handlePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={styles.compactButtonText}>{currentLang?.flag}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.languageButton, style]}
            onPress={handlePress}
        >
            <Ionicons name="globe-outline" size={20} color={theme.text.primary} />
            <Text style={styles.languageButtonText}>
                {currentLang?.native || 'English'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.text.secondary} />
        </TouchableOpacity>
    );
}

/**
 * Language Row Component
 * For use in settings/profile screens
 */
export function LanguageRow({ onPress }) {
    const { language, t } = useLanguage();
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    return (
        <TouchableOpacity style={styles.settingsRow} onPress={handlePress}>
            <View style={styles.settingsRowLeft}>
                <View style={styles.settingsRowIcon}>
                    <Ionicons name="globe-outline" size={22} color={theme.accent.primary} />
                </View>
                <Text style={styles.settingsRowLabel}>{t.profile.language}</Text>
            </View>
            <View style={styles.settingsRowRight}>
                <Text style={styles.settingsRowValue}>
                    {currentLang?.flag} {currentLang?.native}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// Styles
const createStyles = (theme, isDark) => StyleSheet.create({
    // Modal overlay
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },

    // Bottom sheet container
    sheetContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },

    blurContainer: {
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        paddingHorizontal: 20,
        paddingTop: 12,
    },

    // Handle bar
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text.primary,
    },

    closeButton: {
        padding: 4,
    },

    // Options container
    optionsContainer: {
        gap: 8,
    },

    // Option item
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(0, 0, 0, 0.04)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
    },

    optionItemSelected: {
        backgroundColor: isDark
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(16, 185, 129, 0.1)',
        borderColor: theme.accent.primary,
    },

    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    optionFlag: {
        fontSize: 28,
    },

    optionTextContainer: {
        gap: 2,
    },

    optionNative: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },

    optionTextSelected: {
        color: theme.accent.primary,
    },

    optionEnglish: {
        fontSize: 13,
        color: theme.text.secondary,
    },

    // Footer note
    footerNote: {
        fontSize: 12,
        color: theme.text.tertiary,
        textAlign: 'center',
        marginTop: 16,
    },

    // Language button (header style)
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },

    languageButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text.primary,
    },

    // Compact button (just flag)
    compactButton: {
        padding: 8,
    },

    compactButtonText: {
        fontSize: 24,
    },

    // Settings row style
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 8,
    },

    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    settingsRowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: isDark
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    settingsRowLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text.primary,
    },

    settingsRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    settingsRowValue: {
        fontSize: 14,
        color: theme.text.secondary,
    },
});

export default LanguageSelector;
