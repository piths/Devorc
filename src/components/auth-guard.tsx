'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

/**
 * Props for the AuthGuard component
 */
export interface AuthGuardProps {
  /** Child components to render when authenticated */
  children: ReactNode;
  /** Optional fallback component to show while loading */
  fallback?: ReactNode;
  /** Optional redirect path for unauthenticated users (defaults to '/') */
  redirectTo?: string;
  /** Optional flag to disable automatic redirect (useful for testing) */
  disableRedirect?: boolean;
}

/**
 * Configuration options for AuthGuard behavior
 */
export interface AuthGuardConfig {
  /** Whether to show loading state during authentication check */
  showLoading: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Whether to redirect immediately or wait for user action */
  immediateRedirect: boolean;
}

/**
 * Default loading component for AuthGuard
 */
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <p className="text-sm text-gray-600">Checking authentication...</p>
    </div>
  </div>
);

/**
 * AuthGuard component that protects routes by checking authentication status
 * and redirecting unauthenticated users to the landing page.
 * 
 * @param props - AuthGuard configuration props
 * @returns Protected content or loading/redirect state
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/',
  disableRedirect = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, error } = useGitHubAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading, not authenticated, no error, and redirect is enabled
    if (!isLoading && !isAuthenticated && !error && !disableRedirect) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, error, router, redirectTo, disableRedirect]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || <DefaultLoadingComponent />;
  }

  // Show error state if authentication check failed
  if (error && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated and redirect is disabled, don't render children
  if (!isAuthenticated && disableRedirect) {
    return null;
  }

  // If not authenticated and redirect is enabled, the useEffect will handle redirect
  // Return null to prevent flash of content
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}

/**
 * Higher-order component version of AuthGuard for wrapping components
 * 
 * @param Component - Component to wrap with authentication protection
 * @param guardConfig - Optional configuration for the auth guard
 * @returns Wrapped component with authentication protection
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardConfig?: Partial<AuthGuardConfig>
) {
  const WrappedComponent = (props: P) => {
    const config: AuthGuardConfig = {
      showLoading: true,
      immediateRedirect: true,
      ...guardConfig,
    };

    return (
      <AuthGuard
        fallback={config.showLoading ? config.loadingComponent : undefined}
        disableRedirect={!config.immediateRedirect}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for checking authentication status in components
 * Provides a simple boolean and loading state for conditional rendering
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading, error } = useGitHubAuth();
  
  return {
    isAuthenticated,
    isLoading,
    hasError: !!error,
    error,
    isReady: !isLoading && !error,
  };
}