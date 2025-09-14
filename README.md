# Devorch Suite - AI-Powered Developer Productivity Platform

> **Built with Kiro AI** - This project showcases modern AI-assisted development using structured specifications and iterative design.

## 🏆 Hackathon Submission

This repository demonstrates the complete development process from initial concept to working application, built using Kiro AI's structured development methodology.

## 🚀 What is Devorch Suite?

An AI-powered developer productivity platform that integrates:

- 🚀 **GitHub Dashboard** - Repository management and issue tracking
- 📋 **Smart Kanban** - Visual task management with GitHub sync
- 🎨 **Project Canvas** - Interactive brainstorming and architecture visualization  
- 🤖 **AI Assistant** - Intelligent code analysis and development insights
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

- **Framework**: Next.js 14+ with App Router and TypeScript
- **UI**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React hooks with Context API
- **APIs**: GitHub REST API, OpenAI API
- **Development**: Kiro AI for structured development

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
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   OPENAI_API_KEY=your_openai_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   SLACK_WEBHOOK_URL=your_slack_webhook_url  # Optional: for Slack notifications
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
├── .kiro/                          # Kiro AI development specs
│   └── specs/devorch-suite/        
│       ├── requirements.md         # User stories & acceptance criteria
│       ├── design.md              # System architecture & design
│       └── tasks.md               # Implementation task breakdown
├── src/                            # Next.js application source
│   ├── app/                       # Next.js App Router pages
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Layout components
│   │   └── modules/              # Feature modules
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # API clients & utilities
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Utility functions
├── public/                        # Static assets
├── package.json                   # Dependencies and scripts
└── README.md                     # This file
```

## 🎯 Current Implementation Status

✅ **Task 1: Project Foundation** - Complete
- Next.js setup with TypeScript and Tailwind CSS
- shadcn/ui component system
- Dark theme with purple/blue accents
- Environment configuration
- Project structure and core types

🔄 **Next Tasks** (Ready for implementation)
- GitHub OAuth integration
- Dashboard layout and navigation
- Module implementations (Kanban, Canvas, Chat)

## 🏗 Development Philosophy

This project demonstrates:

- **Structured Planning** - Requirements → Design → Tasks → Implementation
- **AI Collaboration** - Human creativity + AI efficiency
- **Iterative Development** - Build, test, refine
- **Modern Practices** - TypeScript, component architecture, responsive design

## 🤝 AI Development Partnership

Built in partnership with **Kiro AI**, showcasing how AI can enhance rather than replace human creativity in software development. The AI helped with:

- Requirements structuring and validation
- Architecture design and best practices
- Code generation and implementation
- Testing strategies and error handling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Built with ❤️ and 🤖 using Kiro AI**