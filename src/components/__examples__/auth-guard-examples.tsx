/**
 * Example usage of AuthGuard component
 * These examples show different ways to use the AuthGuard for protecting routes
 */

import React from 'react';
import { AuthGuard, withAuthGuard, useAuthGuard } from '../auth-guard';

// Example 1: Basic usage with AuthGuard component
export function ProtectedPageExample() {
  return (
    <AuthGuard>
      <div>
        <h1>Protected Dashboard</h1>
        <p>This content is only visible to authenticated users.</p>
      </div>
    </AuthGuard>
  );
}

// Example 2: AuthGuard with custom loading component
export function ProtectedPageWithCustomLoadingExample() {
  const CustomLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-32 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <AuthGuard fallback={<CustomLoader />}>
      <div>
        <h1>Dashboard with Custom Loading</h1>
        <p>This shows a custom loading component while checking auth.</p>
      </div>
    </AuthGuard>
  );
}

// Example 3: AuthGuard with custom redirect path
export function AdminPageExample() {
  return (
    <AuthGuard redirectTo="/login">
      <div>
        <h1>Admin Panel</h1>
        <p>This redirects to /login instead of the default / path.</p>
      </div>
    </AuthGuard>
  );
}

// Example 4: Using withAuthGuard HOC
const DashboardComponent = () => (
  <div>
    <h1>HOC Protected Dashboard</h1>
    <p>This component is wrapped with the withAuthGuard HOC.</p>
  </div>
);

export const ProtectedDashboard = withAuthGuard(DashboardComponent);

// Example 5: Using withAuthGuard with custom configuration
export const ProtectedDashboardWithConfig = withAuthGuard(DashboardComponent, {
  showLoading: true,
  loadingComponent: (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Custom HOC Loading...</div>
    </div>
  ),
  immediateRedirect: true,
});

// Example 6: Using useAuthGuard hook for conditional rendering
export function ConditionalContentExample() {
  const { isAuthenticated, isLoading, hasError, error } = useAuthGuard();

  if (isLoading) {
    return <div>Checking authentication status...</div>;
  }

  if (hasError) {
    return (
      <div className="text-red-600">
        <h2>Authentication Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Welcome Back!</h1>
          <p>You are logged in and can see this content.</p>
        </div>
      ) : (
        <div>
          <h1>Please Log In</h1>
          <p>You need to authenticate to access protected features.</p>
        </div>
      )}
    </div>
  );
}

// Example 7: Nested AuthGuard for different protection levels
export function NestedProtectionExample() {
  return (
    <AuthGuard>
      <div>
        <h1>Basic Protected Area</h1>
        <p>This requires basic authentication.</p>
        
        <AuthGuard disableRedirect={true}>
          <div className="mt-4 p-4 border border-gray-300 rounded">
            <h2>Extra Protected Section</h2>
            <p>This section has additional protection logic.</p>
          </div>
        </AuthGuard>
      </div>
    </AuthGuard>
  );
}

// Example 8: AuthGuard in a Next.js page component
export function NextJSPageExample() {
  return (
    <AuthGuard
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Protected Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">GitHub Repositories</h2>
            <p>View and manage your repositories</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Kanban Boards</h2>
            <p>Organize your projects with boards</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
            <p>Get help with your development tasks</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}