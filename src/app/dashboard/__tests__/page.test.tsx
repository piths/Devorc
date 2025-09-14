import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Page from '../page';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the GitHub auth context
jest.mock('@/contexts/GitHubAuthContext', () => ({
  useGitHubAuth: jest.fn(),
}));

// Mock the child components to avoid complex rendering
jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">App Sidebar</div>,
}));

jest.mock('@/components/site-header', () => ({
  SiteHeader: () => <div data-testid="site-header">Site Header</div>,
}));

jest.mock('@/components/section-cards', () => ({
  SectionCards: () => <div data-testid="section-cards">Section Cards</div>,
}));

jest.mock('@/components/chart-area-interactive', () => ({
  ChartAreaInteractive: () => <div data-testid="chart-area">Chart Area</div>,
}));

jest.mock('@/components/data-table', () => ({
  DataTable: () => <div data-testid="data-table">Data Table</div>,
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as ReturnType<typeof useRouter>);
  });

  it('shows loading state while checking authentication', () => {
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

    render(<Page />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    expect(screen.getByText('Verifying authentication')).toBeInTheDocument();
    // Check for the loading spinner by class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to landing page when user is not authenticated', async () => {
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

    render(<Page />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('renders dashboard content when user is authenticated', async () => {
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: mockUser,
      connection: {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: ['repo', 'user'],
        user: mockUser,
      },
      apiClient: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('site-header')).toBeInTheDocument();
      expect(screen.getByTestId('section-cards')).toBeInTheDocument();
      expect(screen.getByTestId('chart-area')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    // Should not redirect when authenticated
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error state and provides return to home button when authentication fails', async () => {
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

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to Home' })).toBeInTheDocument();
    });
  });

  it('handles authentication error and allows return to home', async () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: 'Token expired',
      user: null,
      connection: null,
      apiClient: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    render(<Page />);

    const returnButton = await screen.findByRole('button', { name: 'Return to Home' });
    returnButton.click();

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('does not render dashboard content when not authenticated', () => {
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

    render(<Page />);

    // Dashboard components should not be rendered
    expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('site-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('section-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chart-area')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});