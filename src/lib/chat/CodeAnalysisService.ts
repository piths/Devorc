import { CodeFile, CodebaseContext, CodeAnalysis, CodeReference } from '@/types/chat';
import { OpenAIApiClient } from '@/lib/openai/OpenAIApiClient';

export interface CodeInsight {
  type: 'suggestion' | 'warning' | 'info' | 'pattern';
  title: string;
  description: string;
  filePath: string;
  lineStart: number;
  lineEnd?: number;
  severity: 'low' | 'medium' | 'high';
  category: 'performance' | 'security' | 'maintainability' | 'best-practices' | 'architecture';
}

export interface StructureAnalysis {
  fileCount: number;
  totalLines: number;
  languages: Record<string, number>;
  directories: string[];
  entryPoints: string[];
  dependencies: string[];
  testFiles: string[];
  configFiles: string[];
  complexity: 'low' | 'medium' | 'high';
  architecture: string[];
}

export class CodeAnalysisService {
  private openaiClient: OpenAIApiClient;

  constructor(openaiClient?: OpenAIApiClient) {
    this.openaiClient = openaiClient || new OpenAIApiClient();
  }

  /**
   * Performs comprehensive codebase analysis
   */
  async analyzeCodebase(codebaseContext: CodebaseContext): Promise<CodeAnalysis> {
    try {
      const structureAnalysis = this.analyzeStructure(codebaseContext);
      const insights = await this.generateInsights(codebaseContext);
      
      // Use AI for deeper analysis if available
      const aiAnalysis = await this.performAIAnalysis(codebaseContext);
      
      return {
        summary: aiAnalysis.summary || this.generateFallbackSummary(structureAnalysis),
        technologies: aiAnalysis.technologies || this.detectTechnologies(codebaseContext),
        patterns: aiAnalysis.patterns || this.detectPatterns(codebaseContext),
        suggestions: aiAnalysis.suggestions || this.generateFallbackSuggestions(insights),
        complexity: structureAnalysis.complexity,
        maintainability: this.calculateMaintainability(structureAnalysis, insights),
      };
    } catch (error) {
      console.warn('AI analysis failed, using fallback analysis:', error);
      return this.generateFallbackAnalysis(codebaseContext);
    }
  }

  /**
   * Analyzes code structure without AI
   */
  analyzeStructure(codebaseContext: CodebaseContext): StructureAnalysis {
    const files = codebaseContext.files;
    const languages: Record<string, number> = {};
    const directories = new Set<string>();
    const entryPoints: string[] = [];
    const testFiles: string[] = [];
    const configFiles: string[] = [];
    let totalLines = 0;

    files.forEach(file => {
      // Count languages
      languages[file.language] = (languages[file.language] || 0) + 1;
      
      // Count lines
      totalLines += file.content.split('\n').length;
      
      // Extract directories
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (dir) directories.add(dir);
      
      // Identify file types
      const fileName = file.path.toLowerCase();
      
      if (this.isEntryPoint(fileName)) {
        entryPoints.push(file.path);
      }
      
      if (this.isTestFile(fileName)) {
        testFiles.push(file.path);
      }
      
      if (this.isConfigFile(fileName)) {
        configFiles.push(file.path);
      }
    });

    const complexity = this.calculateComplexity(files.length, totalLines, Object.keys(languages).length);
    const architecture = this.detectArchitecture(files);

    return {
      fileCount: files.length,
      totalLines,
      languages,
      directories: Array.from(directories),
      entryPoints,
      dependencies: this.extractDependencies(files),
      testFiles,
      configFiles,
      complexity,
      architecture,
    };
  }

  /**
   * Generates contextual insights about the codebase
   */
  async generateInsights(codebaseContext: CodebaseContext): Promise<CodeInsight[]> {
    const insights: CodeInsight[] = [];
    
    for (const file of codebaseContext.files) {
      const fileInsights = await this.analyzeFile(file);
      insights.push(...fileInsights);
    }
    
    return insights;
  }

