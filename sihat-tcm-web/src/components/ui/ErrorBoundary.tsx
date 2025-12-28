"use client";

/**
 * @fileoverview Error Boundary Component
 *
 * React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree and logs them to the system error tracking system.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogErrorRequest, ErrorSeverity } from "@/types/monitoring";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our monitoring system
    this.logErrorToSystem(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Log error to the system monitoring API
   */
  private async logErrorToSystem(error: Error, errorInfo: ErrorInfo) {
    try {
      // Determine error severity based on error type
      const severity: ErrorSeverity = this.determineSeverity(error);

      // Get user session info if available
      const userId = this.getUserId();
      const sessionId = this.getSessionId();

      // Prepare error data
      const errorData: LogErrorRequest = {
        error_type: error.name || "JavaScriptError",
        message: error.message,
        stack_trace: error.stack,
        component: this.getComponentName(errorInfo),
        user_id: userId,
        session_id: sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        severity,
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: "ErrorBoundary",
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      // Send error to monitoring API
      const response = await fetch("/api/admin/system-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });

      if (response.ok) {
        const result = await response.json();
        this.setState({ errorId: result.error_id });
        console.log("Error logged to system:", result.error_id);
      } else {
        console.error("Failed to log error to system:", response.statusText);
      }
    } catch (loggingError) {
      console.error("Error while logging to monitoring system:", loggingError);
    }
  }

  /**
   * Determine error severity based on error characteristics
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors
    if (
      errorName.includes("syntaxerror") ||
      errorName.includes("referenceerror") ||
      errorMessage.includes("network error") ||
      errorMessage.includes("failed to fetch") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("authorization")
    ) {
      return "critical";
    }

    // High severity errors
    if (
      errorName.includes("typeerror") ||
      errorMessage.includes("cannot read property") ||
      errorMessage.includes("undefined is not a function") ||
      errorMessage.includes("permission denied")
    ) {
      return "high";
    }

    // Medium severity errors
    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("timeout")
    ) {
      return "medium";
    }

    // Default to medium severity
    return "medium";
  }

  /**
   * Extract component name from error info
   */
  private getComponentName(errorInfo: ErrorInfo): string {
    const componentStack = errorInfo.componentStack || "";
    const match = componentStack.match(/in (\w+)/);
    return match ? match[1] : "Unknown";
  }

  /**
   * Get user ID from session/auth context
   */
  private getUserId(): string | undefined {
    // This would integrate with your auth system
    // For now, try to get from localStorage or session
    try {
      const authData = localStorage.getItem("supabase.auth.token");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    // Try to get existing session ID or generate one
    let sessionId = sessionStorage.getItem("error_boundary_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("error_boundary_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Handle retry action
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  /**
   * Handle navigation to home
   */
  private handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  /**
   * Handle page reload
   */
  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Something went wrong
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We've encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>

              {this.state.errorId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 text-center">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              {this.props.showDetails && this.state.error && (
                <details className="bg-gray-50 p-3 rounded-lg">
                  <summary className="text-sm font-medium cursor-pointer">
                    Technical Details
                  </summary>
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="font-medium">{this.state.error.name}</p>
                    <p className="mb-2">{this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={this.handleReload}
                    className="flex-1"
                  >
                    Reload Page
                  </Button>

                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manually logging errors
 */
export function useErrorLogger() {
  const logError = async (
    error: Error,
    context?: {
      component?: string;
      action?: string;
      metadata?: Record<string, any>;
      severity?: ErrorSeverity;
    }
  ) => {
    try {
      const errorData: LogErrorRequest = {
        error_type: error.name || "ManualError",
        message: error.message,
        stack_trace: error.stack,
        component: context?.component,
        url: window.location.href,
        user_agent: navigator.userAgent,
        severity: context?.severity || "medium",
        metadata: {
          manual: true,
          action: context?.action,
          ...context?.metadata,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch("/api/admin/system-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      });

      if (response.ok) {
        const result = await response.json();
        return result.error_id;
      }
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  };

  return { logError };
}