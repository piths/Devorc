# Setup and Deployment Guide

## Prerequisites

Before setting up DevOrch Suite, ensure you have the following:

- **Node.js 18+** (LTS recommended)
- **npm** or **yarn** package manager
- **Git** for version control
- **GitHub account** for OAuth integration
- **OpenAI API key** or **OpenRouter account** for AI features

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/devorch-suite.git
cd devorch-suite

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. GitHub OAuth Setup

#### Create GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: DevOrch Suite (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

#### Configure Environment Variables

Update your `.env.local` file:

```env
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Generate a random string for webhook secret
# You can use: openssl rand -hex 32
```

### 3. AI Integration Setup

#### Option A: OpenAI Direct

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

#### Option B: OpenRouter (Recommended)

```env
# OpenRouter Configuration
OPENAI_API_KEY=sk-or-v1-your-openrouter-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

See [OpenRouter Setup Guide](./OPENROUTER_SETUP.md) for detailed instructions.

### 4. Additional Configuration

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Optional: Slack Integration
SLACK_WEBHOOK_URL=your_slack_webhook_url
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-slack-channel-id
```

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

### 5. Start Development Server

```bash
# Start with Turbopack (recommended)
npm run dev

# Or without Turbopack
npm run dev:fallback
```

The application will be available at `http://localhost:3000`.

## Production Deployment

### Vercel Deployment (Recommended)

#### 1. Prepare for Deployment

```bash
# Build the application locally to test
npm run build
npm start
```

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to configure your project
```

#### 3. Configure Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env.local`
4. Update URLs for production:

```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_production_github_client_id
```

#### 4. Update GitHub OAuth App

1. Go to your GitHub OAuth App settings
2. Update the callback URL to: `https://your-app.vercel.app/api/auth/github/callback`
3. Update the homepage URL to: `https://your-app.vercel.app`

### Alternative Deployment Options

#### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t devorch-suite .
docker run -p 3000:3000 --env-file .env.local devorch-suite
```

#### Railway Deployment

1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy automatically on git push

#### Netlify Deployment

1. Connect your repository to Netlify
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
3. Configure environment variables
4. Enable Next.js runtime

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `Iv1.a1b2c3d4e5f6g7h8` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `1234567890abcdef...` |
| `OPENAI_API_KEY` | OpenAI or OpenRouter API Key | `sk-...` or `sk-or-v1-...` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `random-32-char-string` |
| `NEXTAUTH_URL` | Application base URL | `https://your-app.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | AI model to use | `gpt-4o-mini` |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | - |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | - |
| `SLACK_BOT_TOKEN` | Slack bot token | - |
| `SLACK_CHANNEL_ID` | Slack channel ID | - |

## Database Setup

DevOrch Suite uses browser localStorage and IndexedDB for data persistence. No external database is required for basic functionality.

### Local Storage Structure

```typescript
// Stored data structure
{
  "kanban-boards": KanbanBoard[],
  "canvas-projects": CanvasProject[],
  "chat-sessions": ChatSession[],
  "user-preferences": UserPreferences,
  "github-auth": GitHubConnection
}
```

### Storage Limits and Cleanup

- **localStorage**: ~5-10MB per domain
- **IndexedDB**: ~50MB+ per domain (varies by browser)
- **Auto-cleanup**: Old data automatically cleaned up after 30 days
- **Manual cleanup**: Users can clear data via settings

## Security Configuration

### HTTPS Setup

For production deployments, ensure HTTPS is enabled:

```env
# Force HTTPS in production
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
```

### CORS Configuration

CORS is configured in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXTAUTH_URL || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Content Security Policy

Add CSP headers for enhanced security:

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Optimize images
npm install sharp
```

### Caching Strategy

- **Static assets**: Cached for 1 year
- **API responses**: Cached for 5 minutes
- **GitHub data**: Cached for 10 minutes
- **User preferences**: Cached indefinitely

### CDN Configuration

For Vercel deployment, CDN is automatically configured. For other platforms:

1. Configure static asset caching
2. Enable gzip compression
3. Set appropriate cache headers

## Monitoring and Logging

### Error Tracking

Integrate with error tracking services:

```typescript
// Example: Sentry integration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Analytics

Add analytics tracking:

```typescript
// Example: Google Analytics
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
      <GoogleAnalytics gaId="GA_MEASUREMENT_ID" />
    </html>
  )
}
```

### Performance Monitoring

Monitor Core Web Vitals:

```typescript
// pages/_app.tsx
export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics service
}
```

## Troubleshooting

### Common Issues

#### GitHub OAuth Not Working

1. **Check callback URL**: Ensure it matches exactly in GitHub settings
2. **Verify environment variables**: Client ID and secret must be correct
3. **Check HTTPS**: Production must use HTTPS for OAuth
4. **Clear browser cache**: OAuth tokens may be cached

#### AI Chat Not Responding

1. **Verify API key**: Check OpenAI/OpenRouter API key is valid
2. **Check rate limits**: Monitor API usage and limits
3. **Network issues**: Verify API endpoint accessibility
4. **Model availability**: Some models may be temporarily unavailable

#### Build Failures

1. **Node version**: Ensure Node.js 18+ is installed
2. **Dependencies**: Run `npm install` to update dependencies
3. **TypeScript errors**: Fix any type errors before building
4. **Memory issues**: Increase Node.js memory limit if needed

#### Performance Issues

1. **Bundle size**: Analyze and optimize large dependencies
2. **Image optimization**: Ensure Sharp is installed for image optimization
3. **Caching**: Verify caching headers are set correctly
4. **Database queries**: Optimize localStorage operations

### Debug Mode

Enable debug logging:

```env
# Enable debug logs
DEBUG=devorch:*
NODE_ENV=development
```

### Health Checks

Create health check endpoints:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

## Backup and Recovery

### Data Export

Users can export their data:

```typescript
// Export all user data
const exportData = {
  kanbanBoards: localStorage.getItem('kanban-boards'),
  canvasProjects: localStorage.getItem('canvas-projects'),
  chatSessions: localStorage.getItem('chat-sessions'),
  preferences: localStorage.getItem('user-preferences'),
};
```

### Data Import

Users can import previously exported data:

```typescript
// Import user data
function importData(exportedData) {
  Object.entries(exportedData).forEach(([key, value]) => {
    if (value) {
      localStorage.setItem(key, value);
    }
  });
}
```

### Automated Backups

For production, consider implementing automated backups:

1. **User data export API**: Allow users to download their data
2. **Scheduled exports**: Automatically export data periodically
3. **Cloud storage**: Store backups in cloud storage services
4. **Recovery procedures**: Document data recovery processes

## Scaling Considerations

### Horizontal Scaling

- **Stateless design**: Application is stateless and can be scaled horizontally
- **CDN usage**: Static assets served via CDN
- **API rate limiting**: Implement rate limiting for API endpoints
- **Caching layers**: Add Redis or similar for caching

### Database Migration

When moving from localStorage to a database:

1. **Migration scripts**: Create scripts to migrate existing data
2. **Backward compatibility**: Maintain localStorage fallback
3. **Data validation**: Validate migrated data integrity
4. **User notification**: Inform users about data migration

### Performance Monitoring

- **Response times**: Monitor API response times
- **Error rates**: Track error rates and types
- **User metrics**: Monitor user engagement and feature usage
- **Resource usage**: Monitor CPU, memory, and bandwidth usage