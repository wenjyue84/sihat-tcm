'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { logError } from '@/lib/systemLogger'

interface Props {
    children: ReactNode
    fallbackTitle?: string
    fallbackMessage?: string
    onRetry?: () => void
    onBack?: () => void
    showBackButton?: boolean
    showRetryButton?: boolean
    userId?: string
    category?: string
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

/**
 * ErrorBoundary - A fault-tolerant wrapper component that catches React errors
 * and displays a user-friendly fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - Catches JavaScript errors anywhere in the child component tree
 * - Displays a friendly error message with recovery options
 * - Provides Back and Retry buttons for user recovery
 * - Logs errors for debugging
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log the error to structured logging system
        const category = this.props.category || 'ErrorBoundary'
        const errorMetadata = {
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorName: error.name,
            errorMessage: error.message,
        }

        // Use structured logging (fire-and-forget to avoid blocking)
        logError(
            category,
            `React error boundary caught error: ${error.message}`,
            errorMetadata,
            this.props.userId
        ).catch(() => {
            // Fallback to console if logging fails (shouldn't happen, but safety net)
            console.error('[ErrorBoundary] Caught error:', error)
            console.error('[ErrorBoundary] Error info:', errorInfo)
        })

        this.setState({
            error,
            errorInfo
        })
    }

    handleRetry = () => {
        // Reset the error state
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })

        // Call the onRetry callback if provided
        if (this.props.onRetry) {
            this.props.onRetry()
        }
    }

    handleBack = () => {
        // Reset the error state first
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })

        // Call the onBack callback if provided
        if (this.props.onBack) {
            this.props.onBack()
        }
    }

    render() {
        if (this.state.hasError) {
            const {
                fallbackTitle = 'Something went wrong',
                fallbackMessage = 'An unexpected error occurred. Please try again or go back to the previous step.',
                showBackButton = true,
                showRetryButton = true
            } = this.props

            return (
                <Card className="p-6 md:p-8 max-w-lg mx-auto bg-white/90 backdrop-blur-md shadow-xl border-red-100/50 mt-8">
                    <div className="text-center space-y-6">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Error Title */}
                        <h2 className="text-xl font-bold text-slate-800">
                            {fallbackTitle}
                        </h2>

                        {/* Error Message */}
                        <p className="text-slate-600 leading-relaxed">
                            {fallbackMessage}
                        </p>

                        {/* Development Mode: Show error details */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4 p-4 bg-slate-100 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-600 mb-2">
                                    <strong>Error:</strong> {this.state.error.message}
                                </p>
                                {this.state.errorInfo?.componentStack && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-slate-500 cursor-pointer">
                                            Stack trace (click to expand)
                                        </summary>
                                        <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            {showBackButton && this.props.onBack && (
                                <Button
                                    variant="outline"
                                    onClick={this.handleBack}
                                    className="flex items-center gap-2 h-11 px-6 border-slate-200 hover:bg-slate-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Back
                                </Button>
                            )}
                            {showRetryButton && (
                                <Button
                                    onClick={this.handleRetry}
                                    className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </Button>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-slate-400 pt-2">
                            If this problem persists, please refresh the page or contact support.
                        </p>
                    </div>
                </Card>
            )
        }

        return this.props.children
    }
}

/**
 * Hook-friendly wrapper for using ErrorBoundary in functional components
 * Use this when you need to dynamically set the onBack handler
 */
interface ErrorBoundaryWrapperProps {
    children: ReactNode
    onBack?: () => void
    onRetry?: () => void
    errorTitle?: string
    errorMessage?: string
    userId?: string
    category?: string
}

export function ErrorBoundaryWrapper({
    children,
    onBack,
    onRetry,
    errorTitle,
    errorMessage,
    userId,
    category
}: ErrorBoundaryWrapperProps) {
    return (
        <ErrorBoundary
            onBack={onBack}
            onRetry={onRetry}
            fallbackTitle={errorTitle}
            fallbackMessage={errorMessage}
            showBackButton={!!onBack}
            showRetryButton={true}
            userId={userId}
            category={category}
        >
            {children}
        </ErrorBoundary>
    )
}

export default ErrorBoundary
