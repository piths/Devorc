import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard, withAuthGuard, useAuthGuard, AuthGuardProps } from '../auth-guard';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock GitHub auth context
jest.mock('@/contexts/GitHubAuthContext', () => ({
    useGitHubAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

// Test component for wrapping
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('AuthGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        } as any);
    });

    describe('Loading State', () => {
        it('should show default loading component when isLoading is true', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: true,
                error: null,
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard>
                    <TestComponent />
                </AuthGuard>
            );

            expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('should show custom fallback component when provided', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: true,
                error: null,
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            const CustomFallback = () => <div data-testid="custom-loading">Custom Loading</div>;

            render(
                <AuthGuard fallback={<CustomFallback />}>
                    <TestComponent />
                </AuthGuard>
            );

            expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
            expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
        });
    });

    describe('Authenticated State', () => {
        it('should render children when user is authenticated', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: true,
                isLoading: false,
                error: null,
                user: { id: 1, login: 'testuser', name: 'Test User', email: 'test@example.com', avatarUrl: '' },
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard>
                    <TestComponent />
                </AuthGuard>
            );

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    describe('Unauthenticated State', () => {
        it('should redirect to default path when user is not authenticated', async () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: null,
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard>
                    <TestComponent />
                </AuthGuard>
            );

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/');
            });

            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('should redirect to custom path when redirectTo is provided', async () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: null,
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard redirectTo="/login">
                    <TestComponent />
                </AuthGuard>
            );

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/login');
            });
        });

        it('should not redirect when disableRedirect is true', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: null,
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard disableRedirect={true}>
                    <TestComponent />
                </AuthGuard>
            );

            expect(mockPush).not.toHaveBeenCalled();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should show error message when authentication fails', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: 'Authentication failed',
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard>
                    <TestComponent />
                </AuthGuard>
            );

            expect(screen.getByText('Authentication Error')).toBeInTheDocument();
            expect(screen.getByText('Authentication failed')).toBeInTheDocument();
            expect(screen.getByText('Return to Home')).toBeInTheDocument();
        });

        it('should navigate to home when return button is clicked', () => {
            mockUseGitHubAuth.mockReturnValue({
                isAuthenticated: false,
                isLoading: false,
                error: 'Authentication failed',
                user: null,
                connection: null,
                apiClient: null,
                login: jest.fn(),
                logout: jest.fn(),
                handleAuthCallback: jest.fn(),
            });

            render(
                <AuthGuard>
                    <TestComponent />
                </AuthGuard>
            );

            const returnButton = screen.getByText('Return to Home');
            returnButton.click();

            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});

describe('withAuthGuard HOC', () => {
    it('should wrap component with AuthGuard', () => {
        mockUseGitHubAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            user: { id: 1, login: 'testuser', name: 'Test User', email: 'test@example.com', avatarUrl: '' },
            connection: null,
            apiClient: null,
            login: jest.fn(),
            logout: jest.fn(),
            handleAuthCallback: jest.fn(),
        });

        const WrappedComponent = withAuthGuard(TestComponent);

        render(<WrappedComponent />);

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should set correct displayName', () => {
        const WrappedComponent = withAuthGuard(TestComponent);
        expect(WrappedComponent.displayName).toBe('withAuthGuard(TestComponent)');
    });

    it('should handle component without displayName', () => {
        const AnonymousComponent = () => <div>Anonymous</div>;
        const WrappedComponent = withAuthGuard(AnonymousComponent);
        expect(WrappedComponent.displayName).toBe('withAuthGuard(AnonymousComponent)');
    });

    it('should apply custom guard configuration', () => {
        mockUseGitHubAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            user: null,
            connection: null,
            apiClient: null,
            login: jest.fn(),
            logout: jest.fn(),
            handleAuthCallback: jest.fn(),
        });

        const CustomLoading = () => <div data-testid="custom-hoc-loading">HOC Loading</div>;
        const WrappedComponent = withAuthGuard(TestComponent, {
            loadingComponent: <CustomLoading />,
            immediateRedirect: false,
        });

        render(<WrappedComponent />);

        // Since immediateRedirect is false and user is not authenticated, 
        // it should not render the protected content
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
});

describe('useAuthGuard hook', () => {
    it('should return correct authentication state', () => {
        mockUseGitHubAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            user: { id: 1, login: 'testuser', name: 'Test User', email: 'test@example.com', avatarUrl: '' },
            connection: null,
            apiClient: null,
            login: jest.fn(),
            logout: jest.fn(),
            handleAuthCallback: jest.fn(),
        });

        const TestHookComponent = () => {
            const { isAuthenticated, isLoading, hasError, error, isReady } = useAuthGuard();
            return (
                <div>
                    <div data-testid="authenticated">{isAuthenticated.toString()}</div>
                    <div data-testid="loading">{isLoading.toString()}</div>
                    <div data-testid="has-error">{hasError.toString()}</div>
                    <div data-testid="error">{error || 'no-error'}</div>
                    <div data-testid="ready">{isReady.toString()}</div>
                </div>
            );
        };

        render(<TestHookComponent />);

        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('has-error')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('ready')).toHaveTextContent('true');
    });

    it('should return correct state when there is an error', () => {
        mockUseGitHubAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            error: 'Test error',
            user: null,
            connection: null,
            apiClient: null,
            login: jest.fn(),
            logout: jest.fn(),
            handleAuthCallback: jest.fn(),
        });

        const TestHookComponent = () => {
            const { isAuthenticated, isLoading, hasError, error, isReady } = useAuthGuard();
            return (
                <div>
                    <div data-testid="authenticated">{isAuthenticated.toString()}</div>
                    <div data-testid="loading">{isLoading.toString()}</div>
                    <div data-testid="has-error">{hasError.toString()}</div>
                    <div data-testid="error">{error || 'no-error'}</div>
                    <div data-testid="ready">{isReady.toString()}</div>
                </div>
            );
        };

        render(<TestHookComponent />);

        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
        expect(screen.getByTestId('ready')).toHaveTextContent('false');
    });

    it('should return correct state when loading', () => {
        mockUseGitHubAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
            error: null,
            user: null,
            connection: null,
            apiClient: null,
            login: jest.fn(),
            logout: jest.fn(),
            handleAuthCallback: jest.fn(),
        });

        const TestHookComponent = () => {
            const { isAuthenticated, isLoading, hasError, error, isReady } = useAuthGuard();
            return (
                <div>
                    <div data-testid="authenticated">{isAuthenticated.toString()}</div>
                    <div data-testid="loading">{isLoading.toString()}</div>
                    <div data-testid="has-error">{hasError.toString()}</div>
                    <div data-testid="error">{error || 'no-error'}</div>
                    <div data-testid="ready">{isReady.toString()}</div>
                </div>
            );
        };

        render(<TestHookComponent />);

        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('loading')).toHaveTextContent('true');
        expect(screen.getByTestId('has-error')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('ready')).toHaveTextContent('false');
    });
});