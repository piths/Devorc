'use client';

import React, { useState } from 'react';
import { GitHubCommit } from '@/types/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Users,
  Settings,
  Bell
} from 'lucide-react';
import { useSlackNotifications } from '@/hooks/useSlackNotifications';
import { useToast } from '@/hooks/use-toast';

interface SlackNotificationPanelProps {
  commit?: GitHubCommit;
  commits?: GitHubCommit[];
  repositoryName: string;
  repositoryUrl: string;
  branch?: string;
  className?: string;
}

export function SlackNotificationPanel({
  commit,
  commits,
  repositoryName,
  repositoryUrl,
  branch = 'main',
  className
}: SlackNotificationPanelProps) {
  const { toast } = useToast();
  const {
    sendCommitNotification,
    sendBatchCommitNotification,
    testConnection,
    isLoading,
    error,
    lastResult
  } = useSlackNotifications();

  // Form state
  const [includeFiles, setIncludeFiles] = useState(true);
  const [mentionUsers, setMentionUsers] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [autoNotify, setAutoNotify] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean;
    webhook: boolean;
    botToken: boolean;
    method: string;
  } | null>(null);

  // Load configuration status
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/slack/config');
        if (response.ok) {
          const config = await response.json();
          setConfigStatus(config);
        }
      } catch (error) {
        console.error('Failed to load Slack config:', error);
      }
    };
    loadConfig();
  }, []);

  const handleSendNotification = async () => {
    const options = {
      repositoryName,
      repositoryUrl,
      branch,
      includeFiles,
      mentionUsers: mentionUsers.split(',').map(u => u.trim()).filter(Boolean)
    };

    let success = false;

    if (commits && commits.length > 1) {
      success = await sendBatchCommitNotification(commits, options);
    } else if (commit) {
      success = await sendCommitNotification(commit, options);
    } else {
      toast({
        title: "No commits to notify",
        description: "Please provide commit data to send notifications",
        variant: "destructive",
      });
      return;
    }

    if (success) {
      toast({
        title: "Notification sent",
        description: "Slack notification has been sent successfully",
      });
    } else {
      toast({
        title: "Failed to send notification",
        description: error || "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    const success = await testConnection();
    
    if (success) {
      toast({
        title: "Connection successful",
        description: "Slack integration is working correctly",
      });
    } else {
      toast({
        title: "Connection failed",
        description: error || "Unable to connect to Slack",
        variant: "destructive",
      });
    }
  };

  const getCommitSummary = () => {
    if (commits && commits.length > 1) {
      return `${commits.length} commits`;
    } else if (commit) {
      const shortSha = commit.sha.substring(0, 7);
      const message = commit.commit.message.split('\n')[0];
      return `${shortSha}: ${message}`;
    }
    return 'No commits selected';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Slack Notifications
        </CardTitle>
        <CardDescription>
          Send commit notifications to your Slack workspace
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Commit Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Commit Summary</Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{getCommitSummary()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Repository: {repositoryName} • Branch: {branch}
            </p>
          </div>
        </div>

        <Separator />

        {/* Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Notification Settings</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Include file changes</Label>
                <p className="text-xs text-muted-foreground">
                  Show which files were modified in the notification
                </p>
              </div>
              <Switch
                checked={includeFiles}
                onCheckedChange={setIncludeFiles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mention-users" className="text-sm">
                Mention Users (optional)
              </Label>
              <Input
                id="mention-users"
                placeholder="username1, username2"
                value={mentionUsers}
                onChange={(e) => setMentionUsers(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of Slack usernames to mention
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message" className="text-sm">
                Custom Message (optional)
              </Label>
              <Textarea
                id="custom-message"
                placeholder="Add a custom message to the notification..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto-notify on commits</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically send notifications for new commits
                </p>
              </div>
              <Switch
                checked={autoNotify}
                onCheckedChange={setAutoNotify}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Status Display */}
        {lastResult && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Result</Label>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${
              lastResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{lastResult.message}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSendNotification}
            disabled={isLoading || (!commit && !commits)}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Notification
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test
          </Button>
        </div>

        {/* Configuration Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Configuration Status</Label>
          <div className="flex flex-wrap gap-2">
            {configStatus ? (
              <>
                <Badge variant={configStatus.webhook ? 'default' : 'secondary'}>
                  Webhook: {configStatus.webhook ? 'Configured' : 'Not Set'}
                </Badge>
                <Badge variant={configStatus.botToken ? 'default' : 'secondary'}>
                  Bot Token: {configStatus.botToken ? 'Configured' : 'Not Set'}
                </Badge>
                <Badge variant={configStatus.configured ? 'default' : 'destructive'}>
                  Status: {configStatus.configured ? `Ready (${configStatus.method})` : 'Not Configured'}
                </Badge>
              </>
            ) : (
              <Badge variant="secondary">Loading...</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {configStatus?.configured 
              ? `Using ${configStatus.method} method for Slack integration`
              : 'Configure Slack integration in your environment variables'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}