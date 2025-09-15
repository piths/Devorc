# DevOrch Suite - AI-Powered Developer Productivity Platform

> **Built with Kiro AI** - This project showcases modern AI-assisted development using structured specifications and iterative design.

## 🏆 Hackathon Submission

This repository demonstrates the complete development process from initial concept to working application, built using Kiro AI's structured development methodology.

## 🚀 What is DevOrch Suite?

An AI-powered developer productivity platform that integrates multiple development tools into a unified workspace:

- 🚀 **GitHub Dashboard** - Repository management, issue tracking, and pull request workflows
- 📋 **Smart Kanban** - Visual task management with bidirectional GitHub synchronization
- 🎨 **Project Canvas** - Interactive brainstorming and architecture visualization with Konva.js
- 🤖 **AI Chat Assistant** - Cursor-like interface with intelligent code analysis and contextual insights
- 💬 **Slack Integration** - Real-time commit notifications and team collaboration

## 🤖 AI-Assisted Development Process

This project was built using **Kiro AI** with a structured spec-driven development approach:

### 📋 Development Artifacts

- **[Requirements](/.kiro/specs/devorch-suite/requirements.md)** - User stories and acceptance criteria in EARS format
- **[Design Document](/.kiro/specs/devorch-suite/design.md)** - System architecture and technical specifications
- **[Implementation Tasks](/.kiro/specs/devorch-suite/tasks.md)** - Structured task breakdown for development

### 🔄 Development Workflow

1. **Requirements Gathering** - Transformed rough ideas into structured user stories
2. **System Design** - Created comprehensive architecture and component design
3. **Task Planning** - Broke down implementation into manageable, testable tasks
4. **Iterative Development** - Built features incrementally with AI assistance

## 🛠 Tech Stack

### Core Framework
- **Next.js 15.5.3** with App Router and TypeScript 5
- **React 19.1.0** with modern hooks and Context API
- **TypeScript** for comprehensive type safety

### UI & Styling
- **shadcn/ui** component system built on Radix UI primitives
- **Tailwind CSS 4** with custom design tokens and CSS variables
- **Lucide React** and **Tabler Icons** for consistent iconography
- **next-themes** for seamless dark/light theme switching
- **Geist** fonts (Sans & Mono) from Vercel

### Key Libraries
- **@tanstack/react-table** for advanced data tables
- **@dnd-kit** for drag-and-drop functionality in Kanban boards
- **recharts** for interactive data visualization
- **react-konva** & **konva** for 2D canvas rendering
- **react-syntax-highlighter** for code syntax highlighting
- **zod** for runtime schema validation
- **sonner** for elegant toast notifications

### APIs & Integration
- **GitHub REST API** for repository management
- **OpenAI API** (with OpenRouter support) for AI chat functionality
- **Local Storage** with hybrid storage strategies for data persistence

### Development Tools
- **ESLint 9** with Next.js configuration
- **Jest 30** with React Testing Library for comprehensive testing
- **Sharp** for optimized image processing
- **Turbopack** for faster development builds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- GitHub OAuth App credentials
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devorch-suite.git
   cd devorch-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your API keys:
   ```env
   # GitHub OAuth Configuration
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_WEBHOOK_SECRET=your_github_webhook_secret

   # OpenAI API Configuration (supports OpenRouter)
   OPENAI_API_KEY=your_openai_api_key
   # Optional: Use OpenRouter instead of OpenAI
   # OPENAI_BASE_URL=https://openrouter.ai/api/v1
   # OPENAI_MODEL=openai/gpt-4o-mini

   # Slack Integration (Optional)
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   SLACK_BOT_TOKEN=your_slack_bot_token
   SLACK_CHANNEL_ID=your_slack_channel_id

   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Set up GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App with callback URL: `http://localhost:3000/api/auth/github/callback`
   - Copy the Client ID and Client Secret to your `.env.local`

