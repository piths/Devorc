# Testing Guide

## Overview

DevOrch Suite uses a comprehensive testing strategy with Jest 30 and React Testing Library to ensure reliability and maintainability. This guide covers testing patterns, best practices, and how to run tests effectively.

## Testing Stack

### Core Testing Libraries
- **Jest 30** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - User interaction simulation
- **ts-jest** - TypeScript support for Jest

### Testing Environment
- **jsdom** - Browser environment simulation
- **MSW (Mock Service Worker)** - API mocking
- **jest-environment-jsdom** - DOM testing environment

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- GitHubFileExplorer.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Test Configuration

Jest configuration in `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

## Testing Patterns

### Component Testing

#### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { GitHubFileExplorer } from '../github-file-explorer';

describe('GitHubFileExplorer', () => {
  it('should render placeholder when no repository is selected', () => {
    render(<GitHubFileExplorer repository={null} />);
    
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
    expect(screen.getByText('Select a GitHub repository to browse files')).toBeInTheDocument();
  });
});
```

#### Component with Props
```typescript
const mockRepository = {
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  // ... other required properties
};

it('should display repository contents when repository is provided', async () => {
  const mockOnFileSelect = jest.fn();
  
  render(
    <GitHubFileExplorer 
      repository={mockRepository}
      onFileSelect={mockOnFileSelect}
    />
  );
  
  await waitFor(() => {
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });
});
```

#### User Interaction Testing
```typescript
import userEvent from '@testing-library/user-event';

it('should call onFileSelect when file is clicked', async () => {
  const user = userEvent.setup();
  const mockOnFileSelect = jest.fn();
  
  render(
    <GitHubFileExplorer 
      repository={mockRepository}
      onFileSelect={mockOnFileSelect}
    />
  );
  
  await waitFor(() => {
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });
  
  await user.click(screen.getByText('README.md'));
  
  expect(mockOnFileSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'README.md',
      path: 'README.md',
    })
  );
});
```

### Hook Testing

#### Basic Hook Test
```typescript
import { renderHook, act } from '@testing-library/react';
import { useFileNavigation } from '../useFileNavigation';

describe('useFileNavigation', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFileNavigation());
    
    expect(result.current.selectedRepository).toBeNull();
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.fileHistory).toEqual([]);
  });
});
```

#### Hook with Async Operations
```typescript
it('should navigate to file and update history', async () => {
  const { result } = renderHook(() => useFileNavigation());
  
  // Mock API response
  mockApiClient.getFileContent.mockResolvedValue(mockFileContent);
  
  act(() => {
    result.current.setSelectedRepository(mockRepository);
  });
  
  await act(async () => {
    await result.current.navigateToFile('src/test.ts');
  });
  
  await waitFor(() => {
    expect(result.current.selectedFile).toBe(mockFileContent);
    expect(result.current.selectedFilePath).toBe('src/test.ts');
    expect(result.current.fileHistory).toContain('src/test.ts');
  });
});
```

### Context Testing

#### Context Provider Testing
```typescript
import { GitHubAuthProvider, useGitHubAuth } from '../GitHubAuthContext';

const TestComponent = () => {
  const { isAuthenticated, user } = useGitHubAuth();
  return (
    <div>
      <span>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
      {user && <span>{user.login}</span>}
    </div>
  );
};

it('should provide authentication state', () => {
  render(
    <GitHubAuthProvider>
      <TestComponent />
    </GitHubAuthProvider>
  );
  
  expect(screen.getByText('Not authenticated')).toBeInTheDocument();
});
```

### API Client Testing

#### Mocking API Responses
```typescript
import { GitHubApiClient } from '../GitHubApiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  
  beforeEach(() => {
    client = new GitHubApiClient('mock-token');
    (fetch as jest.Mock).mockClear();
  });
  
  it('should fetch repositories successfully', async () => {
    const mockRepositories = [mockRepository];
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRepositories,
      headers: new Headers(),
    });
    
    const repositories = await client.getRepositories();
    
    expect(repositories).toEqual(mockRepositories);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/user/repos',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token',
        }),
      })
    );
  });
});
```

