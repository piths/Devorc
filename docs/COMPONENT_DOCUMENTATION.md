# Component Documentation

## Overview

DevOrch Suite is built with a modular component architecture using React 19, TypeScript, and shadcn/ui. This document provides comprehensive documentation for all major components and their usage patterns.

## Architecture Patterns

### Component Composition
- **Compound Components** - Complex components built from smaller, focused components
- **Render Props** - Flexible component APIs with render prop patterns
- **Custom Hooks** - Reusable logic extracted into custom hooks
- **Context Providers** - Global state management with React Context

### Naming Conventions
- **PascalCase** for component names (`GitHubDashboard`, `KanbanBoard`)
- **camelCase** for props and functions (`onFileSelect`, `isLoading`)
- **kebab-case** for CSS classes and data attributes
- **SCREAMING_SNAKE_CASE** for constants

## Core Layout Components

### AppSidebar
Main navigation sidebar with collapsible functionality.

```typescript
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  variant?: "sidebar" | "floating" | "inset";
}
```

**Features:**
- Responsive design with mobile collapse
- GitHub authentication status indicator
- Module-specific navigation sections
- Quick actions and secondary navigation

**Usage:**
```tsx
<AppSidebar variant="inset" />
```

### SiteHeader
Application header with user authentication and theme controls.

```typescript
interface SiteHeaderProps {
  className?: string;
}
```

**Features:**
- GitHub authentication status
- User profile dropdown
- Theme toggle (dark/light)
- Responsive design

### AuthGuard
Higher-order component for protecting authenticated routes.

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}
```

**Usage:**
```tsx
<AuthGuard fallback={<Loading />} redirectTo="/">
  <ProtectedContent />
</AuthGuard>
```

## Chat Module Components

### ChatPage
Main chat interface with split-pane layout (Cursor-like).

```typescript
interface ChatPageProps {
  className?: string;
}
```

**Features:**
- Resizable split-pane layout
- Mobile-responsive with tabs
- File explorer integration
- Chat interface with AI responses

### GitHubFileExplorer
File tree explorer for GitHub repositories.

```typescript
interface GitHubFileExplorerProps {
  repository: GitHubRepository | null;
  onFileSelect?: (file: GitHubFileContent) => void;
  selectedFilePath?: string;
}
```

**Features:**
- Collapsible file tree structure
- Lazy loading of directory contents
- File type icons and sorting
- Loading states and error handling

**Usage:**
```tsx
<GitHubFileExplorer
  repository={selectedRepo}
  onFileSelect={handleFileSelect}
  selectedFilePath={currentFile?.path}
/>
```

### CodeViewer
Syntax-highlighted code viewer with file operations.

```typescript
interface CodeViewerProps {
  file: GitHubFileContent | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isFullScreen?: boolean;
}
```

**Features:**
- Syntax highlighting for 20+ languages
- Copy to clipboard functionality
- File metadata display (size, path, language)
- External link to GitHub
- Loading and error states

**Usage:**
```tsx
<CodeViewer
  file={selectedFile}
  isLoading={isLoadingFile}
  error={fileError}
  onRetry={retryFileLoad}
