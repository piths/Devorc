'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Code2, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  FileText, 
  Layers,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { CodebaseContext } from '@/types/chat';
import { CodeAnalysisService, CodeInsight } from '@/lib/chat/CodeAnalysisService';
import { cn } from '@/lib/utils';

interface CodeInsightsPanelProps {
  codebaseContext?: CodebaseContext;
  onInsightClick?: (insight: CodeInsight) => void;
  className?: string;
}

export function CodeInsightsPanel({ 
  codebaseContext, 
  onInsightClick,
  className 
}: CodeInsightsPanelProps) {
  const [insights, setInsights] = useState<CodeInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisService] = useState(() => new CodeAnalysisService());

  const generateInsights = useCallback(async () => {
    if (!codebaseContext) return;

    setIsLoading(true);
    try {
      const newInsights = await analysisService.generateInsights(codebaseContext);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [codebaseContext, analysisService]);

  useEffect(() => {
    if (codebaseContext) {
      generateInsights();
    }
  }, [codebaseContext, generateInsights]);

  const getInsightIcon = (type: CodeInsight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'pattern': return <Layers className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: CodeInsight['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: CodeInsight['category']) => {
    switch (category) {
      case 'performance': return <TrendingUp className="w-3 h-3" />;
      case 'security': return <AlertTriangle className="w-3 h-3" />;
      case 'maintainability': return <Code2 className="w-3 h-3" />;
      case 'best-practices': return <Lightbulb className="w-3 h-3" />;
      case 'architecture': return <Layers className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, CodeInsight[]>);

  if (!codebaseContext) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Code Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Upload code files to see insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Code Insights
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={generateInsights}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">
              Insights ({insights.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              {/* Analysis Summary */}
              {codebaseContext.analysis && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Maintainability</span>
                      <span className="text-sm text-muted-foreground">
                        {codebaseContext.analysis.maintainability}/100
                      </span>
                    </div>
                    <Progress value={codebaseContext.analysis.maintainability} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-semibold">
                        {codebaseContext.files.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Files</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-semibold capitalize">
                        {codebaseContext.analysis.complexity}
                      </div>
                      <div className="text-xs text-muted-foreground">Complexity</div>
                    </div>
                  </div>

                  {/* Technologies */}
                  {codebaseContext.analysis.technologies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-1">
                        {codebaseContext.analysis.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patterns */}
                  {codebaseContext.analysis.patterns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Patterns</h4>
                      <div className="flex flex-wrap gap-1">
                        {codebaseContext.analysis.patterns.map((pattern, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1">
            <ScrollArea className="h-full px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No insights available</p>
                  <p className="text-xs">Try refreshing or upload more code</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2 capitalize">
                        {getCategoryIcon(category as CodeInsight['category'])}
                        {category.replace('-', ' ')} ({categoryInsights.length})
                      </h4>
                      <div className="space-y-2">
                        {categoryInsights.map((insight, index) => (
                          <div
                            key={index}
                            className={cn(
                              'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                              getSeverityColor(insight.severity)
                            )}
                            onClick={() => onInsightClick?.(insight)}
                          >
                            <div className="flex items-start gap-2">
                              {getInsightIcon(insight.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-medium truncate">
                                    {insight.title}
                                  </h5>
                                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {insight.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {insight.filePath.split('/').pop()}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    Line {insight.lineStart}
                                    {insight.lineEnd && insight.lineEnd > insight.lineStart && 
                                      `-${insight.lineEnd}`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}