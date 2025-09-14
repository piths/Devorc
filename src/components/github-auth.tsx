'use client';

import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Github, LogOut, User, Clock } from 'lucide-react';

export function GitHubAuth() {
  const { 
    isAuthenticated, 
    user, 
    connection, 
    isLoading, 
    error, 
    login, 
    logout 
  } = useGitHubAuth();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={login} className="w-full">
            <Github className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect to GitHub</CardTitle>
          <CardDescription>
            Sign in with your GitHub account to access repositories, issues, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} className="w-full">
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Connected
        </CardTitle>
        <CardDescription>
          You are successfully connected to GitHub.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl} alt={user.name || user.login} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || user.login}</p>
              <p className="text-sm text-muted-foreground truncate">@{user.login}</p>
            </div>
          </div>
        )}

        {connection && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="text-muted-foreground">Scopes:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {connection.scopes.map((scope) => (
                <Badge key={scope} variant="secondary" className="text-xs">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={logout} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}