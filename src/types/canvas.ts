// Extended canvas types that build on the base types from storage.ts
import Konva from 'konva';
import { Point, ElementStyle, Connection, CanvasElement, CanvasProject } from './storage';

// Extended element style with additional canvas-specific properties
export interface ExtendedElementStyle extends ElementStyle {
  textAlign?: 'left' | 'center' | 'right';
}

// Extended connection with positioning information
export interface ExtendedConnection extends Connection {
  fromElementId: string;
  toElementId: string;
  fromPoint: Point;
  toPoint: Point;
}

// Extended canvas element with selection state
export interface ExtendedCanvasElement extends CanvasElement {
  selected?: boolean;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface CanvasState {
  project: CanvasProject | null;
  selectedElements: string[];
  tool: 'select' | 'hand' | 'text' | 'rectangle' | 'circle' | 'connector' | 'line' | 'polygon' | 'image' | 'sticky-note' | 'flowchart-shape' | 'pen';
  viewport: CanvasViewport;
  isDragging: boolean;
  isDrawing: boolean;
  connectionStart: string | null;
  isGrouping: boolean;
  isMultiSelecting: boolean;
}

export interface CanvasActions {
  createElement: (element: Partial<CanvasElement>) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (elementId: string) => void;
  selectElement: (elementId: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setTool: (tool: CanvasState['tool']) => void;
  updateViewport: (viewport: Partial<CanvasViewport>) => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  createConnection: (fromElementId: string, toElementId: string) => void;
  removeConnection: (fromElementId: string, connectionId: string) => void;
  startConnection: (elementId: string) => void;
  finishConnection: (elementId: string) => void;
  cancelConnection: () => void;
  exportCanvas: (format: 'png' | 'svg' | 'json', stageRef?: React.RefObject<Konva.Stage>) => void;
  importProject: (file: File) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}