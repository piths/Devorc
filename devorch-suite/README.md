# Devorch Suite

AI-powered developer productivity platform with GitHub integration, Kanban boards, project canvas, and intelligent code analysis.

## Features

- 🚀 **GitHub Dashboard** - Manage repositories, track issues, and monitor project activity
- 📋 **Smart Kanban** - Visual task management with GitHub issue synchronization  
- 🎨 **Project Canvas** - Interactive brainstorming and architecture visualization
- 🤖 **AI Assistant** - Intelligent code analysis and development insights

## Tech Stack

- **Framework**: Next.js 14+ with App Router and TypeScript
- **UI**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with dark theme
- **State Management**: React hooks with Context API
- **Data Persistence**: Browser localStorage
- **APIs**: GitHub REST API, OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub OAuth App (for GitHub integration)
- OpenAI API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your API keys:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── modules/           # Feature modules
│       ├── github/        # GitHub Dashboard
│       ├── kanban/        # Kanban Board
│       ├── canvas/        # Project Canvas
│       └── chat/          # AI Chat Assistant
├── hooks/                 # Custom React hooks
├── lib/                   # Library code
│   ├── api/              # API clients
│   └── storage/          # Data persistence
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js Secret | Yes |
| `NEXTAUTH_URL` | Application URL | No (defaults to localhost:3000) |

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## License

MIT License - see LICENSE file for details