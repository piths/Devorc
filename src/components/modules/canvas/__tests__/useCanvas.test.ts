import { renderHook, act } from '@testing-library/react';
import { useCanvas } from '@/hooks/useCanvas';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

describe('useCanvas', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with empty project', () => {
    const { result } = renderHook(() => useCanvas());

    expect(result.current.project).toBeTruthy();
    expect(result.current.project?.elements).toEqual([]);
    expect(result.current.selectedElements).toEqual([]);
    expect(result.current.tool).toBe('select');
  });

  it('should create a new element', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.createElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 50 },
      });
    });

    expect(result.current.project?.elements).toHaveLength(1);
    expect(result.current.project?.elements[0].type).toBe('rectangle');
    expect(result.current.project?.elements[0].position).toEqual({ x: 100, y: 100 });
  });

  it('should update an element', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.createElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
      });
    });

    const elementId = result.current.project!.elements[0].id;

    act(() => {
      result.current.updateElement(elementId, {
        position: { x: 200, y: 200 },
      });
    });

    expect(result.current.project?.elements[0].position).toEqual({ x: 200, y: 200 });
  });

  it('should delete an element', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.createElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
      });
    });

    const elementId = result.current.project!.elements[0].id;

    act(() => {
      result.current.deleteElement(elementId);
    });

    expect(result.current.project?.elements).toHaveLength(0);
  });

  it('should select and clear selection', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.createElement({
        type: 'rectangle',
        position: { x: 100, y: 100 },
      });
    });

    const elementId = result.current.project!.elements[0].id;

    act(() => {
      result.current.selectElement(elementId);
    });

    expect(result.current.selectedElements).toEqual([elementId]);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedElements).toEqual([]);
  });

  it('should change tools', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.setTool('rectangle');
    });

    expect(result.current.tool).toBe('rectangle');
  });

  it('should update viewport', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.updateViewport({ zoom: 2, x: 100, y: 50 });
    });

    expect(result.current.viewport.zoom).toBe(2);
    expect(result.current.viewport.x).toBe(100);
    expect(result.current.viewport.y).toBe(50);
  });
});