  /**
   * Finds code references related to a query
   */
  findCodeReferences(query: string, codebaseContext: CodebaseContext): CodeReference[] {
    const references: CodeReference[] = [];
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    codebaseContext.files.forEach(file => {
      const lines = file.content.split('\n');
      
      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        
        // Check if line contains any search terms
        const hasMatch = searchTerms.some(term => 
          lowerLine.includes(term) || 
          this.fuzzyMatch(lowerLine, term)
        );
        
        if (hasMatch) {
          references.push({
            filePath: file.path,
            lineStart: index + 1,
            lineEnd: index + 1,
            content: line.trim(),
            language: file.language,
          });
        }
      });
    });
    
    // Sort by relevance and limit results
    return references
      .sort((a, b) => this.calculateRelevance(b, query) - this.calculateRelevance(a, query))
      .slice(0, 10);
  }

  /**
   * Generates contextual suggestions based on user query and codebase
   */
  async generateContextualSuggestions(
    query: string, 
    codebaseContext: CodebaseContext
  ): Promise<string[]> {
    try {
      const relevantFiles = this.findRelevantFiles(query, codebaseContext);
      this.buildContextForQuery(query, relevantFiles);
      
      return await this.openaiClient.generateSuggestions({
        ...codebaseContext,
        files: relevantFiles,
      });
    } catch (error) {
      console.warn('AI suggestions failed, using fallback:', error);
      return this.generateFallbackSuggestions(await this.generateInsights(codebaseContext));
    }
  }

  private async performAIAnalysis(
    codebaseContext: CodebaseContext
  ): Promise<Partial<CodeAnalysis>> {
    try {
      // Analyze a representative sample of files
      const sampleFiles = this.selectRepresentativeFiles(codebaseContext.files);
      const analyses = await Promise.all(
        sampleFiles.map(file => this.openaiClient.analyzeCode(file.content, file.path))
      );

      return {
        summary: this.combineSummaries(analyses),
        technologies: this.combineTechnologies(analyses),
        patterns: this.combinePatterns(analyses),
        suggestions: this.combineSuggestions(analyses),
      };
    } catch (error) {
      throw error;
    }
  }

  private async analyzeFile(file: CodeFile): Promise<CodeInsight[]> {
    const insights: CodeInsight[] = [];
    const lines = file.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Check for common issues
      if (this.hasSecurityIssue(trimmedLine)) {
        insights.push({
          type: 'warning',
          title: 'Potential Security Issue',
          description: 'This line may contain a security vulnerability',
          filePath: file.path,
          lineStart: lineNumber,
          severity: 'high',
          category: 'security',
        });
      }
      
      if (this.hasPerformanceIssue(trimmedLine)) {
        insights.push({
          type: 'suggestion',
          title: 'Performance Optimization',
          description: 'This code could be optimized for better performance',
          filePath: file.path,
          lineStart: lineNumber,
          severity: 'medium',
          category: 'performance',
        });
      }
      
      if (this.hasMaintainabilityIssue(trimmedLine)) {
        insights.push({
          type: 'info',
          title: 'Maintainability Concern',
          description: 'Consider refactoring for better maintainability',
          filePath: file.path,
          lineStart: lineNumber,
          severity: 'low',
          category: 'maintainability',
        });
      }
    });
    
    return insights;
  }

  private generateFallbackAnalysis(codebaseContext: CodebaseContext): CodeAnalysis {
    const structureAnalysis = this.analyzeStructure(codebaseContext);
    
    return {
      summary: this.generateFallbackSummary(structureAnalysis),
      technologies: this.detectTechnologies(codebaseContext),
      patterns: this.detectPatterns(codebaseContext),
      suggestions: [
        'Enable OpenAI API for detailed code analysis',
        'Consider adding comprehensive tests',
        'Review code organization and structure',
        'Implement proper error handling',
        'Add documentation and comments'
      ],
      complexity: structureAnalysis.complexity,
      maintainability: 50,
    };
  }

  private generateFallbackSummary(structureAnalysis: StructureAnalysis): string {
    const primaryLanguage = Object.entries(structureAnalysis.languages)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    return `This is a ${primaryLanguage} project with ${structureAnalysis.fileCount} files and approximately ${structureAnalysis.totalLines} lines of code. The project appears to have ${structureAnalysis.complexity} complexity.`;
  }

  private detectTechnologies(codebaseContext: CodebaseContext): string[] {
    const technologies = new Set<string>();
    
    codebaseContext.files.forEach(file => {
      const content = file.content.toLowerCase();
      const fileName = file.path.toLowerCase();
      
      // Framework detection
      if (content.includes('react') || fileName.includes('jsx') || fileName.includes('tsx')) {
        technologies.add('React');
      }
      if (content.includes('next') || fileName.includes('next.config')) {
        technologies.add('Next.js');
      }
      if (content.includes('vue')) {
        technologies.add('Vue.js');
      }
      if (content.includes('angular')) {
        technologies.add('Angular');
      }
      if (content.includes('express')) {
        technologies.add('Express.js');
      }
      if (content.includes('tailwind') || fileName.includes('tailwind')) {
        technologies.add('Tailwind CSS');
      }
      
      // Language detection
      if (file.language === 'typescript') {
        technologies.add('TypeScript');
      }
      if (file.language === 'javascript') {
        technologies.add('JavaScript');
      }
      if (file.language === 'python') {
        technologies.add('Python');
      }
    });
    
    return Array.from(technologies);
  }

  private detectPatterns(codebaseContext: CodebaseContext): string[] {
    const patterns = new Set<string>();
    
    codebaseContext.files.forEach(file => {
      const content = file.content;
      
      // Common patterns
      if (content.includes('useState') || content.includes('useEffect')) {
        patterns.add('React Hooks');
      }
      if (content.includes('class ') && content.includes('extends')) {
        patterns.add('Object-Oriented Programming');
      }
      if (content.includes('async') && content.includes('await')) {
        patterns.add('Async/Await');
      }
      if (content.includes('interface ') || content.includes('type ')) {
        patterns.add('Type Definitions');
      }
      if (content.includes('export') && content.includes('import')) {
        patterns.add('ES6 Modules');
      }
    });
    
    return Array.from(patterns);
  }

  private generateFallbackSuggestions(insights: CodeInsight[]): string[] {
    const suggestions = new Set<string>();
    
    // Add suggestions based on insights
    insights.forEach(insight => {
      switch (insight.category) {
        case 'security':
          suggestions.add('Review security practices and input validation');
          break;
        case 'performance':
          suggestions.add('Optimize performance-critical code sections');
          break;
        case 'maintainability':
          suggestions.add('Refactor complex functions for better readability');
          break;
      }
    });
    
    // Add general suggestions
    suggestions.add('Add comprehensive unit tests');
    suggestions.add('Implement proper error handling');
    suggestions.add('Add code documentation and comments');
    suggestions.add('Consider code splitting for better performance');
    suggestions.add('Review and update dependencies regularly');
    
    return Array.from(suggestions).slice(0, 5);
  }

  private calculateMaintainability(structureAnalysis: StructureAnalysis, insights: CodeInsight[]): number {
    let score = 100;
    
    // Deduct points for complexity
    if (structureAnalysis.complexity === 'high') score -= 30;
    else if (structureAnalysis.complexity === 'medium') score -= 15;
    
    // Deduct points for issues
    insights.forEach(insight => {
      switch (insight.severity) {
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });
    
    // Add points for good practices
    if (structureAnalysis.testFiles.length > 0) score += 10;
    if (structureAnalysis.configFiles.length > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateComplexity(fileCount: number, totalLines: number, languageCount: number): 'low' | 'medium' | 'high' {
    const complexityScore = (fileCount * 0.1) + (totalLines * 0.001) + (languageCount * 2);
    
    if (complexityScore > 50) return 'high';
    if (complexityScore > 20) return 'medium';
    return 'low';
  }

  private detectArchitecture(files: CodeFile[]): string[] {
    const architecture = new Set<string>();
    
    const hasComponents = files.some(f => f.path.includes('component'));
    const hasServices = files.some(f => f.path.includes('service') || f.path.includes('api'));
    const hasUtils = files.some(f => f.path.includes('util') || f.path.includes('helper'));
    const hasTypes = files.some(f => f.path.includes('type') || f.path.includes('interface'));
    
    if (hasComponents) architecture.add('Component-Based');
    if (hasServices) architecture.add('Service Layer');
    if (hasUtils) architecture.add('Utility Functions');
    if (hasTypes) architecture.add('Type-Safe');
    
    return Array.from(architecture);
  }

  private extractDependencies(files: CodeFile[]): string[] {
    const dependencies = new Set<string>();
    
    files.forEach(file => {
      const content = file.content;
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      
      if (importMatches) {
        importMatches.forEach(match => {
          const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
            dependencies.add(dep.split('/')[0]);
          }
        });
      }
    });
    
    return Array.from(dependencies).slice(0, 10);
  }

  private isEntryPoint(fileName: string): boolean {
    return ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts'].includes(fileName);
  }

  private isTestFile(fileName: string): boolean {
    return fileName.includes('.test.') || fileName.includes('.spec.') || fileName.includes('__tests__');
  }

  private isConfigFile(fileName: string): boolean {
    const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'next.config.js', 'tailwind.config.js'];
    return configFiles.some(config => fileName.includes(config));
  }

  private hasSecurityIssue(line: string): boolean {
    const securityPatterns = [
      /eval\s*\(/,
      /innerHTML\s*=/,
      /document\.write\s*\(/,
      /dangerouslySetInnerHTML/,
      /password.*=.*['"]/i,
      /api.*key.*=.*['"]/i,
    ];
    
    return securityPatterns.some(pattern => pattern.test(line));
  }

  private hasPerformanceIssue(line: string): boolean {
    const performancePatterns = [
      /for\s*\(.*\.length/,
      /while\s*\(.*\.length/,
      /document\.getElementById/,
      /querySelector.*\(/,
    ];
    
    return performancePatterns.some(pattern => pattern.test(line));
  }

  private hasMaintainabilityIssue(line: string): boolean {
    return line.length > 120 || (line.includes('//') && line.length > 80);
  }

  private fuzzyMatch(text: string, term: string): boolean {
    return text.includes(term) || this.levenshteinDistance(text, term) < 3;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateRelevance(reference: CodeReference, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const content = reference.content.toLowerCase();
    
    return queryTerms.reduce((score, term) => {
      if (content.includes(term)) score += 10;
      if (reference.filePath.toLowerCase().includes(term)) score += 5;
      return score;
    }, 0);
  }

  findRelevantFiles(query: string, codebaseContext: CodebaseContext): CodeFile[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return codebaseContext.files
      .map(file => ({
        file,
        relevance: this.calculateFileRelevance(file, queryTerms),
      }))
      .filter(({ relevance }) => relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(({ file }) => file);
  }

  private calculateFileRelevance(file: CodeFile, queryTerms: string[]): number {
    const content = file.content.toLowerCase();
    const path = file.path.toLowerCase();
    
    return queryTerms.reduce((score, term) => {
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      const pathMatches = path.includes(term) ? 5 : 0;
      return score + contentMatches + pathMatches;
    }, 0);
  }

  private buildContextForQuery(_query: string, files: CodeFile[]): string {
    return files.map(file => `File: ${file.path}\n${file.content.slice(0, 1000)}`).join('\n\n');
  }

  private selectRepresentativeFiles(files: CodeFile[]): CodeFile[] {
    // Select a mix of different file types and sizes
    const sorted = [...files].sort((a, b) => b.size - a.size);
    const selected = new Set<CodeFile>();
    
    // Add largest files
    selected.add(sorted[0]);
    if (sorted[1]) selected.add(sorted[1]);
    
    // Add files from different directories
    const directories = new Set<string>();
    files.forEach(file => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (dir && !directories.has(dir) && selected.size < 5) {
        directories.add(dir);
        selected.add(file);
      }
    });
    
    return Array.from(selected);
  }

  private combineSummaries(analyses: CodeAnalysis[]): string {
    return analyses.map(a => a.summary).join(' ');
  }

  private combineTechnologies(analyses: CodeAnalysis[]): string[] {
    return [...new Set(analyses.flatMap(a => a.technologies))];
  }

  private combinePatterns(analyses: CodeAnalysis[]): string[] {
    return [...new Set(analyses.flatMap(a => a.patterns))];
  }

  private combineSuggestions(analyses: CodeAnalysis[]): string[] {
    return [...new Set(analyses.flatMap(a => a.suggestions))];
  }
}