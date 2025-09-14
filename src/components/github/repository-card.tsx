'use client';

import React from 'react';
import { GitHubRepository } from '@/types/github';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  GitFork, 
  Eye, 
  Calendar,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RepositoryCardProps {
  repository: GitHubRepository;
  onClick: () => void;
  className?: string;
}

export function RepositoryCard({ repository, onClick, className }: RepositoryCardProps) {
  const updatedAt = new Date(repository.updated_at);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(repository.html_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className={`cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold truncate">
                  {repository.name}
                </h3>
                <div className="flex items-center gap-1">
                  {repository.private ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge variant={repository.private ? 'secondary' : 'outline'} className="text-xs">
                    {repository.private ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">
                {repository.full_name}
              </p>
              
              {repository.description && (
                <p className="text-sm text-foreground line-clamp-2">
                  {repository.description}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExternalClick}
              className="ml-2 flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {repository.language && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: getLanguageColor(repository.language) 
                    }}
                  />
                  <span>{repository.language}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{repository.stargazers_count.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                <span>{repository.forks_count.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Updated {timeAgo}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get language colors (simplified version)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#239120',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Dart': '#00B4AB',
    'HTML': '#e34c26',
    'CSS': '#1572B6',
    'Shell': '#89e051',
    'Vue': '#2c3e50',
    'React': '#61dafb',
  };
  
  return colors[language] || '#6b7280';
}