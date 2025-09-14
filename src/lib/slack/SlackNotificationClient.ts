import { GitHubCommit } from '@/types/github';

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  accessory?: {
    type: string;
    text: {
      type: string;
      text: string;
    };
    url: string;
  };
}

export interface CommitNotificationOptions {
  repositoryName: string;
  repositoryUrl: string;
  branch?: string;
  includeFiles?: boolean;
  mentionUsers?: string[];
}

export class SlackNotificationClient {
  private webhookUrl: string | null = null;
  private botToken: string | null = null;
  private defaultChannel: string | null = null;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.botToken = process.env.SLACK_BOT_TOKEN || null;
    this.defaultChannel = process.env.SLACK_CHANNEL_ID || null;
  }

  /**
   * Send a commit notification to Slack
   */
  async sendCommitNotification(
    commit: GitHubCommit,
    options: CommitNotificationOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.formatCommitMessage(commit, options);
      
      if (this.webhookUrl) {
        return await this.sendWebhookMessage(message);
      } else if (this.botToken) {
        return await this.sendBotMessage(message);
      } else {
        throw new Error('No Slack configuration found. Please set SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send multiple commit notifications (for batch commits)
   */
  async sendBatchCommitNotification(
    commits: GitHubCommit[],
    options: CommitNotificationOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message = this.formatBatchCommitMessage(commits, options);
      
      if (this.webhookUrl) {
        return await this.sendWebhookMessage(message);
      } else if (this.botToken) {
        return await this.sendBotMessage(message);
      } else {
        throw new Error('No Slack configuration found');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format a single commit into a Slack message
   */
  private formatCommitMessage(commit: GitHubCommit, options: CommitNotificationOptions): SlackMessage {
    const commitDate = new Date(commit.commit.author.date);
    const shortSha = commit.sha.substring(0, 7);
    const authorName = commit.author?.login || commit.commit.author.name;
    const commitMessage = commit.commit.message.split('\n')[0]; // First line only
    
    // Create mention string if users are specified
    const mentions = options.mentionUsers?.map(user => `<@${user}>`).join(' ') || '';

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 New Commit in ${options.repositoryName}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Author:*\n${authorName}`
          },
          {
            type: 'mrkdwn',
            text: `*Commit:*\n\`${shortSha}\``
          },
          {
            type: 'mrkdwn',
            text: `*Branch:*\n${options.branch || 'main'}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${commitDate.toLocaleString()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${commitMessage}`
        }
      }
    ];

    // Add files changed if available and requested
    if (options.includeFiles && commit.files && commit.files.length > 0) {
      const filesList = commit.files
        .slice(0, 10) // Limit to first 10 files
        .map(file => {
          const status = this.getFileStatusEmoji(file.status);
          return `${status} \`${file.filename}\``;
        })
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Files Changed (${commit.files.length}):*\n${filesList}${
            commit.files.length > 10 ? `\n_...and ${commit.files.length - 10} more files_` : ''
          }`
        }
      });
    }

    // Add action button to view commit
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'View this commit on GitHub:'
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Commit'
        },
        url: commit.html_url
      }
    });

    return {
      text: `New commit in ${options.repositoryName}: ${commitMessage}`,
      blocks,
      username: 'GitHub Bot',
      icon_emoji: ':github:',
      ...(mentions && { text: `${mentions}\n${commitMessage}` })
    };
  }

  /**
   * Format multiple commits into a batch notification
   */
  private formatBatchCommitMessage(commits: GitHubCommit[], options: CommitNotificationOptions): SlackMessage {
    const mentions = options.mentionUsers?.map(user => `<@${user}>`).join(' ') || '';
    
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 ${commits.length} New Commits in ${options.repositoryName}`
        }
      }
    ];

    // Add summary section
    const authors = [...new Set(commits.map(c => c.author?.login || c.commit.author.name))];
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Commits:*\n${commits.length}`
        },
        {
          type: 'mrkdwn',
          text: `*Authors:*\n${authors.slice(0, 3).join(', ')}${authors.length > 3 ? ` +${authors.length - 3} more` : ''}`
        },
        {
          type: 'mrkdwn',
          text: `*Branch:*\n${options.branch || 'main'}`
        },
        {
          type: 'mrkdwn',
          text: `*Repository:*\n${options.repositoryName}`
        }
      ]
    });

    // Add recent commits (limit to 5)
    const recentCommits = commits.slice(0, 5);
    const commitsList = recentCommits.map(commit => {
      const shortSha = commit.sha.substring(0, 7);
      const authorName = commit.author?.login || commit.commit.author.name;
      const message = commit.commit.message.split('\n')[0];
      return `• \`${shortSha}\` ${message} - _${authorName}_`;
    }).join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recent Commits:*\n${commitsList}${
          commits.length > 5 ? `\n_...and ${commits.length - 5} more commits_` : ''
        }`
      }
    });

    // Add action button to view repository
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'View repository on GitHub:'
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Repository'
        },
        url: options.repositoryUrl
      }
    });

    return {
      text: `${commits.length} new commits in ${options.repositoryName}`,
      blocks,
      username: 'GitHub Bot',
      icon_emoji: ':github:',
      ...(mentions && { text: `${mentions}\n${commits.length} new commits in ${options.repositoryName}` })
    };
  }

  /**
   * Send message via webhook
   */
  private async sendWebhookMessage(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack webhook failed: ${response.status} ${errorText}`);
    }

    return { success: true };
  }

  /**
   * Send message via Bot API
   */
  private async sendBotMessage(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      throw new Error('Bot token not configured');
    }

    const payload = {
      ...message,
      channel: message.channel || this.defaultChannel,
    };

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return { success: true };
  }

  /**
   * Get emoji for file status
   */
  private getFileStatusEmoji(status: string): string {
    switch (status) {
      case 'added':
        return '🟢';
      case 'modified':
        return '🟡';
      case 'removed':
        return '🔴';
      case 'renamed':
        return '🔄';
      default:
        return '📄';
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessage: SlackMessage = {
        text: 'Test message from Devorch Suite',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ Slack integration is working correctly!'
            }
          }
        ],
        username: 'GitHub Bot',
        icon_emoji: ':white_check_mark:'
      };

      if (this.webhookUrl) {
        return await this.sendWebhookMessage(testMessage);
      } else if (this.botToken) {
        return await this.sendBotMessage(testMessage);
      } else {
        return {
          success: false,
          error: 'No Slack configuration found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}