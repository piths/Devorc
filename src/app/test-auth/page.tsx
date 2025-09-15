'use client';

import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Github, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EnvStatus {
  hasClientId: boolean;
  hasClientSecret: boolean;
  clientId: string;
  clientSecretLength: number;
}

export default function TestAuthPage() {
  const { 
    isAuthenticated, 
    user, 
    connection, 
    isLoading, 
    error, 
    login, 
    logout 
  } = useGitHubAuth();

  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [envLoading, setEnvLoading] = useState(true);

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const response = await fetch('/api/debug/env');
        const data = await response.json();
        setEnvStatus(data);
      } catch (error) {
        console.error('Failed to check environment:', error);
      } finally {
        setEnvLoading(false);
      }
    };
    
    checkEnv();
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  
  // Debug logging
  console.log('Environment check:', {
    clientId: !!clientId,
    allEnv: Object.keys(process.env).filter(key => key.includes('GITHUB')),
    serverEnv: envStatus
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">GitHub Authentication Test</h1>
          <p className="text-muted-foreground">
            Debug page to test GitHub OAuth configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Configuration Status
              </CardTitle>
              <CardDescription>
                Check if GitHub OAuth is properly configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {envLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm">Checking configuration...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span>Client ID:</span>
                    <Badge variant={envStatus?.hasClientId ? "default" : "destructive"}>
                      {envStatus?.hasClientId ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client Secret:</span>
                    <Badge variant={envStatus?.hasClientSecret ? "default" : "destructive"}>
                      {envStatus?.hasClientSecret ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                  {envStatus?.clientId && (
                    <div className="text-xs text-muted-foreground break-all">
                      ID: {envStatus.clientId}
                    </div>
                  )}
                  {envStatus?.clientSecretLength && envStatus.clientSecretLength > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Secret: {envStatus.clientSecretLength} characters
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                Authentication Status
              </CardTitle>
              <CardDescription>
                Current authentication state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Loading:</span>
                <Badge variant={isLoading ? "default" : "outline"}>
                  {isLoading ? "Yes" : "No"}
                </Badge>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        {isAuthenticated && user && (
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Details from authenticated GitHub user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <p className="text-sm text-muted-foreground">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Username:</span>
                  <p className="text-sm text-muted-foreground">@{user.login}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Email:</span>
                  <p className="text-sm text-muted-foreground">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">ID:</span>
                  <p className="text-sm text-muted-foreground">{user.id}</p>
                </div>
              </div>
              {connection && (
                <div>
                  <span className="text-sm font-medium">Scopes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {connection.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Test authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Button onClick={login} className="w-full" disabled={!envStatus?.hasClientId || isLoading}>
                  <Github className="mr-2 h-4 w-4" />
                  {isLoading ? "Authenticating..." : "Sign in with GitHub"}
                </Button>
                {error && error.includes('expired') && (
                  <Button onClick={login} variant="outline" className="w-full" size="sm">
                    <Github className="mr-2 h-3 w-3" />
                    Retry Authentication
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={logout} variant="outline" className="w-full">
                Sign Out
              </Button>
            )}
            
            {!envStatus?.hasClientId && !envLoading && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      GitHub OAuth not configured
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please set up a GitHub OAuth app and update your environment variables.
                      See the setup guide for instructions.
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-yellow-800 hover:text-yellow-900"
                      onClick={() => window.open('https://github.com/settings/developers', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open GitHub Developer Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              How to configure GitHub OAuth for this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Developer Settings</a></li>
              <li>Click &quot;New OAuth App&quot;</li>
              <li>Set Application name: &quot;Devorc Suite&quot;</li>
              <li>Set Homepage URL: &quot;http://localhost:3001&quot; <span className="text-yellow-600">(note: port 3001)</span></li>
              <li>Set Authorization callback URL: &quot;http://localhost:3001/auth/github/callback&quot; <span className="text-yellow-600">(note: port 3001)</span></li>
              <li>Click &quot;Register application&quot;</li>
              <li>Copy the Client ID and generate a Client Secret</li>
              <li>Update your <code className="bg-muted px-1 rounded">.env.local</code> file with the new credentials</li>
              <li>Restart your development server</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}