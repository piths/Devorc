import { useState, useCallback } from 'react';
import { GitHubCommit } from '@/types/github';
import { CommitNotificationOptions } from '@/lib/slack';

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

  const sendCommitNotification = useCallback(async (
    commit: GitHubCommit,
    options: CommitNotificationOptions
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commit,
          options,
          type: 'single'
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setLastResult({ success: true, message: 'Commit notification sent successfully' });
        return true;
      } else {
        const errorMessage = result.error || 'Failed to send notification';
        setError(errorMessage);
        setLastResult({ success: false, message: errorMessage });
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

      const response = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commits,
          options,
          type: 'batch'
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setLastResult({ success: true, message: `Batch notification sent for ${commits.length} commits` });
        return true;
      } else {
        const errorMessage = result.error || 'Failed to send batch notification';
        setError(errorMessage);
        setLastResult({ success: false, message: errorMessage });
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

      // Use the API endpoint instead of direct client call
      const response = await fetch('/api/slack/notify', {
        method: 'GET',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setLastResult({ success: true, message: 'Slack connection test successful' });
        return true;
      } else {
        const errorMessage = result.error || 'Connection test failed';
        setError(errorMessage);
        setLastResult({ success: false, message: errorMessage });
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