#### Error Handling Tests
```typescript
it('should handle API errors gracefully', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: async () => ({ message: 'Repository not found' }),
  });
  
  await expect(client.getRepository('user', 'nonexistent')).rejects.toThrow(
    'Repository not found'
  );
});
```

### Integration Testing

#### Component Integration
```typescript
describe('ChatPage Integration', () => {
  it('should integrate file explorer with chat interface', async () => {
    const user = userEvent.setup();
    
    render(<ChatPage />);
    
    // Select repository
    await user.click(screen.getByText('Select Repository'));
    await user.click(screen.getByText('test-repo'));
    
    // Navigate to file
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('src'));
    await user.click(screen.getByText('test.ts'));
    
    // Verify file context in chat
    await waitFor(() => {
      expect(screen.getByText('test.ts')).toBeInTheDocument();
    });
    
    // Send message about current file
    const chatInput = screen.getByPlaceholderText('Ask about your code...');
    await user.type(chatInput, 'What does this function do?');
    await user.click(screen.getByText('Send'));
    
    // Verify AI response includes file context
    await waitFor(() => {
      expect(screen.getByText(/analyzing.*test\.ts/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking Strategies

### API Mocking with MSW

#### Setup MSW
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('https://api.github.com/user/repos', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          // ... other properties
        },
      ])
    );
  }),
  
  rest.get('https://api.github.com/repos/:owner/:repo/contents/:path*', (req, res, ctx) => {
    const { owner, repo, path } = req.params;
    
    if (path === '') {
      return res(
        ctx.json([
          { name: 'src', type: 'dir', path: 'src' },
          { name: 'README.md', type: 'file', path: 'README.md' },
        ])
      );
    }
    
    return res(ctx.status(404));
  }),
];
```

#### Setup Test Server
```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

#### Configure in Tests
```typescript
// jest.setup.js
import { server } from './src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Context Mocking

#### Mock GitHub Auth Context
```typescript
jest.mock('@/contexts/GitHubAuthContext');

const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

beforeEach(() => {
  mockUseGitHubAuth.mockReturnValue({
    isAuthenticated: true,
    user: mockUser,
    apiClient: mockApiClient,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  });
});
```

### Local Storage Mocking

#### Mock localStorage
```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

#### Test localStorage Operations
```typescript
it('should save data to localStorage', () => {
  const testData = { id: '1', name: 'Test Board' };
  
  render(<KanbanBoard />);
  
  // Trigger save operation
  fireEvent.click(screen.getByText('Save Board'));
  
  expect(localStorage.setItem).toHaveBeenCalledWith(
    'kanban-boards',
    JSON.stringify([testData])
  );
});
```

## Test Data and Fixtures

### Mock Data Factory
```typescript
// src/test-utils/factories.ts
export const createMockRepository = (overrides = {}): GitHubRepository => ({
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  description: 'Test repository',
  language: 'TypeScript',
  stargazers_count: 10,
  forks_count: 5,
  updated_at: '2023-01-01T00:00:00Z',
  html_url: 'https://github.com/user/test-repo',
  clone_url: 'https://github.com/user/test-repo.git',
  default_branch: 'main',
  private: false,
  ...overrides,
});

export const createMockFileContent = (overrides = {}): GitHubFileContent => ({
  name: 'test.ts',
  path: 'src/test.ts',
  sha: 'abc123',
  size: 1024,
  url: 'https://api.github.com/repos/user/test-repo/contents/src/test.ts',
  html_url: 'https://github.com/user/test-repo/blob/main/src/test.ts',
  git_url: 'https://api.github.com/repos/user/test-repo/git/blobs/abc123',
  download_url: 'https://raw.githubusercontent.com/user/test-repo/main/src/test.ts',
  type: 'file',
  content: btoa('console.log("Hello, World!");'),
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/user/test-repo/contents/src/test.ts',
    git: 'https://api.github.com/repos/user/test-repo/git/blobs/abc123',
    html: 'https://github.com/user/test-repo/blob/main/src/test.ts',
  },
  ...overrides,
});
```

### Test Utilities
```typescript
// src/test-utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { GitHubAuthProvider } from '@/contexts/GitHubAuthContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <GitHubAuthProvider>
        {children}
      </GitHubAuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Testing Best Practices