/>
```

### ChatInterface
AI chat interface with message history and file context.

```typescript
interface ChatInterfaceProps {
  className?: string;
}
```

**Features:**
- Message history with persistence
- File context integration
- Typing indicators
- Code reference highlighting
- Message retry functionality

### FileNavigationToolbar
Navigation toolbar with file breadcrumbs and history controls.

```typescript
interface FileNavigationToolbarProps {
  currentFilePath: string;
  repositoryName?: string;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  isLoading?: boolean;
}
```

**Features:**
- File path breadcrumbs
- Back/forward navigation
- Keyboard shortcut indicators
- Repository name display

### GitHubRepositorySelector
Dropdown selector for GitHub repositories.

```typescript
interface GitHubRepositorySelectorProps {
  onRepositorySelect: (repository: GitHubRepository) => void;
  selectedRepository?: GitHubRepository | null;
  className?: string;
}
```

**Features:**
- Repository search and filtering
- Loading states
- Error handling
- Repository metadata display

## Canvas Module Components

### CanvasPage
Main canvas interface with toolbar and properties panel.

```typescript
interface CanvasPageProps {
  className?: string;
}
```

**Features:**
- Infinite canvas with zoom/pan
- Tool selection toolbar
- Properties panel for element editing
- Export functionality (PNG/SVG)

### ProjectCanvas
Konva.js-based interactive canvas component.

```typescript
interface ProjectCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}
```

**Features:**
- Interactive element manipulation
- Multi-select and bulk editing
- Connection system for linking elements
- Keyboard shortcuts and gestures

### CanvasToolbar
Tool selection and canvas operations toolbar.

```typescript
interface CanvasToolbarProps {
  stageRef?: React.RefObject<Konva.Stage>;
}
```

**Features:**
- Shape and text tools
- Selection and pan tools
- Zoom controls
- Save and export options

### CanvasProperties
Properties panel for editing selected canvas elements.

```typescript
interface CanvasPropertiesProps {
  // Props managed by CanvasContext
}
```

**Features:**
- Real-time property editing
- Bulk editing for multiple selections
- Style controls (colors, fonts, sizes)
- Element-specific properties

## GitHub Module Components

### GitHubDashboard
Main GitHub integration dashboard.

```typescript
interface GitHubDashboardProps {
  className?: string;
}
```

**Features:**
- Repository overview
- Recent activity feed
- Issue and PR summaries
- Branch management

### RepositoryCard
Individual repository display card.

```typescript
interface RepositoryCardProps {
  repository: GitHubRepository;
  onClick?: (repository: GitHubRepository) => void;
  className?: string;
}
```

**Features:**
- Repository metadata display
- Language and statistics
- Last updated information
- Click handling for navigation

### CommitList
List component for displaying repository commits.

```typescript
interface CommitListProps {
  commits: GitHubCommit[];
  isLoading?: boolean;
  onCommitClick?: (commit: GitHubCommit) => void;
}
```

**Features:**
- Commit message and author display
- Timestamp formatting
- Pagination support
- Loading states

### IssueList
GitHub issues display component.

```typescript
interface IssueListProps {
  issues: GitHubIssue[];
  onIssueClick?: (issue: GitHubIssue) => void;
  onCreateIssue?: () => void;
}
```

**Features:**
- Issue status and labels
- Assignee information
- Create new issue functionality
- Filtering and sorting

## Kanban Module Components

### KanbanBoard
Main Kanban board with drag-and-drop functionality.

```typescript
interface KanbanBoardProps {
  boardId: string;
  className?: string;
}
```

**Features:**
- Drag-and-drop card management
- Column customization
- GitHub issue synchronization
- Real-time updates

### KanbanCard
Individual task card component.

```typescript
interface KanbanCardProps {
  card: KanbanCard;
  onEdit?: (card: KanbanCard) => void;
  onDelete?: (cardId: string) => void;
  isDragging?: boolean;
}
```

**Features:**
- Card content display
- Label and assignee information
- Edit and delete actions
- Drag handle and visual feedback

### BoardSelector
Board selection and management component.

```typescript
interface BoardSelectorProps {
  boards: KanbanBoard[];
  selectedBoard?: KanbanBoard;
  onBoardSelect: (board: KanbanBoard) => void;
  onCreateBoard: () => void;
}
```

**Features:**
- Board switching
- Create new board
- Board metadata display
- Search and filtering

## UI Components (shadcn/ui)

### Button
Customizable button component with variants.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}
```

### Card
Container component for content sections.

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
```

### Dialog
Modal dialog component for overlays.

```typescript
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

### Tabs
Tab navigation component.

```typescript
interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}
```

### ResizablePanels
Custom resizable panel component for split layouts.

```typescript
interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode];
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
}
```

**Features:**
- Mouse and touch resize support
- Configurable size constraints
- Smooth resize animations
- Responsive behavior

## Custom Hooks

### useAIChat
Hook for managing AI chat functionality.

```typescript
interface UseAIChatReturn {
  activeSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  createNewSession: () => void;
  switchToSession: (sessionId: string) => void;
  setCurrentFile: (file: GitHubFileContent | null) => void;
  // ... more methods
}
```

### useFileNavigation
Hook for file navigation and history management.

```typescript
interface UseFileNavigationReturn {
  selectedRepository: GitHubRepository | null;
  selectedFile: GitHubFileContent | null;
  selectedFilePath: string;
  fileHistory: string[];
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  navigateToFile: (filePath: string) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  // ... more methods
}
```

