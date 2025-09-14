'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Github } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GitHubErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GitHub Dashboard Error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              GitHub Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <Github className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-4">
                The GitHub dashboard encountered an unexpected error.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-4 p-3 bg-muted rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="default"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}