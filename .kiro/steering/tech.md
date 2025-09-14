# Technology Stack & Build System

## Core Framework

- **Next.js 15.5.3** with App Router and TypeScript
- **React 19.1.0** with modern hooks and Context API
- **TypeScript 5** for comprehensive type safety

## UI & Styling

- **shadcn/ui** component system built on Radix UI primitives
- **Tailwind CSS 4** with custom design tokens and CSS variables
- **Lucide React** and **Tabler Icons** for consistent iconography
- **next-themes** for seamless dark/light theme switching
- **Geist** fonts (Sans & Mono) from Vercel for typography
- **tw-animate-css** for enhanced animations

## Key Libraries

- **@tanstack/react-table** for advanced data tables with sorting/filtering
- **@dnd-kit** for drag-and-drop functionality in Kanban boards
- **recharts** for interactive data visualization and charts
- **zod** for runtime schema validation
- **date-fns** for date manipulation and formatting
- **sonner** for elegant toast notifications
- **class-variance-authority** for component variant management
- **vaul** for drawer components

## Development Tools

- **ESLint 9** with Next.js configuration
- **Jest 30** with React Testing Library for comprehensive testing
- **Sharp** for optimized image processing
- **Turbopack** for faster development builds and hot reloading

## Common Commands

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

## Architecture Patterns

- **App Router** with nested layouts and route groups
- **Component composition** following shadcn/ui patterns
- **Custom hooks** for reusable logic and API state management
- **Context providers** for global state (GitHub auth, theme, storage)
- **TypeScript path aliases** using `@/*` for clean, absolute imports
- **Feature-based organization** with co-located tests and types
- **Error boundaries** for graceful error handling
- **Responsive design** with mobile-first approach

## Configuration Files

- **components.json** - shadcn/ui configuration with New York style
- **postcss.config.mjs** - PostCSS with Tailwind CSS plugin
- **tsconfig.json** - TypeScript configuration with strict mode
- **jest.config.js** - Jest testing configuration with jsdom environment