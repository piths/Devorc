# Project Structure & Organization

## Root Directory Structure

```
├── .kiro/                    # Kiro AI development artifacts
│   ├── specs/               # Development specifications and tasks
│   └── steering/            # AI guidance documents (this file)
├── src/                     # Application source code
├── public/                  # Static assets, logos, and icons
├── .env.example/.env.local  # Environment configuration templates
├── components.json          # shadcn/ui configuration
└── package.json             # Dependencies and build scripts
```

## Source Code Organization (`src/`)

### App Router Structure (`src/app/`)
- **Next.js 15 App Router** with nested layouts and route groups
- **API routes** in `api/` subdirectories (e.g., `api/auth/github/callback/`)
- **Page components** as `page.tsx` files with proper metadata
- **Layout components** as `layout.tsx` files with providers
- **Test files** co-located in `__tests__/` directories

### Component Architecture (`src/components/`)

```
components/
├── ui/                      # shadcn/ui base components (Button, Card, etc.)
├── layout/                  # Layout-specific components (headers, sidebars)
├── modules/                 # Feature module components (organized by domain)
│   ├── canvas/             # Project canvas and visualization
│   ├── chat/               # AI chat interface components
│   ├── github/             # GitHub integration components
│   └── kanban/             # Kanban board and task management
├── github/                 # GitHub-specific components (dashboard, repos, etc.)
├── __tests__/              # Component test files
├── __examples__/           # Component usage examples
└── [feature-components].tsx # Standalone feature components
```

### Supporting Directories

- **`hooks/`** - Custom React hooks (useGitHubApi, useLocalStorage, etc.)
- **`lib/`** - API clients, utilities, and configuration
  - **`github/`** - GitHub API client and related utilities
  - **`storage/`** - Local storage management and providers
- **`types/`** - TypeScript type definitions (github.ts, storage.ts, etc.)
- **`contexts/`** - React Context providers (GitHubAuthContext, etc.)
- **`utils/`** - Utility functions and constants

## Naming Conventions

### Files & Directories
- **kebab-case** for directories (`github-auth`, `pull-request-list`)
- **PascalCase** for React components (`GitHubAuth.tsx`, `PullRequestList.tsx`)
- **camelCase** for hooks, utilities, and non-component files (`useGitHubApi.ts`)
- **lowercase** for API routes and Next.js pages (`page.tsx`, `route.ts`)

### Components
- **Descriptive names** indicating purpose (`AuthGuard`, `RepositoryCard`)
- **Feature prefixes** for domain-specific components (`GitHubDashboard`, `GitHubApiClient`)
- **Consistent suffixes** for component types (`-card`, `-list`, `-detail`, `-manager`)

## Import Patterns

### Path Aliases (configured in tsconfig.json)
```typescript
// Use @/ prefix for all internal imports
import { Button } from '@/components/ui/button';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository } from '@/types/github';
```

### Import Organization Order
1. **External libraries** (React, Next.js, third-party packages)
2. **Internal components and hooks** (`@/components`, `@/hooks`)
3. **Types and utilities** (`@/types`, `@/lib`, `@/utils`)
4. **Relative imports** (same directory only, avoid when possible)

## Testing Structure

- **Co-located tests** in `__tests__/` directories next to source files
- **Component tests** using React Testing Library with Jest
- **API client tests** for GitHub integration and utilities
- **Mock setup** in `jest.setup.js` for Next.js environment and globals
- **Test utilities** and shared mocks in test directories

## Error Handling Patterns

- **Error boundaries** for component-level error catching (`GitHubErrorBoundary`)
- **Custom error classes** for API errors (`GitHubApiError`)
- **Graceful degradation** with loading states and fallbacks
- **User-friendly error messages** with actionable recovery options

## State Management Patterns

- **React Context** for global state (authentication, theme)
- **Custom hooks** for component-level state and API calls
- **Local storage** integration for persistence
- **Optimistic updates** for better user experience

## Module Organization Best Practices

Each feature module should contain:
- **Components** - UI components specific to the feature domain
- **Hooks** - Custom hooks encapsulating feature logic
- **Types** - TypeScript definitions for feature-specific data
- **Utils** - Feature-specific utility functions
- **Tests** - Comprehensive test coverage for components and logic
- **Index files** - Clean exports for external consumption