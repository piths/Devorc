import React from 'react';
import { render, screen } from '@testing-library/react';
import { CanvasPage } from '../canvas-page';

// Mock Konva components since they require canvas context
jest.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Text: () => <div data-testid="konva-text" />,
  Transformer: () => <div data-testid="konva-transformer" />,
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

describe('CanvasPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render canvas page with toolbar and properties panel', () => {
    render(<CanvasPage />);

    // Check if main components are rendered
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    
    // Check if toolbar tools are present
    expect(screen.getByTitle('Select')).toBeInTheDocument();
    expect(screen.getByTitle('Text')).toBeInTheDocument();
    expect(screen.getByTitle('Rectangle')).toBeInTheDocument();
    expect(screen.getByTitle('Circle')).toBeInTheDocument();
  });

  it('should show properties panel message when no element is selected', () => {
    render(<CanvasPage />);

    expect(screen.getByText('Select an element to edit properties')).toBeInTheDocument();
  });
});