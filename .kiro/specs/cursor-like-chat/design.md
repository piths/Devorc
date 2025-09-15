# Design Document

## Overview

Create a simple split-pane interface similar to Cursor: GitHub repository file explorer and code viewer on the left, AI chat on the right. The AI automatically understands the currently open file for contextual conversations.

## Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Chat Page                            │
├─────────────────────────┬───────────────────────────────┤
│     Left Panel          │        Right Panel            │
│                         │                               │
│  ┌─────────────────┐   │   ┌─────────────────────────┐ │
│  │ Repository      │   │   │                         │ │
│  │ Selector        │   │   │                         │ │
│  └─────────────────┘   │   │                         │ │
│                         │   │                         │ │
│  ┌─────────────────┐   │   │      Chat Interface     │ │
│  │                 │   │   │                         │ │
│  │   File Tree     │   │   │                         │ │
│  │                 │   │   │                         │ │
│  └─────────────────┘   │   │                         │ │
│                         │   │                         │ │
│  ┌─────────────────┐   │   │                         │ │
│  │                 │   │   │                         │ │
│  │  Code Viewer    │   │   │                         │ │
│  │                 │   │   │                         │ │
│  └─────────────────┘   │   └─────────────────────────┘ │
└─────────────────────────┴───────────────────────────────┘
```

## Components and Interfaces

### New Components

#### GitHubFileExplorer
- Repository selector dropdown
- File tree with expand/collapse
- File click handling

#### CodeViewer  
- Syntax highlighted code display
- File content from GitHub API
- Current file indicator

#### Enhanced ChatInterface
- Shows current file context
- File-aware AI responses

## Data Models

### Current File Context
```typescript
interface CurrentFileContext {
  repository: GitHubRepository;
  filePath: string;
  content: string;
  language: string;
}
```

## Error Handling

- Handle GitHub API errors gracefully
- Show loading states for file operations
- Fallback when files can't be loaded

## Testing Strategy

- Test file tree navigation
- Test code viewer with different file types
- Test AI context switching between files