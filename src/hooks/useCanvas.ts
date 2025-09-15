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
  const initialProject = createEmptyProject();
  const [project, setProject] = useState<CanvasProject | null>(initialProject);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [tool, setTool] = useState<CanvasState['tool']>('select');
  const [viewport, setViewport] = useState<CanvasViewport>(initialViewport);
  const [isDragging] = useState(false);
  const [isDrawing] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isGrouping] = useState(false);
  const [isMultiSelecting] = useState(false);
  const [history, setHistory] = useState<CanvasProject[]>([initialProject]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
      const newProject = {
        ...prev,
        elements: [...prev.elements, newElement],
        updatedAt: new Date(),
      };
      addToHistory(newProject);
      return newProject;
    });
  }, [project]);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    if (!project) return;

    setProject(prev => {
      if (!prev) return prev;
      const newProject = {
        ...prev,
        elements: prev.elements.map(element =>
          element.id === elementId
            ? { ...element, ...updates }
            : element
        ),
        updatedAt: new Date(),
      };
      addToHistory(newProject);
      return newProject;
    });
  }, [project]);

  const deleteElement = useCallback((elementId: string) => {
    if (!project) return;

    setProject(prev => {
      if (!prev) return prev;
      const newProject = {
        ...prev,
        elements: prev.elements.filter(element => element.id !== elementId),
        updatedAt: new Date(),
      };
      addToHistory(newProject);
      return newProject;
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

    // Allow multiple connections to the same element (for branching)
    // Only prevent exact duplicate connections
    const existingConnection = fromElement.connections.find(
      conn => conn.targetElementId === toElementId && conn.type === 'arrow'
    );
    
    if (existingConnection) {
      // If connection exists, allow creating a different type or style
      console.log('Connection already exists, consider adding different connection type');
      return;
    }

    // Generate different colors for multiple connections from same element
    const connectionCount = fromElement.connections.length;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const connectionColor = colors[connectionCount % colors.length];

    const newConnection = {
      id: crypto.randomUUID(),
      targetElementId: toElementId,
      type: 'arrow' as const,
      style: {
        stroke: connectionColor,
        strokeWidth: 2,
        fill: connectionColor,
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

  const exportCanvas = useCallback((format: 'png' | 'svg' | 'json', stageRef?: React.RefObject<Konva.Stage>) => {
    if (!project) return;

    if (format === 'json') {
      // Export project data as JSON
      const dataStr = JSON.stringify(project, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.download = `${project.name || 'canvas'}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (!stageRef?.current) return;
    const stage = stageRef.current;
    
    if (format === 'png') {
      // Reset stage position and scale for export
      const originalPos = { x: stage.x(), y: stage.y() };
      const originalScale = { x: stage.scaleX(), y: stage.scaleY() };
      
      // Calculate bounds of all elements
      const elements = project.elements;
      if (elements.length === 0) return;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach(element => {
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x + element.size.width);
        maxY = Math.max(maxY, element.position.y + element.size.height);
      });
      
      // Add padding
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Set stage to fit content
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: -minX, y: -minY });
      
      const dataURL = stage.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2,
        width: maxX - minX,
        height: maxY - minY,
      });
      
      // Restore original position and scale
      stage.position(originalPos);
      stage.scale(originalScale);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${project.name || 'canvas'}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'svg') {
      // For SVG export, we need to recreate the canvas as SVG
      const dataURL = stage.toDataURL({
        mimeType: 'image/svg+xml',
        quality: 1,
      });
      
      const link = document.createElement('a');
      link.download = `${project.name || 'canvas'}.svg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [project]);

  const importProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        setProject(projectData);
        setSelectedElements([]);
        setViewport(prev => ({ ...prev, ...projectData.viewport }));
        // Reset history when importing
        setHistory([projectData]);
        setHistoryIndex(0);
      } catch (error) {
        console.error('Failed to import project:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Add to history when project changes
  const addToHistory = useCallback((newProject: CanvasProject) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newProject);
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex(curr => curr - 1);
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousProject = history[historyIndex - 1];
      setProject(previousProject);
      setHistoryIndex(prev => prev - 1);
      setSelectedElements([]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextProject = history[historyIndex + 1];
      setProject(nextProject);
      setHistoryIndex(prev => prev + 1);
      setSelectedElements([]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
    importProject,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};