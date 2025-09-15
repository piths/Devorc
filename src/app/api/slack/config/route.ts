import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasWebhook = !!process.env.SLACK_WEBHOOK_URL;
    const hasBotToken = !!process.env.SLACK_BOT_TOKEN;
    const hasChannel = !!process.env.SLACK_CHANNEL_ID;

    return NextResponse.json({
      configured: hasWebhook || hasBotToken,
      webhook: hasWebhook,
      botToken: hasBotToken,
      channel: hasChannel,
      method: hasWebhook ? 'webhook' : hasBotToken ? 'bot' : 'none'
    });
  } catch (error) {
    console.error('Slack config check error:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}