5. **Run the development server**
   ```bash
   npm run dev          # With Turbopack (recommended)
   # or
   npm run dev:fallback # Without Turbopack
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
├── .kiro/                          # Kiro AI development specs
│   ├── specs/devorch-suite/       # Main platform specifications
│   │   ├── requirements.md        # User stories & acceptance criteria
│   │   ├── design.md             # System architecture & design
│   │   └── tasks.md              # Implementation task breakdown
│   └── specs/cursor-like-chat/    # Cursor-like chat feature specs
│       ├── requirements.md        # Chat interface requirements
│       ├── design.md             # Chat architecture design
│       └── tasks.md              # Chat implementation tasks
├── src/                           # Next.js application source
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes (auth, chat, webhooks)
│   │   ├── dashboard/            # Dashboard and GitHub integration
│   │   ├── kanban/               # Kanban board interface
│   │   ├── canvas/               # Project canvas interface
│   │   └── chat/                 # AI chat interface
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── modules/              # Feature-specific components
│   │   │   ├── canvas/           # Canvas components (Konva.js)
│   │   │   ├── chat/             # Chat interface components
│   │   │   ├── github/           # GitHub integration components
│   │   │   └── kanban/           # Kanban board components
│   │   ├── github/               # GitHub-specific components
│   │   └── slack/                # Slack integration components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAIChat.ts          # AI chat functionality
│   │   ├── useCanvas.ts          # Canvas state management
│   │   ├── useFileNavigation.ts  # File navigation for chat
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts
│   ├── lib/                      # API clients & utilities
│   │   ├── chat/                 # AI chat services
│   │   ├── github/               # GitHub API client
│   │   ├── openai/               # OpenAI API client
│   │   ├── slack/                # Slack integration
│   │   └── storage/              # Data persistence layer
│   ├── contexts/                 # React Context providers
│   │   ├── GitHubAuthContext.tsx # GitHub authentication
│   │   └── CanvasContext.tsx     # Canvas state management
│   ├── types/                    # TypeScript definitions
│   │   ├── github.ts             # GitHub API types
│   │   ├── canvas.ts             # Canvas element types
│   │   ├── chat.ts               # Chat message types
│   │   └── storage.ts            # Data persistence types
│   └── utils/                    # Utility functions
├── docs/                         # Documentation
│   └── OPENROUTER_SETUP.md      # OpenRouter configuration guide
├── public/                       # Static assets and logos
├── package.json                  # Dependencies and scripts
└── README.md                    # This file
```

## 🎯 Current Implementation Status

### ✅ Completed Features

**Core Platform (Tasks 1-11)**
- ✅ **Project Foundation** - Next.js 15.5.3 with TypeScript, Tailwind CSS, shadcn/ui
- ✅ **Layout & Navigation** - Responsive sidebar with module switching and dark theme
- ✅ **Data Persistence** - Local storage with hybrid strategies and auto-save
- ✅ **GitHub Integration** - OAuth authentication, API client, repository management
- ✅ **GitHub Dashboard** - Repository lists, commits, issues, pull requests with responsive design
- ✅ **Kanban Board** - Drag-and-drop functionality with GitHub issue synchronization
- ✅ **Project Canvas** - Interactive canvas with Konva.js, shapes, connectors, and export
- ✅ **AI Chat Assistant** - OpenAI integration with codebase analysis and file upload
- ✅ **Cursor-like Interface** - Split-pane layout with file explorer and code viewer

**Cursor-like Chat Features (All Tasks Complete)**
- ✅ **Split-pane Layout** - Resizable panels with file explorer on left, chat on right
- ✅ **GitHub Repository Selector** - Dropdown with user's repositories and loading states
- ✅ **File Tree Explorer** - Collapsible tree structure with expand/collapse functionality
- ✅ **Code Viewer** - Syntax highlighting with file type detection and copy functionality
- ✅ **File Navigation** - History management with keyboard shortcuts (Alt+←/→, Cmd+[/])
- ✅ **AI Context Integration** - Current file context passed to AI for relevant responses
- ✅ **Enhanced AI Responses** - File-specific code analysis and suggestions
- ✅ **Comprehensive Testing** - Unit tests for all components and hooks

### 🔄 In Progress

**Responsive Design & Polish (Tasks 12-18)**
- 🔄 **Mobile Optimization** - Touch gestures, collapsible sidebar, viewport adaptation
- 🔄 **Error Handling** - Error boundaries, toast notifications, offline detection
- 🔄 **User Preferences** - Theme switching, settings persistence, data export/import
- 🔄 **Performance Optimization** - Code splitting, lazy loading, bundle optimization
- 🔄 **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- 🔄 **Integration Testing** - End-to-end workflows and cross-module interactions

### 🚀 Key Features Highlights

- **GitHub OAuth** - Secure authentication with token management
- **Real-time Sync** - Bidirectional Kanban-GitHub issue synchronization
- **Interactive Canvas** - Zoom, pan, multi-select, property editing, export (PNG/SVG)
- **AI Code Analysis** - Contextual insights, code suggestions, file-specific responses
- **File Navigation** - Browser-like history with keyboard shortcuts
- **Responsive Design** - Mobile-first approach with touch support
- **Dark Theme** - Consistent purple/blue accent colors across all modules
- **Local Storage** - Hybrid persistence with IndexedDB fallback and auto-save

