import { useState, useCallback } from 'react';
import Konva from 'konva';
import { CanvasState, CanvasActions, CanvasViewport } from '@/types/canvas';
import { CanvasElement, CanvasProject } from '@/types/storage';

const initialViewport: CanvasViewport = {
  x: 0,
  y: 0,
  zoom: 1,
  width: 800,
  height: 600,
};

const createEmptyProject = (): CanvasProject => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  description: '',
  elements: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useCanvas = (): CanvasState & CanvasActions => {
  const [project, setProject] = useState<CanvasProject | null>(createEmptyProject());
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [tool, setTool] = useState<CanvasState['tool']>('select');
  const [viewport, setViewport] = useState<CanvasViewport>(initialViewport);
  const [isDragging] = useState(false);
  const [isDrawing] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isGrouping] = useState(false);
  const [isMultiSelecting] = useState(false);

  const createElement = useCallback((elementData: Partial<CanvasElement>) => {
    if (!project) return;

    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: elementData.type || 'rectangle',
      position: elementData.position || { x: 100, y: 100 },
      size: elementData.size || { width: 100, height: 100 },
      rotation: elementData.rotation || 0,
      style: {
        fill: '#6366f1',
        stroke: '#4f46e5',
        strokeWidth: 2,
        opacity: 1,
        ...elementData.style,
      },
      data: elementData.data || {} as Record<string, unknown>,
      connections: elementData.connections || [],

    };

    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: [...prev.elements, newElement],
        updatedAt: new Date(),
      };
    });
  }, [project]);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!project) return;

    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map(element =>
          element.id === elementId
            ? { ...element, ...updates }
            : element
        ),
        updatedAt: new Date(),
      };
    });
  }, [project]);

  const deleteElement = useCallback((elementId: string) => {
    if (!project) return;

    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.filter(element => element.id !== elementId),
        updatedAt: new Date(),
      };
    });

    setSelectedElements(prev => prev.filter(id => id !== elementId));
  }, [project]);

  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedElements(prev => 
        prev.includes(elementId)
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElements([]);
  }, []);

  const updateViewport = useCallback((viewportUpdates: Partial<CanvasViewport>) => {
    setViewport(prev => ({ ...prev, ...viewportUpdates }));
  }, []);

  const saveProject = useCallback(() => {
    if (!project) return;
    
    // Save to localStorage for now
    const savedProjects = JSON.parse(localStorage.getItem('canvas-projects') || '[]');
    const existingIndex = savedProjects.findIndex((p: CanvasProject) => p.id === project.id);
    
    if (existingIndex >= 0) {
      savedProjects[existingIndex] = project;
    } else {
      savedProjects.push(project);
    }
    
    localStorage.setItem('canvas-projects', JSON.stringify(savedProjects));
  }, [project]);

  const loadProject = useCallback((projectId: string) => {
    const savedProjects = JSON.parse(localStorage.getItem('canvas-projects') || '[]');
    const projectToLoad = savedProjects.find((p: CanvasProject) => p.id === projectId);
    
    if (projectToLoad) {
      setProject(projectToLoad);
      setSelectedElements([]);
      setViewport(prev => ({ ...prev, ...projectToLoad.viewport }));
    }
  }, []);

  const createConnection = useCallback((fromElementId: string, toElementId: string) => {
    if (!project || fromElementId === toElementId) return;

    const fromElement = project.elements.find(el => el.id === fromElementId);
    const toElement = project.elements.find(el => el.id === toElementId);
    
    if (!fromElement || !toElement) return;

    // Check if connection already exists
    const existingConnection = fromElement.connections.find(
      conn => conn.targetElementId === toElementId
    );
    
    if (existingConnection) return;

    const newConnection = {
      id: crypto.randomUUID(),
      targetElementId: toElementId,
      type: 'arrow' as const,
      style: {
        stroke: '#6366f1',
        strokeWidth: 2,
        fill: '#6366f1',
      },
    };

    updateElement(fromElementId, {
      connections: [...fromElement.connections, newConnection],
    });
  }, [project, updateElement]);

  const removeConnection = useCallback((fromElementId: string, connectionId: string) => {
    if (!project) return;

    const element = project.elements.find(el => el.id === fromElementId);
    if (!element) return;

    updateElement(fromElementId, {
      connections: element.connections.filter(conn => conn.id !== connectionId),
    });
  }, [project, updateElement]);

  const startConnection = useCallback((elementId: string) => {
    setConnectionStart(elementId);
  }, []);

  const finishConnection = useCallback((elementId: string) => {
    if (connectionStart && connectionStart !== elementId) {
      createConnection(connectionStart, elementId);
    }
    setConnectionStart(null);
  }, [connectionStart, createConnection]);

  const cancelConnection = useCallback(() => {
    setConnectionStart(null);
  }, []);

  const exportCanvas = useCallback((format: 'png' | 'svg', stageRef: React.RefObject<Konva.Stage>) => {
    if (!stageRef.current || !project) return;

    const stage = stageRef.current;
    
    if (format === 'png') {
      const dataURL = stage.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2, // Higher resolution
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${project.name || 'canvas'}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'svg') {
      // For SVG export, we need to recreate the canvas as SVG
      stage.toCanvas({
        callback: (canvas: HTMLCanvasElement) => {
          const dataURL = canvas.toDataURL('image/svg+xml');
          const link = document.createElement('a');
          link.download = `${project.name || 'canvas'}.svg`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }
  }, [project]);

  return {
    project,
    selectedElements,
    tool,
    viewport,
    isDragging,
    isDrawing,
    connectionStart,
    isGrouping,
    isMultiSelecting,
    createElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    setTool,
    updateViewport,
    saveProject,
    loadProject,
    createConnection,
    removeConnection,
    startConnection,
    finishConnection,
    cancelConnection,
    exportCanvas,
  };
};