### Test Structure

#### AAA Pattern (Arrange, Act, Assert)
```typescript
it('should update file selection when file is clicked', async () => {
  // Arrange
  const mockOnFileSelect = jest.fn();
  const mockFile = createMockFileContent();
  
  render(
    <GitHubFileExplorer 
      repository={mockRepository}
      onFileSelect={mockOnFileSelect}
    />
  );
  
  // Act
  await waitFor(() => {
    expect(screen.getByText(mockFile.name)).toBeInTheDocument();
  });
  
  await user.click(screen.getByText(mockFile.name));
  
  // Assert
  expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
});
```

### Test Naming

#### Descriptive Test Names
```typescript
describe('GitHubFileExplorer', () => {
  describe('when repository is null', () => {
    it('should display placeholder message', () => {
      // Test implementation
    });
  });
  
  describe('when repository is provided', () => {
    it('should load and display directory contents', async () => {
      // Test implementation
    });
    
    it('should handle API errors gracefully', async () => {
      // Test implementation
    });
  });
  
  describe('file selection', () => {
    it('should call onFileSelect when file is clicked', async () => {
      // Test implementation
    });
    
    it('should highlight selected file', async () => {
      // Test implementation
    });
  });
});
```

### Async Testing

#### Waiting for Elements
```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument();
});

// Wait for element to disappear
await waitForElementToBeRemoved(screen.getByText('Loading...'));

// Find element asynchronously
const element = await screen.findByText('Async content');
```

#### Testing Loading States
```typescript
it('should show loading state while fetching data', async () => {
  // Mock delayed API response
  mockApiClient.getRepositories.mockImplementation(
    () => new Promise(resolve => 
      setTimeout(() => resolve(mockRepositories), 100)
    )
  );
  
  render(<RepositoryList />);
  
  // Assert loading state
  expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });
  
  // Assert loading state is gone
  expect(screen.queryByText('Loading repositories...')).not.toBeInTheDocument();
});
```

### Error Testing

#### Testing Error Boundaries
```typescript
it('should display error boundary when component throws', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  
  consoleSpy.mockRestore();
});
```

#### Testing Error States
```typescript
it('should display error message when API fails', async () => {
  mockApiClient.getRepositories.mockRejectedValue(
    new Error('API Error')
  );
  
  render(<RepositoryList />);
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load repositories')).toBeInTheDocument();
  });
});
```

## Coverage and Quality

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/components/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report in browser
open coverage/lcov-report/index.html
```

### Quality Metrics

#### Test Quality Checklist
- [ ] Tests are isolated and independent
- [ ] Tests have descriptive names
- [ ] Tests cover happy path and edge cases
- [ ] Tests use appropriate assertions
- [ ] Tests mock external dependencies
- [ ] Tests are fast and reliable
- [ ] Tests follow AAA pattern
- [ ] Tests have good coverage

#### Code Quality
- **ESLint rules** for test files
- **TypeScript strict mode** for type safety
- **Consistent naming** conventions
- **DRY principle** with shared utilities
- **Clear test structure** and organization

## Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm test -- --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
npm test -- --testNamePattern="should render" --verbose
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Test Debugging Tips
- Use `screen.debug()` to see current DOM state
- Use `console.log()` in tests for debugging
- Use `--verbose` flag for detailed test output
- Use `--watch` mode for iterative development
- Use `--testNamePattern` to run specific tests