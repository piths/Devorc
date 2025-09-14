# GitHub OAuth 404 Error - Fix Guide

## Problem
The GitHub OAuth app with client ID `Ov23t1iR1pZALDosgvmlt0` returns a 404 error because it doesn't exist in GitHub's system.

## Solution: Create a New GitHub OAuth App

### Step 1: Go to GitHub Developer Settings
1. Open your browser and go to: https://github.com/settings/developers
2. Make sure you're logged into your GitHub account

### Step 2: Create New OAuth App
1. Click the **"New OAuth App"** button (green button on the right)
2. Fill in the following details:
   - **Application name**: `Devorc Suite`
   - **Homepage URL**: `http://localhost:3001` (note: port 3001, not 3000)
   - **Application description**: `AI-powered developer productivity platform`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`

### Step 3: Register the Application
1. Click **"Register application"**
2. You'll be taken to the app settings page
3. **Copy the Client ID** (it will look like `Ov23li...` or similar)
4. **Generate a Client Secret** by clicking "Generate a new client secret"
5. **Copy the Client Secret** (you won't be able to see it again!)

### Step 4: Update Environment Variables
Update your `.env.local` file with the new credentials:

```bash
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_new_client_id_here
GITHUB_CLIENT_SECRET=your_new_client_secret_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Step 5: Restart Development Server
1. Stop your current dev server (Ctrl+C)
2. Run: `npm run dev`
3. The server should start on port 3001

### Step 6: Test the Fix
1. Go to `http://localhost:3001/test-auth`
2. Verify both Client ID and Client Secret show as "Configured"
3. Click "Sign in with GitHub"
4. You should be redirected to GitHub for authorization (not a 404 error)

## Important Notes

- **Port Mismatch**: Your app is running on port 3001, but the setup instructions mentioned port 3000. Make sure to use port 3001 in your OAuth app configuration.
- **Callback URL**: Must be exactly `http://localhost:3001/auth/github/callback`
- **Client Secret**: Keep this secure and never commit it to version control

## If You Still Get 404

1. Double-check the Client ID in your `.env.local` file
2. Verify the OAuth app is created in the correct GitHub account
3. Make sure the callback URL matches exactly
4. Try clearing your browser cache
5. Check the browser console for any additional error messages

## For Production Deployment

When you deploy to production (e.g., Vercel), you'll need to:
1. Create another OAuth app for production
2. Update the callback URL to your production domain
3. Set the environment variables in your deployment platform
