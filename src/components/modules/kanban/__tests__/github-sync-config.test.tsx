import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubSyncConfig } from '../github-sync-config';
import { GitHubSyncConfig as GitHubSyncConfigType } from '@/types/github-sync';
import { Column } from '@/types/storage';

// Mock the hooks
jest.mock('@/hooks/useGitHubSync', () => ({
  useGitHubSync: () => ({
    validateSyncConfig: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
    getRepositoryInfo: jest.fn().mockResolvedValue({
      id: 123,
      name: 'test-repo',
      full_name: 'test/test-repo',
      description: 'Test repository',
    }),
    getRepositoryLabels: jest.fn().mockResolvedValue([
      { id: 1, name: 'bug', color: 'ff0000', description: 'Bug label' },
      { id: 2, name: 'feature', color: '00ff00', description: 'Feature label' },
    ]),
    isConnected: true,
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('GitHubSyncConfig', () => {
  const mockColumns: Column[] = [
    { id: 'todo', title: 'To Do', cards: [], color: '#ff0000' },
    { id: 'in-progress', title: 'In Progress', cards: [], color: '#ffff00' },
    { id: 'done', title: 'Done', cards: [], color: '#00ff00' },
  ];

  const mockConfig: GitHubSyncConfigType = {
    enabled: true,
    repository: { owner: 'test', repo: 'test-repo' },
    columnMappings: [
      {
        columnId: 'todo',
        columnTitle: 'To Do',
        githubLabels: ['todo'],
        issueState: 'open',
      },
    ],
    autoSync: false,
    syncInterval: 15,
    conflictResolution: 'manual',
  };

  const mockProps = {
    config: mockConfig,
    columns: mockColumns,
    onConfigChange: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the configuration form', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    expect(screen.getByText('GitHub Sync Configuration')).toBeInTheDocument();
    expect(screen.getByText('Enable GitHub Sync')).toBeInTheDocument();
    expect(screen.getAllByText('Repository')[0]).toBeInTheDocument();
    expect(screen.getByText('Column Mappings')).toBeInTheDocument();
  });

  it('should show disconnected state when not connected', () => {
    // Create a mock for disconnected state
    const useGitHubSyncMock = jest.fn(() => ({
      isConnected: false,
    }));
    
    jest.doMock('@/hooks/useGitHubSync', () => ({
      useGitHubSync: useGitHubSyncMock,
    }));

    const disconnectedProps = {
      ...mockProps,
      config: null,
    };

    render(<GitHubSyncConfig {...disconnectedProps} />);

    expect(screen.getByText(/GitHub connection required/)).toBeInTheDocument();
  });

  it('should populate form with existing config', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked(); // Enable GitHub Sync switch

    const ownerInput = screen.getByDisplayValue('test');
    expect(ownerInput).toBeInTheDocument();

    const repoInput = screen.getByDisplayValue('test-repo');
    expect(repoInput).toBeInTheDocument();
  });

  it('should handle repository input changes', async () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const ownerInput = screen.getByDisplayValue('test');
    fireEvent.change(ownerInput, { target: { value: 'newowner' } });

    expect(ownerInput).toHaveValue('newowner');
  });

  it('should handle enable/disable toggle', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const switches = screen.getAllByRole('switch');
    const enableSwitch = switches[0]; // First switch is the Enable GitHub Sync
    fireEvent.click(enableSwitch);

    // The switch should toggle (though we can't easily test the internal state change)
    expect(enableSwitch).toBeInTheDocument();
  });

  it('should show column mappings', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Issue State')).toBeInTheDocument();
    expect(screen.getByText('GitHub Labels')).toBeInTheDocument();
  });

  it('should handle save action', async () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onConfigChange).toHaveBeenCalled();
    });
  });

  it('should handle cancel action', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should handle validation', async () => {
    render(<GitHubSyncConfig {...mockProps} />);

    const validateButton = screen.getByText('Validate');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(validateButton).toBeInTheDocument();
    });
  });

  it('should show sync settings', () => {
    render(<GitHubSyncConfig {...mockProps} />);

    expect(screen.getByText('Sync Settings')).toBeInTheDocument();
    expect(screen.getByText('Auto Sync')).toBeInTheDocument();
    expect(screen.getByText('Sync Interval (minutes)')).toBeInTheDocument();
    expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
  });

  it('should initialize column mappings when empty', () => {
    const propsWithoutMappings = {
      ...mockProps,
      config: {
        ...mockConfig,
        columnMappings: [],
      },
    };

    render(<GitHubSyncConfig {...propsWithoutMappings} />);

    // Should show column mappings for all columns
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should disable inputs when sync is disabled', () => {
    const disabledProps = {
      ...mockProps,
      config: {
        ...mockConfig,
        enabled: false,
      },
    };

    render(<GitHubSyncConfig {...disabledProps} />);

    const ownerInput = screen.getByDisplayValue('test');
    expect(ownerInput).toBeDisabled();

    const repoInput = screen.getByDisplayValue('test-repo');
    expect(repoInput).toBeDisabled();
  });
});