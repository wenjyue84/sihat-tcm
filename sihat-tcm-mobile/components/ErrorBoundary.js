import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * ErrorBoundary - A fault-tolerant wrapper component that catches React errors
 * and displays a user-friendly fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - Catches JavaScript errors anywhere in the child component tree
 * - Displays a friendly error message with recovery options
 * - Provides Back and Retry buttons for user recovery
 * - Native haptic feedback for error states
 * - Glassmorphic UI matching Sihat TCM design
 * - Dev mode shows error details and stack trace
 * - Theme-aware (light/dark mode support)
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error for debugging
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        // Haptic feedback for error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleRetry = () => {
        // Haptic feedback for action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Reset the error state
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        });

        // Call the onRetry callback if provided
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    handleBack = () => {
        // Haptic feedback for action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Reset the error state first
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        });

        // Call the onBack callback if provided
        if (this.props.onBack) {
            this.props.onBack();
        }
    };

    toggleDetails = () => {
        Haptics.selectionAsync();
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render() {
        const {
            children,
            fallbackTitle = 'Something went wrong',
            fallbackMessage = 'An unexpected error occurred. Please try again or go back to the previous step.',
            showBackButton = true,
            showRetryButton = true,
            theme,
            isDark = false,
        } = this.props;

        if (this.state.hasError) {
            const styles = createStyles(theme, isDark);
            const isDevMode = __DEV__;

            return (
                <View style={styles.container}>
                    <BlurView
                        intensity={isDark ? 40 : 60}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.blurContainer}
                    >
                        <View style={styles.card}>
                            {/* Error Icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['#fbbf24', '#f59e0b', '#d97706']}
                                    style={styles.iconGradient}
                                >
                                    <Ionicons name="alert-circle" size={40} color="#ffffff" />
                                </LinearGradient>
                            </View>

                            {/* Error Title */}
                            <Text style={styles.title}>{fallbackTitle}</Text>

                            {/* Error Message */}
                            <Text style={styles.message}>{fallbackMessage}</Text>

                            {/* Development Mode: Show error details */}
                            {isDevMode && this.state.error && (
                                <View style={styles.devContainer}>
                                    <TouchableOpacity
                                        style={styles.detailsToggle}
                                        onPress={this.toggleDetails}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={isDark ? '#94a3b8' : '#64748b'}
                                        />
                                        <Text style={styles.detailsToggleText}>
                                            {this.state.showDetails ? 'Hide' : 'Show'} error details
                                        </Text>
                                    </TouchableOpacity>

                                    {this.state.showDetails && (
                                        <ScrollView
                                            style={styles.detailsScroll}
                                            showsVerticalScrollIndicator={true}
                                        >
                                            <Text style={styles.errorText}>
                                                <Text style={styles.errorLabel}>Error: </Text>
                                                {this.state.error.message}
                                            </Text>
                                            {this.state.errorInfo?.componentStack && (
                                                <Text style={styles.stackText}>
                                                    {this.state.errorInfo.componentStack}
                                                </Text>
                                            )}
                                        </ScrollView>
                                    )}
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                {showBackButton && this.props.onBack && (
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={this.handleBack}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={18}
                                            color={isDark ? '#e2e8f0' : '#334155'}
                                        />
                                        <Text style={styles.backButtonText}>Go Back</Text>
                                    </TouchableOpacity>
                                )}

                                {showRetryButton && (
                                    <TouchableOpacity
                                        style={[
                                            styles.retryButton,
                                            !this.props.onBack && styles.retryButtonFull,
                                        ]}
                                        onPress={this.handleRetry}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#10b981', '#059669', '#047857']}
                                            style={styles.retryButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Ionicons name="refresh" size={18} color="#ffffff" />
                                            <Text style={styles.retryButtonText}>Try Again</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Help Text */}
                            <Text style={styles.helpText}>
                                If this problem persists, please restart the app.
                            </Text>
                        </View>
                    </BlurView>
                </View>
            );
        }

        return children;
    }
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.3)',
    },
    blurContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 400,
    },
    card: {
        padding: 28,
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: 24,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: isDark ? '#f1f5f9' : '#1e293b',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: isDark ? '#94a3b8' : '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    devContainer: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.8)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    detailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 6,
    },
    detailsToggleText: {
        fontSize: 13,
        color: isDark ? '#94a3b8' : '#64748b',
        fontWeight: '500',
    },
    detailsScroll: {
        maxHeight: 150,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#ef4444',
        marginBottom: 8,
    },
    errorLabel: {
        fontWeight: 'bold',
    },
    stackText: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: isDark ? '#64748b' : '#94a3b8',
        lineHeight: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 16,
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.8)',
        gap: 8,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: isDark ? '#e2e8f0' : '#334155',
    },
    retryButton: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonFull: {
        flex: 2,
    },
    retryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    helpText: {
        fontSize: 12,
        color: isDark ? '#64748b' : '#94a3b8',
        textAlign: 'center',
    },
});

export default ErrorBoundary;
