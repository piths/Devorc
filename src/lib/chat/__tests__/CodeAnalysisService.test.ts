import { CodeAnalysisService } from '../CodeAnalysisService';
import { CodebaseContext, CodeFile } from '@/types/chat';

describe('CodeAnalysisService', () => {
  let service: CodeAnalysisService;
  let mockCodebaseContext: CodebaseContext;

  beforeEach(() => {
    service = new CodeAnalysisService();
    
    const mockFiles: CodeFile[] = [
      {
        path: 'src/components/Button.tsx',
        content: `import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};`,
        language: 'typescript',
        size: 300,
        lastModified: new Date(),
      },
      {
        path: 'src/utils/helpers.js',
        content: `export function formatDate(date) {
  return date.toLocaleDateString();
}

export function validateEmail(email) {
  return email.includes('@');
}`,
        language: 'javascript',
        size: 150,
        lastModified: new Date(),
      },
    ];

    mockCodebaseContext = {
      files: mockFiles,
      structure: {
        name: 'project',
        type: 'directory',
        path: '/',
        children: [],
      },
    };
  });

  describe('analyzeStructure', () => {
    it('should analyze codebase structure correctly', () => {
      const analysis = service.analyzeStructure(mockCodebaseContext);

      expect(analysis.fileCount).toBe(2);
      expect(analysis.languages).toEqual({
        typescript: 1,
        javascript: 1,
      });
      expect(analysis.complexity).toBeDefined();
      expect(analysis.architecture).toBeInstanceOf(Array);
    });
  });

  describe('findCodeReferences', () => {
    it('should find relevant code references', () => {
      const references = service.findCodeReferences('button', mockCodebaseContext);

      expect(references).toBeInstanceOf(Array);
      expect(references.length).toBeGreaterThan(0);
      
      const buttonRef = references.find(ref => ref.content.toLowerCase().includes('button'));
      expect(buttonRef).toBeDefined();
      expect(buttonRef?.filePath).toBe('src/components/Button.tsx');
    });

    it('should return empty array for non-existent terms', () => {
      const references = service.findCodeReferences('nonexistent', mockCodebaseContext);
      expect(references).toEqual([]);
    });
  });

  describe('generateInsights', () => {
    it('should generate code insights', async () => {
      const insights = await service.generateInsights(mockCodebaseContext);

      expect(insights).toBeInstanceOf(Array);
      // Insights might be empty if no issues are detected, which is fine
    });
  });

  describe('analyzeCodebase', () => {
    it('should perform comprehensive analysis with fallback', async () => {
      // This test should use fallback analysis since no API key is provided
      const analysis = await service.analyzeCodebase(mockCodebaseContext);

      expect(analysis).toBeDefined();
      expect(analysis.summary).toBeDefined();
      expect(analysis.technologies).toBeInstanceOf(Array);
      expect(analysis.patterns).toBeInstanceOf(Array);
      expect(analysis.suggestions).toBeInstanceOf(Array);
      expect(['low', 'medium', 'high']).toContain(analysis.complexity);
      expect(analysis.maintainability).toBeGreaterThanOrEqual(0);
      expect(analysis.maintainability).toBeLessThanOrEqual(100);
      
      // Should contain fallback suggestions when API is not available
      expect(analysis.suggestions).toContain('Enable OpenAI API to get detailed analysis');
    }, 10000); // Increase timeout for potential API calls
  });

  describe('detectTechnologies', () => {
    it('should detect React and TypeScript', () => {
      const technologies = service['detectTechnologies'](mockCodebaseContext);
      
      expect(technologies).toContain('React');
      expect(technologies).toContain('TypeScript');
      expect(technologies).toContain('JavaScript');
    });
  });

  describe('detectPatterns', () => {
    it('should detect common patterns', () => {
      const patterns = service['detectPatterns'](mockCodebaseContext);
      
      expect(patterns).toContain('Type Definitions');
      expect(patterns).toContain('ES6 Modules');
    });
  });
});