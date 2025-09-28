import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ArrowLeft
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send error to monitoring service in production
    // this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Implement error reporting service
    // Examples: Sentry, LogRocket, Bugsnag
    /*
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
    */
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleGoHome = () => {
    window.location.href = '/home';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorMessage = (error: Error): string => {
    if (error.name === 'ChunkLoadError') {
      return 'Failed to load application resources. This usually happens after an update.';
    }
    if (error.message.includes('Loading chunk')) {
      return 'Failed to load part of the application. Please refresh the page.';
    }
    if (error.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    return 'An unexpected error occurred. Our team has been notified.';
  };

  private shouldShowRetry = (): boolean => {
    return this.state.retryCount < this.maxRetries;
  };

  private shouldShowReload = (): boolean => {
    const error = this.state.error;
    return !!(error && (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk')
    ));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const errorMessage = error ? this.getErrorMessage(error) : 'Something went wrong';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>

              {import.meta.env.DEV && error && (
                <Alert className="border-amber-200 bg-amber-50/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        Development Error Details:
                      </p>
                      <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                        <p><strong>Error:</strong> {error.message}</p>
                        <p><strong>Stack:</strong></p>
                        <pre className="whitespace-pre-wrap text-xs">
                          {error.stack?.slice(0, 500)}
                          {error.stack && error.stack.length > 500 ? '...' : ''}
                        </pre>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                {this.shouldShowRetry() && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again {this.state.retryCount > 0 && `(${this.maxRetries - this.state.retryCount} attempts left)`}
                  </Button>
                )}

                {this.shouldShowReload() && (
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  If this problem persists, please contact support
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}