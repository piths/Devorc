# API Documentation

## Overview

DevOrch Suite integrates with multiple external APIs and provides internal API routes for various functionalities. This document covers all API integrations and internal endpoints.

## External API Integrations

### GitHub REST API

The application uses GitHub's REST API v3 for repository management and issue tracking.

#### Authentication
- **OAuth 2.0** flow with GitHub Apps
- **Scopes**: `repo`, `user:email`, `read:user`
- **Token Storage**: Secure client-side storage with automatic refresh

#### Endpoints Used

##### Repositories
```typescript
GET /user/repos
GET /repos/{owner}/{repo}
GET /repos/{owner}/{repo}/commits
GET /repos/{owner}/{repo}/contents/{path}
GET /repos/{owner}/{repo}/git/trees/{tree_sha}
```

##### Issues & Pull Requests
```typescript
GET /repos/{owner}/{repo}/issues
POST /repos/{owner}/{repo}/issues
PATCH /repos/{owner}/{repo}/issues/{issue_number}
GET /repos/{owner}/{repo}/pulls
POST /repos/{owner}/{repo}/pulls
```

##### Branches
```typescript
GET /repos/{owner}/{repo}/branches
POST /repos/{owner}/{repo}/git/refs
DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}
```

#### Rate Limiting
- **5,000 requests/hour** for authenticated users
- **Rate limit headers** monitored and respected
- **Exponential backoff** with jitter for retries
- **Circuit breaker** pattern for API failures

#### Error Handling
```typescript
class GitHubApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable: boolean = false
  )
}
```

### OpenAI API

Integration with OpenAI's GPT models for AI chat functionality.

#### Configuration
- **Base URL**: `https://api.openai.com/v1` (default) or OpenRouter
- **Model**: `gpt-4o-mini` (recommended) or configurable
- **Max Tokens**: 4096 for responses
- **Temperature**: 0.7 for balanced creativity

#### OpenRouter Support
Alternative to direct OpenAI API with better pricing:
```env
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

#### Endpoints Used
```typescript
POST /chat/completions
```

#### Request Format
```typescript
interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}
```

#### Error Handling
- **Rate limiting** with exponential backoff
- **Token limit** handling with context truncation
- **Fallback responses** when API is unavailable
- **Request queuing** for reliability

## Internal API Routes

### Authentication

#### GitHub OAuth Callback
```typescript
POST /api/auth/github/callback
```

**Request Body:**
```typescript
{
  code: string; // OAuth authorization code
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope: string;
}
```

### Chat API

#### Send Message
```typescript
POST /api/chat
```

**Request Body:**
```typescript
{
  message: string;
  sessionId?: string;
  fileContext?: {
    path: string;
    content: string;
    language: string;
  };
  codebaseContext?: {
    files: CodeFile[];
    structure: ProjectStructure;
  };
}
```

**Response:**
```typescript
{
  response: string;
  sessionId: string;
  codeReferences?: CodeReference[];
  suggestions?: string[];
}
```

### Webhook Endpoints

#### GitHub Webhooks
```typescript
POST /api/webhooks/github
```

**Supported Events:**
- `push` - Repository push events
- `issues` - Issue creation/updates
- `pull_request` - PR creation/updates
- `repository` - Repository changes

**Webhook Verification:**
- HMAC-SHA256 signature verification
- Secret validation from environment variables

### Slack Integration

#### Notification Configuration
```typescript
GET /api/slack/config
POST /api/slack/config
```

#### Send Notification
```typescript
POST /api/slack/notify
```

**Request Body:**
```typescript
{
  channel: string;
  message: string;
  attachments?: SlackAttachment[];
}
```

## Data Models

### GitHub Types

#### Repository
```typescript
interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
}
```

#### File Content
```typescript
interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string; // Base64 encoded
  encoding?: string;
}
```

#### Issue
```typescript
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  assignee: GitHubUser | null;
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  html_url: string;
}
```

### Chat Types

#### Chat Message
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  fileContext?: FileContext;
  codeReferences?: CodeReference[];
}
```

