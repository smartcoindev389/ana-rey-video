import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">
                ⚠️ Something went wrong
              </CardTitle>
              <CardDescription>
                The application encountered an unexpected error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-mono text-sm text-destructive font-semibold mb-2">
                    Error: {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-64 bg-background p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button onClick={this.handleReload} variant="default">
                  Reload Page
                </Button>
                <Button onClick={this.handleReset} variant="outline">
                  Go to Home
                </Button>
              </div>

              <div className="text-sm text-muted-foreground pt-4 border-t">
                <p className="mb-2">💡 Tips to resolve this:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Try refreshing the page (Ctrl + Shift + R for hard reload)</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check the browser console (F12) for more details</li>
                  <li>Ensure the backend API is running (http://localhost:8000)</li>
                  <li>Verify your internet connection</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

