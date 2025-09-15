import { render, screen, fireEvent } from '@testing-library/react';
import { FileNavigationToolbar } from '../file-navigation-toolbar';

describe('FileNavigationToolbar', () => {
  const defaultProps = {
    currentFilePath: 'src/components/test.tsx',
    repositoryName: 'test-repo',
    canNavigateBack: true,
    canNavigateForward: true,
    onNavigateBack: jest.fn(),
    onNavigateForward: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file path correctly', () => {
    render(<FileNavigationToolbar {...defaultProps} />);

    expect(screen.getByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('src/components')).toBeInTheDocument();
    expect(screen.getByText('test.tsx')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<FileNavigationToolbar {...defaultProps} />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    const forwardButton = screen.getByRole('button', { name: /go forward/i });

    expect(backButton).toBeInTheDocument();
    expect(forwardButton).toBeInTheDocument();
    expect(backButton).not.toBeDisabled();
    expect(forwardButton).not.toBeDisabled();
  });

  it('should disable navigation buttons when cannot navigate', () => {
    render(
      <FileNavigationToolbar
        {...defaultProps}
        canNavigateBack={false}
        canNavigateForward={false}
      />
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    const forwardButton = screen.getByRole('button', { name: /go forward/i });

    expect(backButton).toBeDisabled();
    expect(forwardButton).toBeDisabled();
  });

  it('should disable navigation buttons when loading', () => {
    render(<FileNavigationToolbar {...defaultProps} isLoading={true} />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    const forwardButton = screen.getByRole('button', { name: /go forward/i });

    expect(backButton).toBeDisabled();
    expect(forwardButton).toBeDisabled();
  });

  it('should call onNavigateBack when back button is clicked', () => {
    render(<FileNavigationToolbar {...defaultProps} />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);

    expect(defaultProps.onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('should call onNavigateForward when forward button is clicked', () => {
    render(<FileNavigationToolbar {...defaultProps} />);

    const forwardButton = screen.getByRole('button', { name: /go forward/i });
    fireEvent.click(forwardButton);

    expect(defaultProps.onNavigateForward).toHaveBeenCalledTimes(1);
  });

  it('should handle file path without folder', () => {
    render(
      <FileNavigationToolbar
        {...defaultProps}
        currentFilePath="README.md"
      />
    );

    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.queryByText('src/components')).not.toBeInTheDocument();
  });

  it('should handle missing repository name', () => {
    render(
      <FileNavigationToolbar
        {...defaultProps}
        repositoryName={undefined}
      />
    );

    expect(screen.queryByText('test-repo')).not.toBeInTheDocument();
    expect(screen.getByText('src/components')).toBeInTheDocument();
    expect(screen.getByText('test.tsx')).toBeInTheDocument();
  });

  it('should handle deep nested file paths', () => {
    render(
      <FileNavigationToolbar
        {...defaultProps}
        currentFilePath="src/components/modules/chat/test.tsx"
      />
    );

    expect(screen.getByText('src/components/modules/chat')).toBeInTheDocument();
    expect(screen.getByText('test.tsx')).toBeInTheDocument();
  });

  it('should render keyboard shortcuts indicator', () => {
    render(<FileNavigationToolbar {...defaultProps} />);

    const keyboardButton = screen.getByRole('button', { name: /keyboard/i });
    expect(keyboardButton).toBeInTheDocument();
  });
});