#### Chat Session
```typescript
interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  codebaseContext?: CodebaseContext;
  createdAt: Date;
  updatedAt: Date;
}
```

#### File Context
```typescript
interface FileContext {
  repository: GitHubRepository;
  filePath: string;
  content: string;
  language: string;
}
```

### Canvas Types

#### Canvas Element
```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'polygon' | 'sticky-note' | 'flowchart-shape' | 'image';
  position: Point;
  size: Size;
  rotation: number;
  style: ElementStyle;
  data: Record<string, unknown>;
  connections: Connection[];
}
```

#### Canvas Project
```typescript
interface CanvasProject {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Storage Types

#### Kanban Board
```typescript
interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  githubRepo?: {
    owner: string;
    repo: string;
    syncConfig: SyncConfiguration;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Kanban Card
```typescript
interface KanbanCard {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  assignee?: string;
  dueDate?: Date;
  githubIssueId?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Error Response Format
```typescript
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes

#### Authentication Errors
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - Missing required permissions

#### GitHub API Errors
- `GITHUB_RATE_LIMIT` - Rate limit exceeded
- `GITHUB_NOT_FOUND` - Repository or resource not found
- `GITHUB_FORBIDDEN` - Access denied

#### OpenAI API Errors
- `OPENAI_RATE_LIMIT` - Rate limit exceeded
- `OPENAI_INVALID_REQUEST` - Invalid request format
- `OPENAI_MODEL_OVERLOADED` - Model temporarily unavailable

#### Validation Errors
- `INVALID_INPUT` - Request validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Invalid data format

## Rate Limiting & Performance

### GitHub API
- **Rate Limit**: 5,000 requests/hour
- **Monitoring**: Real-time rate limit tracking
- **Caching**: Repository data cached for 5 minutes
- **Pagination**: Automatic handling of paginated responses

### OpenAI API
- **Rate Limit**: Varies by plan and model
- **Request Queuing**: Queue requests during high load
- **Context Management**: Automatic context truncation
- **Streaming**: Support for streaming responses

### Internal APIs
- **Response Caching**: Cache frequently accessed data
- **Request Debouncing**: Prevent duplicate requests
- **Compression**: Gzip compression for large responses
- **Connection Pooling**: Efficient database connections

## Security Considerations

### Authentication
- **OAuth 2.0** with PKCE for GitHub
- **JWT tokens** for session management
- **Secure token storage** with httpOnly cookies
- **Token rotation** for long-lived sessions

### API Security
- **HTTPS only** for all API communications
- **CORS configuration** for cross-origin requests
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization

### Data Protection
- **Encryption at rest** for sensitive data
- **Secure transmission** with TLS 1.3
- **Data minimization** - only collect necessary data
- **Regular security audits** and dependency updates

## Testing

### API Testing
- **Unit tests** for API clients with mocked responses
- **Integration tests** with test GitHub repositories
- **End-to-end tests** for complete workflows
- **Performance tests** for rate limiting and caching

### Mock Data
- **GitHub API mocks** with realistic response data
- **OpenAI API mocks** for consistent testing
- **Test fixtures** for various scenarios
- **Error simulation** for error handling tests

## Monitoring & Logging

### API Monitoring
- **Response time tracking** for all external APIs
- **Error rate monitoring** with alerting
- **Rate limit monitoring** with proactive throttling
- **Uptime monitoring** for critical dependencies

### Logging
- **Structured logging** with JSON format
- **Request/response logging** for debugging
- **Error logging** with stack traces
- **Performance logging** for optimization

### Analytics
- **Usage metrics** for feature adoption
- **Performance metrics** for optimization
- **Error analytics** for reliability improvement
- **User behavior tracking** for UX enhancement