## 🛠 Available Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (recommended)
npm run dev:fallback # Start development server without Turbopack (fallback)
```

### Building & Deployment
```bash
npm run build        # Build for production with Turbopack optimization
npm start           # Start production server
```

### Code Quality & Testing
```bash
npm run lint        # Run ESLint for code quality checks
npm run test        # Run Jest test suite
npm run test:watch  # Run tests in watch mode for development
npm run test:coverage # Generate test coverage reports
```

## 🏗 Development Philosophy

This project demonstrates:

- **Structured Planning** - Requirements → Design → Tasks → Implementation
- **AI Collaboration** - Human creativity + AI efficiency for enhanced productivity
- **Iterative Development** - Build, test, refine with continuous feedback loops
- **Modern Practices** - TypeScript, component architecture, responsive design
- **Test-Driven Development** - Comprehensive testing with React Testing Library and Jest
- **Performance First** - Optimized builds with Turbopack and code splitting
- **Accessibility** - WCAG compliance with keyboard navigation and screen reader support

## ✨ Feature Highlights

### 🚀 GitHub Dashboard
- **Repository Management** - Browse, search, and filter repositories
- **Issue Tracking** - View and manage GitHub issues with status updates
- **Pull Request Workflows** - Review and manage pull requests
- **Commit History** - Detailed commit logs with diff viewing
- **Branch Management** - Create, switch, and manage repository branches
- **Real-time Sync** - Live updates from GitHub API with rate limit handling

### 📋 Smart Kanban Board
- **Drag & Drop** - Intuitive task management with @dnd-kit
- **GitHub Integration** - Bidirectional sync with GitHub issues
- **Custom Boards** - Multiple boards with customizable columns
- **Conflict Resolution** - Handle external GitHub changes gracefully
- **Auto-save** - Persistent storage with 30-second intervals
- **Board Templates** - Pre-configured layouts for common workflows

### 🎨 Project Canvas
- **Interactive Canvas** - Infinite zoom and pan with Konva.js
- **Shape Tools** - Text, rectangles, circles, lines, polygons, sticky notes
- **Connectors** - Link elements with arrows and lines
- **Multi-select** - Bulk editing and property management
- **Export Options** - PNG and SVG export functionality
- **Real-time Updates** - Live property editing with visual feedback

### 🤖 AI Chat Assistant (Cursor-like Interface)
- **Split Layout** - File explorer on left, chat on right (resizable)
- **Repository Browser** - Navigate GitHub repositories with file tree
- **Code Viewer** - Syntax highlighting for 20+ programming languages
- **File Navigation** - Browser-like history with keyboard shortcuts
- **Contextual AI** - File-aware responses and code analysis
- **Code Insights** - Intelligent suggestions and best practices
- **File Upload** - Analyze local codebases and projects

### 🔧 Developer Experience
- **Dark Theme** - Consistent purple/blue design system
- **Responsive Design** - Mobile-first with touch support
- **Keyboard Shortcuts** - Efficient navigation and actions
- **Error Boundaries** - Graceful error handling and recovery
- **Loading States** - Skeleton components and progress indicators
- **Toast Notifications** - User feedback with Sonner integration

## 🤝 AI Development Partnership

Built in partnership with **Kiro AI**, showcasing how AI can enhance rather than replace human creativity in software development. The AI helped with:

- **Requirements Engineering** - Structured user stories and acceptance criteria
- **Architecture Design** - Component design and data flow patterns
- **Code Generation** - Boilerplate reduction and implementation acceleration
- **Testing Strategy** - Comprehensive test coverage and edge case identification
- **Documentation** - API documentation and component usage examples
- **Best Practices** - Modern React patterns and TypeScript optimization

## 📚 Documentation

### Setup and Configuration
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete setup and deployment instructions
- **[OpenRouter Setup](docs/OPENROUTER_SETUP.md)** - Alternative AI provider configuration
- **[Environment Variables](.env.example)** - Required and optional configuration

### Development Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - External APIs and internal endpoints
- **[Component Documentation](docs/COMPONENT_DOCUMENTATION.md)** - React components and usage patterns
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Testing strategies and best practices

### Architecture Documentation
- **[Requirements](.kiro/specs/devorch-suite/requirements.md)** - User stories and acceptance criteria
- **[Design Document](.kiro/specs/devorch-suite/design.md)** - System architecture and technical design
- **[Implementation Tasks](.kiro/specs/devorch-suite/tasks.md)** - Development task breakdown

### Feature Specifications
- **[Cursor-like Chat Requirements](.kiro/specs/cursor-like-chat/requirements.md)** - Chat interface specifications
- **[Cursor-like Chat Design](.kiro/specs/cursor-like-chat/design.md)** - Chat architecture design
- **[Cursor-like Chat Tasks](.kiro/specs/cursor-like-chat/tasks.md)** - Chat implementation tasks

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Built with ❤️ and 🤖 using Kiro AI**