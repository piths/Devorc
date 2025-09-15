import { NextRequest, NextResponse } from 'next/server';
import { SlackNotificationClient } from '@/lib/slack';
import crypto from 'crypto';

interface GitHubWebhookPayload {
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
  };
}

function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const actualSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(actualSignature, 'hex')
  );
}

function transformGitHubCommitToSlackFormat(githubCommit: GitHubWebhookPayload['commits'][0]) {
  return {
    sha: githubCommit.id,
    commit: {
      message: githubCommit.message,
      author: {
        name: githubCommit.author.name,
        email: githubCommit.author.email,
        date: githubCommit.timestamp
      }
    },
    author: githubCommit.author.username ? {
      id: 0, // Webhook doesn't provide user ID
      login: githubCommit.author.username,
      name: githubCommit.author.name,
      email: githubCommit.author.email,
      avatar_url: `https://github.com/${githubCommit.author.username}.png`,
      html_url: `https://github.com/${githubCommit.author.username}`
    } : null,
    html_url: githubCommit.url,
    files: [
      ...githubCommit.added.map((file: string) => ({ filename: file, status: 'added' })),
      ...githubCommit.modified.map((file: string) => ({ filename: file, status: 'modified' })),
      ...githubCommit.removed.map((file: string) => ({ filename: file, status: 'removed' }))
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyGitHubSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid GitHub webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Only handle push events
    if (event !== 'push') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);
    
    // Skip if no commits or if it's a delete event
    if (!payload.commits || payload.commits.length === 0) {
      return NextResponse.json({ message: 'No commits to process' }, { status: 200 });
    }

    // Extract branch name from ref
    const branch = payload.ref.replace('refs/heads/', '');
    
    // Skip if not the default branch (optional - you can remove this filter)
    if (branch !== payload.repository.default_branch) {
      console.log(`Skipping notification for non-default branch: ${branch}`);
      return NextResponse.json({ message: 'Non-default branch ignored' }, { status: 200 });
    }

    const slackClient = new SlackNotificationClient();
    
    // Prepare notification options
    const options = {
      repositoryName: payload.repository.name,
      repositoryUrl: payload.repository.html_url,
      branch,
      includeFiles: true,
      // You can configure default mentions here
      mentionUsers: [] as string[]
    };

    let result;

    if (payload.commits.length === 1) {
      // Single commit notification
      const commit = transformGitHubCommitToSlackFormat(payload.commits[0]);
      result = await slackClient.sendCommitNotification(commit, options);
    } else {
      // Batch commit notification
      const commits = payload.commits.map(c => transformGitHubCommitToSlackFormat(c));
      result = await slackClient.sendBatchCommitNotification(commits, options);
    }

    if (result.success) {
      console.log(`Slack notification sent for ${payload.commits.length} commit(s) in ${payload.repository.full_name}`);
      return NextResponse.json({ 
        message: 'Notification sent successfully',
        commits: payload.commits.length,
        repository: payload.repository.full_name
      });
    } else {
      console.error('Failed to send Slack notification:', result.error);
      return NextResponse.json({ 
        error: 'Failed to send notification',
        details: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GitHub webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GitHub webhook verification (ping event)
export async function GET() {
  return NextResponse.json({ 
    message: 'GitHub webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}