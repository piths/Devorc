import { ChatMessage, CodeAnalysis, CodebaseContext, ChatError, OpenAIConfig, CodeReference } from '@/types/chat';

// Minimal types for OpenAI Chat Completions API responses we consume
type ChatCompletionMessage = {
  role: string;
  content: string | null;
};

type ChatCompletionChoice = {
  index: number;
  message: ChatCompletionMessage;
  finish_reason?: string | null;
};

type ChatCompletionResponse = {
  choices: ChatCompletionChoice[];
};

export class OpenAIApiClient {
  private config: OpenAIConfig;
  private retryCount = 0;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4o-mini',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not provided. AI features will be limited.');
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    context?: CodebaseContext
  ): Promise<{ content: string; codeReferences?: CodeReference[] }> {
    if (!this.config.apiKey) {
      return {
        content: 'OpenAI API key not configured. Please add your API key to enable AI features.',
        codeReferences: [],
      };
    }

    const systemMessage = this.buildSystemMessage(context);
    const apiMessages = this.formatMessagesForAPI(messages, systemMessage);

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        model: this.config.model,
        messages: apiMessages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false,
      });

      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      const content = response.choices[0]?.message?.content ?? 'No response generated';
      const codeReferences = this.extractCodeReferences(content, context);

      return { content, codeReferences };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async analyzeCode(code: string, filePath: string): Promise<CodeAnalysis> {
    const prompt = `Analyze the following code file and provide insights:

File: ${filePath}
Code:
\`\`\`
${code}
\`\`\`

Please provide:
1. A brief summary of what this code does
2. Technologies and frameworks used
3. Design patterns identified
4. Suggestions for improvement
5. Complexity assessment (low/medium/high)
6. Maintainability score (0-100)

Format your response as JSON with the following structure:
{
  "summary": "Brief description",
  "technologies": ["tech1", "tech2"],
  "patterns": ["pattern1", "pattern2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "complexity": "low|medium|high",
  "maintainability": 85
}`;

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: 'You are a code analysis expert. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content ?? '';
      return JSON.parse(content);
    } catch {
      // Fallback analysis if API fails
      return {
        summary: 'Code analysis unavailable',
        technologies: [],
        patterns: [],
        suggestions: ['Enable OpenAI API to get detailed analysis'],
        complexity: 'medium' as const,
        maintainability: 50,
      };
    }
  }

  async generateSuggestions(codebaseContext: CodebaseContext): Promise<string[]> {
    const prompt = `Based on the following codebase structure, provide 5 actionable suggestions for improvement:

Technologies: ${codebaseContext.analysis?.technologies.join(', ') || 'Unknown'}
File count: ${codebaseContext.files.length}
Complexity: ${codebaseContext.analysis?.complexity || 'Unknown'}

Structure:
${JSON.stringify(codebaseContext.structure, null, 2)}

Provide suggestions as a JSON array of strings.`;

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: 'You are a software architecture expert. Respond only with a JSON array of suggestion strings.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content ?? '';
      return JSON.parse(content);
    } catch {
      return [
        'Enable OpenAI API to get personalized suggestions',
        'Consider adding comprehensive tests',
        'Review code organization and structure',
        'Implement proper error handling',
        'Add documentation and comments'
      ];
    }
  }

  private async makeRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `https://api.openai.com/v1${endpoint}`;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        return await response.json() as T;
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // Should never reach here because loop either returns or throws, but
    // add a final throw to satisfy TypeScript's control flow analysis.
    throw new Error('OpenAI request failed after retries');
  }

  /**
   * Analyzes code with contextual insights
   */
  async analyzeCodeWithContext(
    code: string,
    filePath: string,
    context?: CodebaseContext
  ): Promise<CodeAnalysis> {
    const contextInfo = context ? this.buildContextSummary(context) : '';
    
    const prompt = `Analyze the following code file in the context of the broader codebase:

${contextInfo}

File: ${filePath}
Code:
\`\`\`
${code}
\`\`\`

Please provide a comprehensive analysis including:
1. Summary of the code's purpose and functionality
2. Technologies and frameworks used
3. Design patterns identified
4. Specific suggestions for improvement
5. Complexity assessment
6. Maintainability score
7. How this file relates to the broader codebase

When referencing specific lines or functions, use the format [filename:line] for code references.

Format your response as JSON with the following structure:
{
  "summary": "Detailed description",
  "technologies": ["tech1", "tech2"],
  "patterns": ["pattern1", "pattern2"],
  "suggestions": ["specific suggestion 1", "specific suggestion 2"],
  "complexity": "low|medium|high",
  "maintainability": 85,
  "codeReferences": [
    {
      "filePath": "path/to/file.js",
      "lineStart": 10,
      "lineEnd": 15,
      "content": "relevant code snippet",
      "language": "javascript"
    }
  ]
}`;

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: 'You are a senior code reviewer and architect. Provide detailed, actionable analysis. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content ?? '';
      const analysis = JSON.parse(content);
      
      return {
        summary: analysis.summary || 'Code analysis completed',
        technologies: analysis.technologies || [],
        patterns: analysis.patterns || [],
        suggestions: analysis.suggestions || [],
        complexity: analysis.complexity || 'medium',
        maintainability: analysis.maintainability || 50,
      };
    } catch (error) {
      console.warn('AI analysis failed:', error);
      // Fallback analysis
      return {
        summary: 'Code analysis unavailable - enable OpenAI API for detailed insights',
        technologies: [],
        patterns: [],
        suggestions: ['Enable OpenAI API to get detailed analysis'],
        complexity: 'medium' as const,
        maintainability: 50,
      };
    }
  }

  /**
   * Generates contextual suggestions based on query and codebase
   */
  async generateContextualResponse(
    query: string,
    context: CodebaseContext,
    relevantFiles?: string[]
  ): Promise<{ content: string; codeReferences: CodeReference[] }> {
    if (!this.config.apiKey) {
      return {
        content: 'OpenAI API is not configured. Please add your API key to get AI-powered insights about your codebase.',
        codeReferences: [],
      };
    }

    const contextSummary = this.buildContextSummary(context);
    const fileContext = relevantFiles ? this.buildFileContext(context, relevantFiles) : '';
    
    const prompt = `Based on the following codebase context, please answer the user's question with specific, actionable advice.

${contextSummary}

${fileContext}

User Question: ${query}

Please provide a helpful response that:
1. Directly addresses the user's question
2. References specific files and code when relevant
3. Provides actionable suggestions
4. Uses the format [filename:line] when referencing specific code locations

Be specific and practical in your advice.`;

    try {
      const response = await this.makeRequest<ChatCompletionResponse>('/chat/completions', {
        model: this.config.model,
        messages: [
          { role: 'system', content: 'You are an expert software developer and mentor. Provide specific, actionable advice with code references when relevant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content ?? 'No response generated';
      const codeReferences = this.extractCodeReferences(content, context);

      return { content, codeReferences };
    } catch (error) {
      console.warn('Contextual response failed:', error);
      return {
        content: 'I apologize, but I encountered an error while analyzing your codebase. Please try again or check your OpenAI API configuration.',
        codeReferences: [],
      };
    }
  }

  private buildSystemMessage(context?: CodebaseContext): string {
    let systemMessage = `You are an AI assistant specialized in helping developers with their code and projects. 
You provide helpful, accurate, and actionable advice about software development, code review, and best practices.

When referencing specific code, use the format [filename:line] to create code references that users can easily locate.`;

    if (context) {
      systemMessage += `\n\nCodebase Context:
- Technologies: ${context.analysis?.technologies.join(', ') || 'Unknown'}
- File count: ${context.files.length}
- Complexity: ${context.analysis?.complexity || 'Unknown'}
- Architecture patterns: ${context.analysis?.patterns.join(', ') || 'Unknown'}

You have access to the project structure and can reference specific files and code sections.`;
    }

    return systemMessage;
  }

  private buildContextSummary(context: CodebaseContext): string {
    const analysis = context.analysis;
    return `Codebase Overview:
- Files: ${context.files.length}
- Technologies: ${analysis?.technologies.join(', ') || 'Unknown'}
- Complexity: ${analysis?.complexity || 'Unknown'}
- Patterns: ${analysis?.patterns.join(', ') || 'Unknown'}
- Maintainability: ${analysis?.maintainability || 'Unknown'}/100`;
  }

  private buildFileContext(context: CodebaseContext, relevantFiles: string[]): string {
    const files = context.files.filter(f => relevantFiles.includes(f.path));
    
    return files.map(file => {
      const preview = file.content.slice(0, 500);
      return `File: ${file.path} (${file.language})
${preview}${file.content.length > 500 ? '...' : ''}`;
    }).join('\n\n');
  }

  private extractCodeReferences(content: string, context?: CodebaseContext): CodeReference[] {
    if (!context) return [];

    const references: CodeReference[] = [];
    const referencePattern = /\[([^:]+):(\d+)(?:-(\d+))?\]/g;
    let match;

    while ((match = referencePattern.exec(content)) !== null) {
      const [, filePath, startLine, endLine] = match;
      const file = context.files.find(f => f.path.includes(filePath) || filePath.includes(f.path));
      
      if (file) {
        const lineStart = parseInt(startLine, 10);
        const lineEnd = endLine ? parseInt(endLine, 10) : lineStart;
        const lines = file.content.split('\n');
        const relevantLines = lines.slice(lineStart - 1, lineEnd);
        
        references.push({
          filePath: file.path,
          lineStart,
          lineEnd: lineEnd > lineStart ? lineEnd : undefined,
          content: relevantLines.join('\n'),
          language: file.language,
        });
      }
    }

    return references;
  }

  private formatMessagesForAPI(messages: ChatMessage[], systemMessage: string) {
    const apiMessages = [
      { role: 'system', content: systemMessage }
    ];

    messages
      .filter(msg => msg.role !== 'system' && !msg.isTyping)
      .forEach(msg => {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      });

    return apiMessages;
  }

  private handleError(error: unknown): ChatError {
    const message = (() => {
      if (typeof error === 'string') return error;
      if (typeof error === 'object' && error !== null) {
        const maybe = error as { message?: unknown };
        if (typeof maybe.message === 'string') return maybe.message;
      }
      return '';
    })();

    const name = (() => {
      if (typeof error === 'object' && error !== null) {
        const maybe = error as { name?: unknown };
        if (typeof maybe.name === 'string') return maybe.name;
      }
      return '';
    })();

    if (message.includes('quota')) {
      return {
        type: 'quota',
        message: 'OpenAI API quota exceeded. Please check your usage.',
        retryable: false,
      };
    }

    if (message.includes('rate limit')) {
      return {
        type: 'api',
        message: 'Rate limit exceeded. Please try again later.',
        retryable: true,
        retryAfter: 60,
      };
    }

    if (message.includes('network') || name === 'TypeError') {
      return {
        type: 'network',
        message: 'Network error. Please check your connection.',
        retryable: true,
      };
    }

    return {
      type: 'unknown',
      message: message || 'An unexpected error occurred',
      retryable: true,
    };
  }
}
