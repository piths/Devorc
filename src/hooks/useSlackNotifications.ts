import { useState, useCallback } from 'react';
import { GitHubCommit } from '@/types/github';
import { SlackNotificationClient, CommitNotificationOptions } from '@/lib/slack';

interface UseSlackNotificationsReturn {
  sendCommitNotification: (commit: GitHubCommit, options: CommitNotificationOptions) => Promise<boolean>;
  sendBatchCommitNotification: (commits: GitHubCommit[], options: CommitNotificationOptions) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  lastResult: { success: boolean; message?: string } | null;
}

export function useSlackNotifications(): UseSlackNotificationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ success: boolean; message?: string } | null>(null);

  const slackClient = new SlackNotificationClient();

  const sendCommitNotification = useCallback(async (
    commit: GitHubCommit,
    options: CommitNotificationOptions
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await slackClient.sendCommitNotification(commit, options);
      
      if (result.success) {
        setLastResult({ success: true, message: 'Commit notification sent successfully' });
        return true;
      } else {
        setError(result.error || 'Failed to send notification');
        setLastResult({ success: false, message: result.error });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLastResult({ success: false, message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendBatchCommitNotification = useCallback(async (
    commits: GitHubCommit[],
    options: CommitNotificationOptions
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await slackClient.sendBatchCommitNotification(commits, options);
      
      if (result.success) {
        setLastResult({ success: true, message: `Batch notification sent for ${commits.length} commits` });
        return true;
      } else {
        setError(result.error || 'Failed to send batch notification');
        setLastResult({ success: false, message: result.error });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLastResult({ success: false, message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await slackClient.testConnection();
      
      if (result.success) {
        setLastResult({ success: true, message: 'Slack connection test successful' });
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        setLastResult({ success: false, message: result.error });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      setLastResult({ success: false, message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendCommitNotification,
    sendBatchCommitNotification,
    testConnection,
    isLoading,
    error,
    lastResult
  };
}