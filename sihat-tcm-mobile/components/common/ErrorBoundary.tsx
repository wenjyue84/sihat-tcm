/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../types';
import { AppError, ErrorHandler, ErrorFactory } from '../../lib/errors/AppError';
import { ERROR_CODES } from '../../constants';

interface Props {
    children: ReactNode;
    theme: Theme;
    fallback?: ReactNode;
    onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
    context?: {
        component?: string;
        userId?: string;
        sessionId?: string;
    };
}

interface State {
    hasError: boolean;
    error: AppError | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Convert to AppError if it's not already
        const appError = error instanceof AppError 
            ? error 
            : ErrorFactory.fromUnknownError(error, {
                component: 'ErrorBoundary',
                action: 'componentRender'
            });

        return {
            hasError: true,
            error: appError,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Convert to AppError with context
        const appError = error instanceof AppError 
            ? error 
            : ErrorFactory.fromUnknownError(error, {
                component: this.props.context?.component || 'ErrorBoundary',
                userId: this.props.context?.userId,
                sessionId: this.props.context?.sessionId,
                action: 'componentRender',
                metadata: {
                    componentStack: errorInfo.componentStack,
                }
            });

        console.error('ErrorBoundary caught an error:', appError.toJSON());
        
        this.setState({
            error: appError,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(appError, errorInfo);
        }

        // Use centralized error handling
        ErrorHandler.handle(appError, {
            showToUser: false, // We'll show our own UI
            logToConsole: true,
            reportToService: true,
        });
    }

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    private handleReportIssue = () => {
        if (this.state.error) {
            Alert.alert(
                'Report Issue',
                'Would you like to report this issue to help us improve the app?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Report', 
                        onPress: () => {
                            // In a real app, this would open a feedback form or email
                            console.log('User chose to report issue:', this.state.error?.toJSON());
                            Alert.alert('Thank You', 'Your report has been sent. We appreciate your feedback!');
                        }
                    },
                ]
            );
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <View style={[styles.container, { backgroundColor: this.props.theme.background.primary }]}>
                    <View style={[styles.errorCard, { backgroundColor: this.props.theme.surface.elevated }]}>
                        <Ionicons 
                            name="warning" 
                            size={48} 
                            color={this.props.theme.semantic.error} 
                            style={styles.icon}
                        />
                        
                        <Text style={[styles.title, { color: this.props.theme.text.primary }]}>
                            Oops! Something went wrong
                        </Text>
                        
                        <Text style={[styles.message, { color: this.props.theme.text.secondary }]}>
                            {this.state.error?.getUserMessage() || 'We\'re sorry for the inconvenience. The app encountered an unexpected error.'}
                        </Text>

                        {__DEV__ && this.state.error && (
                            <View style={[styles.debugInfo, { backgroundColor: this.props.theme.surface.default }]}>
                                <Text style={[styles.debugTitle, { color: this.props.theme.text.primary }]}>
                                    Debug Information:
                                </Text>
                                <Text style={[styles.debugText, { color: this.props.theme.text.tertiary }]}>
                                    Code: {this.state.error.code}
                                </Text>
                                <Text style={[styles.debugText, { color: this.props.theme.text.tertiary }]}>
                                    {this.state.error.message}
                                </Text>
                                {this.state.error.stack && (
                                    <Text style={[styles.debugText, { color: this.props.theme.text.tertiary }]}>
                                        {this.state.error.stack.substring(0, 500)}...
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: this.props.theme.accent.primary }]}
                                onPress={this.handleRetry}
                            >
                                <Ionicons name="refresh" size={20} color="#ffffff" />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.reportButton, { borderColor: this.props.theme.border.default }]}
                                onPress={this.handleReportIssue}
                            >
                                <Ionicons name="bug" size={20} color={this.props.theme.text.secondary} />
                                <Text style={[styles.reportButtonText, { color: this.props.theme.text.secondary }]}>
                                    Report Issue
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    debugInfo: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        fontFamily: 'monospace',
        lineHeight: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    reportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    reportButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    theme: Theme,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary theme={theme} fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}