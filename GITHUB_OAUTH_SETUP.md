# GitHub OAuth Setup Guide

## Issue Identified
The current GitHub OAuth configuration is using an invalid or non-existent client ID (`Ov23t1iR1pZALDosgvmlt0`). This is causing the GitHub login to fail.

## Solution Steps

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: `Devorc Suite`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Update Environment Variables

Update your `.env.local` file with the new credentials:

```bash
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_new_client_id_here
GITHUB_CLIENT_SECRET=your_new_client_secret_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. For Production Deployment

When deploying to production (e.g., Vercel), you'll need to:

1. Create another OAuth app for production
2. Update the callback URL to your production domain
3. Set the environment variables in your deployment platform

### 4. Test the Setup

1. Restart your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with GitHub"
4. You should be redirected to GitHub for authorization
5. After authorization, you should be redirected back to the dashboard

## Current Error

The current error occurs because:
- The client ID `Ov23t1iR1pZALDosgvmlt0` doesn't exist in GitHub's system
- This causes the OAuth flow to fail at the authorization step
- Users see an error when trying to authenticate

## Next Steps

1. Create a new GitHub OAuth app following the steps above
2. Update the `.env.local` file with the new credentials
3. Test the authentication flow
4. Deploy with proper production credentials
