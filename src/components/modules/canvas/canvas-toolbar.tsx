'use client';

import React from 'react';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Type, 
  Square, 
  Circle, 
  ArrowRight,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Undo,
  Redo,
  Minus,
  Hexagon,
  Image,
  StickyNote,
  Workflow,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useCanvas } from '@/contexts/CanvasContext';
import { CanvasState } from '@/types/canvas';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CanvasToolbarProps {
  stageRef?: React.RefObject<Konva.Stage>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ stageRef }) => {
  const {
    tool,
    setTool,
    selectedElements,
    deleteElement,
    saveProject,
    exportCanvas,
    project,
    connectionStart,
    cancelConnection,
    viewport,
    updateViewport,
  } = useCanvas();

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'hand', icon: Hand, label: 'Pan' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'polygon', icon: Hexagon, label: 'Polygon' },
    { id: 'sticky-note', icon: StickyNote, label: 'Sticky Note' },
    { id: 'flowchart-shape', icon: Workflow, label: 'Flowchart Shape' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'connector', icon: ArrowRight, label: 'Connector' },
  ] as const;

  const handleDeleteSelected = () => {
    selectedElements.forEach(elementId => {
      deleteElement(elementId);
    });
  };

  const handleSave = () => {
    saveProject();
  };

  const handleExport = (format: 'png' | 'svg') => {
    if (stageRef) {
      exportCanvas(format, stageRef);
    }
  };

  const handleZoomIn = () => {
    updateViewport({ zoom: Math.min(viewport.zoom * 1.2, 5) });
  };

  const handleZoomOut = () => {
    updateViewport({ zoom: Math.max(viewport.zoom / 1.2, 0.1) });
  };

  const handleResetZoom = () => {
    updateViewport({ zoom: 1, x: 0, y: 0 });
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={tool === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool(id as CanvasState['tool'])}
            className={cn(
              'h-8 w-8 p-0',
              tool === id && 'bg-blue-600 hover:bg-blue-700'
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={!project}
          className="h-8 w-8 p-0"
          title="Save Project"
        >
          <Save className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!project || !stageRef}
              className="h-8 w-8 p-0"
              title="Export Canvas"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('png')}>
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('svg')}>
              Export as SVG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          disabled
          className="h-8 w-8 p-0"
          title="Import (Coming Soon)"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Edit Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="h-8 w-8 p-0"
          title="Undo (Coming Soon)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled
          className="h-8 w-8 p-0"
          title="Redo (Coming Soon)"
        >
          <Redo className="h-4 w-8 p-0" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled
          className="h-8 w-8 p-0"
          title="Copy (Coming Soon)"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteSelected}
          disabled={selectedElements.length === 0}
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
          title="Delete Selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          className="h-8 px-2 text-xs"
          title="Reset Zoom"
        >
          {Math.round(viewport.zoom * 100)}%
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto">
        {connectionStart && (
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xs">Connecting...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelConnection}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
        {selectedElements.length > 0 && (
          <span>{selectedElements.length} selected</span>
        )}
        {project && (
          <span className="text-xs">
            {project.elements.length} elements
          </span>
        )}
      </div>
    </div>
  );
};
