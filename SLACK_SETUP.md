# Slack Integration Setup Guide

This guide will help you set up Slack notifications for GitHub commits in the Devorch Suite.

## Prerequisites

- A Slack workspace where you have admin permissions
- Access to your GitHub repository settings
- Environment variables configuration access

## Setup Options

You can choose between two methods for Slack integration:

### Option 1: Webhook URL (Recommended for Simple Setup)

1. **Create a Slack App**
   - Go to [Slack API](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name your app (e.g., "Devorch Suite") and select your workspace

2. **Enable Incoming Webhooks**
   - In your app settings, go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Select the channel where you want notifications
   - Copy the webhook URL

3. **Configure Environment Variables**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Option 2: Bot Token (Advanced Features)

1. **Create a Slack App** (same as Option 1, steps 1)

2. **Configure Bot Permissions**
   - Go to "OAuth & Permissions" in your app settings
   - Add the following Bot Token Scopes:
     - `chat:write` - Send messages
     - `chat:write.public` - Send messages to public channels
     - `channels:read` - List public channels
     - `groups:read` - List private channels

3. **Install App to Workspace**
   - Click "Install to Workspace"
   - Authorize the app
   - Copy the "Bot User OAuth Token"

4. **Configure Environment Variables**
   ```bash
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_CHANNEL_ID=C1234567890  # Optional: default channel ID
   ```

## GitHub Webhook Setup (Automatic Notifications)

To receive automatic notifications when commits are pushed:

1. **Configure Webhook Secret** (Optional but recommended)
   ```bash
   GITHUB_WEBHOOK_SECRET=your-secure-random-string
   ```

2. **Add Webhook to GitHub Repository**
   - Go to your GitHub repository
   - Navigate to Settings → Webhooks
   - Click "Add webhook"
   - Set Payload URL: `https://your-domain.com/api/webhooks/github`
   - Set Content type: `application/json`
   - Set Secret: (same as GITHUB_WEBHOOK_SECRET if configured)
   - Select "Just the push event"
   - Ensure "Active" is checked
   - Click "Add webhook"

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Slack Integration (choose one method)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
# OR
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=C1234567890

# GitHub Webhook (optional)
GITHUB_WEBHOOK_SECRET=your-secure-random-string
```

## Testing the Integration

1. **Test Connection**
   - Go to any repository in the GitHub Dashboard
   - Navigate to the "Notifications" tab
   - Click "Test" to verify your Slack configuration

2. **Manual Notification**
   - Select commits you want to notify about
   - Configure notification settings (mentions, file changes, etc.)
   - Click "Send Notification"

3. **Automatic Notifications**
   - Push commits to your repository
   - Check your Slack channel for automatic notifications

## Notification Features

### Single Commit Notifications
- Commit hash, author, and message
- Repository and branch information
- File changes (optional)
- Direct link to commit on GitHub
- User mentions (configurable)

### Batch Commit Notifications
- Summary of multiple commits
- List of authors involved
- Recent commits preview
- Repository overview link

### Customization Options
- Include/exclude file changes
- Mention specific users
- Custom messages
- Auto-notification settings

## Troubleshooting

### Common Issues

1. **"No Slack configuration found"**
   - Ensure you have either `SLACK_WEBHOOK_URL` or `SLACK_BOT_TOKEN` set
   - Restart your development server after adding environment variables

2. **"Invalid signature" (webhook)**
   - Verify your `GITHUB_WEBHOOK_SECRET` matches the one in GitHub
   - Ensure the webhook URL is correct

3. **"Channel not found" (bot token)**
   - Verify the `SLACK_CHANNEL_ID` is correct
   - Ensure the bot has access to the channel
   - Try using a public channel first

4. **Notifications not appearing**
   - Check that the Slack app has proper permissions
   - Verify the webhook URL is accessible from GitHub
   - Check the webhook delivery logs in GitHub

### Getting Channel ID

To find your Slack channel ID:
1. Open Slack in a web browser
2. Navigate to your channel
3. The URL will contain the channel ID: `https://app.slack.com/client/T.../C123456789`
4. The channel ID is the part starting with 'C'

## Security Best Practices

1. **Keep tokens secure**
   - Never commit tokens to version control
   - Use environment variables
   - Rotate tokens periodically

2. **Webhook security**
   - Always use a webhook secret
   - Verify signatures in production
   - Use HTTPS endpoints only

3. **Permissions**
   - Grant minimal required permissions
   - Review app permissions regularly
   - Monitor webhook deliveries

## Advanced Configuration

### Custom Notification Rules

You can customize when notifications are sent by modifying the webhook handler:

```typescript
// Skip notifications for certain branches
if (branch !== payload.repository.default_branch) {
  return NextResponse.json({ message: 'Branch ignored' });
}

// Skip notifications for certain commit patterns
if (payload.head_commit.message.includes('[skip-notify]')) {
  return NextResponse.json({ message: 'Notification skipped' });
}
```

### Multiple Channels

To send notifications to different channels based on repository or branch:

```typescript
const getChannelForRepository = (repoName: string, branch: string) => {
  if (repoName.includes('production')) return 'C_PROD_CHANNEL';
  if (branch === 'develop') return 'C_DEV_CHANNEL';
  return 'C_DEFAULT_CHANNEL';
};
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are loaded correctly
3. Test the Slack connection using the built-in test feature
4. Check GitHub webhook delivery logs for webhook issues

For additional help, refer to:
- [Slack API Documentation](https://api.slack.com/)
- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)