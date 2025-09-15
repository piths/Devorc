export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  codeReferences?: CodeReference[];
  isTyping?: boolean;
}

export interface CodeReference {
  filePath: string;
  lineStart: number;
  lineEnd?: number;
  content: string;
  language: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  codebaseContext?: CodebaseContext;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CodebaseContext {
  files: CodeFile[];
  structure: ProjectStructure;
  repository?: {
    name: string;
    full_name: string;
    default_branch: string;
  };
  analysis?: CodeAnalysis;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date | string;
}

export interface ProjectStructure {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: ProjectStructure[];
  size?: number;
  language?: string;
}

export interface CodeAnalysis {
  summary: string;
  technologies: string[];
  patterns: string[];
  suggestions: string[];
  complexity: 'low' | 'medium' | 'high';
  maintainability: number; // 0-100 score
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

export interface ChatError {
  type: 'network' | 'api' | 'validation' | 'quota' | 'unknown';
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface FileUploadResult {
  success: boolean;
  files: CodeFile[];
  error?: string;
}

export interface TypingIndicator {
  isVisible: boolean;
  message?: string;
}

export interface CurrentFileContext {
  repository: {
    name: string;
    full_name: string;
    default_branch: string;
  };
  filePath: string;
  content: string;
  language: string;
  size: number;
}