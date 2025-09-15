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

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

describe('Overview Page', () => {
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

    expect(screen.getByText('Loading overview...')).toBeInTheDocument();
    expect(screen.getByText('Verifying authentication')).toBeInTheDocument();
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

  it('renders overview content when user is authenticated', async () => {
    const mockUser = {
      id: 1,
      login: 'tester',
      name: 'Tester',
      email: 't@example.com',
      avatarUrl: 'https://example.com/a.png',
    };

    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: mockUser,
      connection: null,
      apiClient: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('App Overview')).toBeInTheDocument();
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('site-header')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Open Dashboard' })).toBeInTheDocument();
    });
  });

  it('shows error state and return button when authentication fails', async () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: 'Auth failed',
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
      expect(screen.getByText('Auth failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to Home' })).toBeInTheDocument();
    });
  });
});

