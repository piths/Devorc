import { NextRequest, NextResponse } from 'next/server';
import { SlackNotificationClient } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commit, commits, options, type = 'single' } = body;

    if (!commit && !commits) {
      return NextResponse.json(
        { error: 'Either commit or commits array is required' },
        { status: 400 }
      );
    }

    if (!options || !options.repositoryName) {
      return NextResponse.json(
        { error: 'Repository name is required in options' },
        { status: 400 }
      );
    }

    const slackClient = new SlackNotificationClient();
    let result;

    if (type === 'batch' && commits) {
      result = await slackClient.sendBatchCommitNotification(commits, options);
    } else if (commit) {
      result = await slackClient.sendCommitNotification(commit, options);
    } else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Notification sent successfully' });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const slackClient = new SlackNotificationClient();
    const result = await slackClient.testConnection();

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Slack connection is working' });
    } else {
      return NextResponse.json(
        { error: result.error || 'Connection test failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slack connection test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}