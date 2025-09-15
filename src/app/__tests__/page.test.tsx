import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Home from '../page';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/GitHubAuthContext', () => ({
  useGitHubAuth: jest.fn(),
}));

jest.mock('@/components/github-demo', () => ({
  GitHubDemo: () => <div data-testid="github-demo">GitHub Demo</div>,
}));

jest.mock('@/components/logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

describe('Home Page', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as Partial<ReturnType<typeof useRouter>>);
    mockPush.mockClear();
  });

  it('shows loading state when authentication is loading', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
    } as Partial<ReturnType<typeof useGitHubAuth>>);

    render(<Home />);
    
    // Should show skeleton loaders
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('redirects to dashboard when user is authenticated', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
    } as Partial<ReturnType<typeof useGitHubAuth>>);

    render(<Home />);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows landing page for unauthenticated users', () => {
    const mockLogin = jest.fn();
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
    } as Partial<ReturnType<typeof useGitHubAuth>>);

    render(<Home />);
    
    expect(screen.getByText('Ship Code')).toBeTruthy();
    expect(screen.getByText('10x Faster')).toBeTruthy();
    expect(screen.getByText('Start Building Now')).toBeTruthy();
    expect(screen.getByText('GitHub Dashboard')).toBeTruthy();
    expect(screen.getByText('Smart Kanban')).toBeTruthy();
    expect(screen.getByText('Project Canvas')).toBeTruthy();
    expect(screen.getByText('AI Assistant')).toBeTruthy();
  });

  it('calls login function when login button is clicked', () => {
    const mockLogin = jest.fn();
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
    } as Partial<ReturnType<typeof useGitHubAuth>>);

    render(<Home />);
    
    const loginButton = screen.getByText('Start Building Now');
    loginButton.click();
    
    expect(mockLogin).toHaveBeenCalled();
  });

  it('does not render landing page content when authenticated', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
    } as Partial<ReturnType<typeof useGitHubAuth>>);

    const { container } = render(<Home />);
    
    // Should return null/empty when authenticated
    expect(container.firstChild).toBeNull();
  });
});