### useKeyboardShortcuts
Hook for keyboard shortcut management.

```typescript
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): KeyboardShortcut[]
```

### useCanvas
Hook for canvas state management.

```typescript
interface UseCanvasReturn {
  project: CanvasProject | null;
  selectedElements: string[];
  tool: CanvasState['tool'];
  viewport: CanvasViewport;
  createElement: (element: Partial<CanvasElement>) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  // ... more methods
}
```

## Context Providers

### GitHubAuthContext
GitHub authentication state management.

```typescript
interface GitHubAuthContextType {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  apiClient: GitHubApiClient | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}
```

### CanvasContext
Canvas state and operations management.

```typescript
interface CanvasContextType extends CanvasState, CanvasActions {
  // Combined state and actions for canvas operations
}
```

### ThemeProvider
Theme management with dark/light mode support.

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}
```

## Testing Patterns

### Component Testing
```typescript
// Example component test
describe('GitHubFileExplorer', () => {
  it('should render file tree when repository is provided', async () => {
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
});
```

### Hook Testing
```typescript
// Example hook test
describe('useFileNavigation', () => {
  it('should navigate to file and update history', async () => {
    const { result } = renderHook(() => useFileNavigation());
    
    await act(async () => {
      await result.current.navigateToFile('src/test.ts');
    });
    
    expect(result.current.selectedFilePath).toBe('src/test.ts');
    expect(result.current.fileHistory).toContain('src/test.ts');
  });
});
```

### Mock Patterns
```typescript
// API client mocking
jest.mock('@/lib/github/GitHubApiClient');
const mockApiClient = {
  getDirectoryContents: jest.fn(),
  getFileContent: jest.fn(),
};

// Context mocking
jest.mock('@/contexts/GitHubAuthContext');
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;
```

## Performance Considerations

### Component Optimization
- **React.memo** for expensive components
- **useMemo** for expensive calculations
- **useCallback** for stable function references
- **Lazy loading** for large components

### Bundle Optimization
- **Code splitting** at route level
- **Dynamic imports** for heavy dependencies
- **Tree shaking** for unused code elimination
- **Bundle analysis** with webpack-bundle-analyzer

### Rendering Performance
- **Virtualization** for large lists
- **Debouncing** for search inputs
- **Throttling** for scroll events
- **Intersection Observer** for lazy loading

## Accessibility Guidelines

### Keyboard Navigation
- **Tab order** management with tabIndex
- **Focus management** in modals and complex components
- **Keyboard shortcuts** with proper event handling
- **Skip links** for main content areas

### Screen Reader Support
- **ARIA labels** for interactive elements
- **ARIA roles** for custom components
- **Live regions** for dynamic content updates
- **Semantic HTML** structure

### Visual Accessibility
- **Color contrast** compliance (WCAG AA)
- **Focus indicators** for keyboard navigation
- **Text scaling** support up to 200%
- **Reduced motion** preferences

## Error Boundaries

### Component Error Boundaries
```typescript
class ModuleErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Module error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### Error Fallback Components
```typescript
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <p>{error?.message}</p>
      {resetError && (
        <Button onClick={resetError}>Try again</Button>
      )}
    </div>
  );
}
```

## Best Practices

### Component Design
- **Single Responsibility** - Each component has one clear purpose
- **Composition over Inheritance** - Build complex components from simple ones
- **Props Interface Design** - Clear, typed interfaces with good defaults
- **Error Handling** - Graceful degradation and user feedback

### State Management
- **Local State First** - Use local state when possible
- **Context for Global State** - Use Context for truly global state
- **Custom Hooks** - Extract reusable logic into hooks
- **Immutable Updates** - Always create new state objects

### Performance
- **Minimize Re-renders** - Use React.memo and useMemo appropriately
- **Lazy Loading** - Load components and data on demand
- **Code Splitting** - Split bundles at logical boundaries
- **Caching** - Cache expensive operations and API responses

### Testing
- **Test Behavior, Not Implementation** - Focus on user interactions
- **Mock External Dependencies** - Isolate component logic
- **Comprehensive Coverage** - Test happy paths and edge cases
- **Accessibility Testing** - Include a11y in test suites