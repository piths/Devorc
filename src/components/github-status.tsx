"use client"

import * as React from "react"
import { useGitHubAuth } from "@/contexts/GitHubAuthContext"
import { GitHubRepository } from "@/types/github"
import {
  IconBrandGithub,
  IconCheck,
  IconExclamationCircle,
  IconLoader2,
  IconStar,
  IconGitFork,
  IconEye,
  IconAlertTriangle,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface GitHubStatusProps {
  className?: string
}

/**
 * Component to display GitHub connection status and user profile
 */
export function GitHubStatus({ className }: GitHubStatusProps) {
  const { isAuthenticated, user, connection, error, isLoading } = useGitHubAuth()

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandGithub className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandGithub className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <IconExclamationCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandGithub className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to access repositories and manage projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconAlertTriangle className="h-4 w-4" />
            <span className="text-sm">Not connected</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBrandGithub className="h-5 w-5" />
          GitHub Integration
          <Badge variant="secondary" className="ml-auto">
            <IconCheck className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </CardTitle>
        <CardDescription>
          Connected as {user.login}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.name || user.login} />
            <AvatarFallback>
              {(user.name || user.login).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.name || user.login}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email || `@${user.login}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`https://github.com/${user.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <IconEye className="h-3 w-3" />
              View Profile
            </a>
          </Button>
        </div>
        
        {connection?.scopes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {connection.scopes.map((scope) => (
                <Badge key={scope} variant="outline" className="text-xs">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface GitHubRepositoriesProps {
  className?: string
}

/**
 * Component to display user's GitHub repositories
 */
export function GitHubRepositories({ className }: GitHubRepositoriesProps) {
  const { isAuthenticated, apiClient, error } = useGitHubAuth()
  const [repositories, setRepositories] = React.useState<GitHubRepository[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [repoError, setRepoError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isAuthenticated && apiClient) {
      loadRepositories()
    }
  }, [isAuthenticated, apiClient]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRepositories = async () => {
    if (!apiClient) return

    try {
      setIsLoading(true)
      setRepoError(null)
      
      const repos = await apiClient.getRepositories({
        sort: 'updated',
        direction: 'desc',
        per_page: 10,
      })
      
      setRepositories(repos)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load repositories'
      setRepoError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Connect to GitHub to view your repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <IconBrandGithub className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">GitHub connection required</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || repoError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <IconExclamationCircle className="h-4 w-4" />
            <span className="text-sm">{repoError || error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRepositories}
            className="mt-3"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Loading your GitHub repositories...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
        <CardDescription>
          Your recent GitHub repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {repositories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <IconBrandGithub className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No repositories found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {repo.name}
                    </h4>
                    {repo.private && (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <IconStar className="h-3 w-3" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconGitFork className="h-3 w-3" />
                      {repo.forks_count}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <IconEye className="h-3 w-3" />
                    View
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {repositories.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              className="w-full"
            >
              Refresh Repositories
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}