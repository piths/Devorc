'use client';

import React, { useState } from 'react';
import Konva from 'konva';
import { useTheme } from 'next-themes';
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
  RotateCcw,
  HelpCircle,
  Pen
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CanvasToolbarProps {
  stageRef?: React.RefObject<Konva.Stage>;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ stageRef }) => {
  const [showHelp, setShowHelp] = useState(false);
  const { theme } = useTheme();
  const {
    tool,
    setTool,
    selectedElements,
    deleteElement,
    createElement,
    saveProject,
    exportCanvas,
    importProject,
    project,
    connectionStart,
    cancelConnection,
    viewport,
    updateViewport,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCanvas();

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'hand', icon: Hand, label: 'Pan' },
    { id: 'pen', icon: Pen, label: 'Pen' },
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

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    exportCanvas(format, stageRef);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        importProject(file);
      }
    };
    input.click();
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
    <div className={`flex items-center gap-2 p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
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
              disabled={!project}
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
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-8 w-8 p-0"
          title="Import Project"
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
          onClick={undo}
          disabled={!canUndo}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedElements.length > 0 && project) {
              const elementsToCopy = project.elements.filter(el => 
                selectedElements.includes(el.id)
              );
              localStorage.setItem('canvas-clipboard', JSON.stringify(elementsToCopy));
            }
          }}
          disabled={selectedElements.length === 0}
          className="h-8 w-8 p-0"
          title="Copy (Ctrl+C)"
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
              Cancel (Esc)
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
        {tool === 'pen' && (
          <span className="text-xs text-blue-400">
            Draw freely on canvas
          </span>
        )}
        {(tool === 'sticky-note' || tool === 'flowchart-shape' || tool === 'text') && (
          <span className="text-xs text-yellow-400">
            Double-click to edit text
          </span>
        )}
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Tools</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>V</kbd> Select</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>H</kbd> Pan</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>P</kbd> Pen</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>T</kbd> Text</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>R</kbd> Rectangle</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>C</kbd> Circle</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>L</kbd> Line</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>A</kbd> Connector</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>I</kbd> Image</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="space-y-1 text-xs">
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+S</kbd> Save</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+C</kbd> Copy</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+V</kbd> Paste</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+D</kbd> Duplicate</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+A</kbd> Select All</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Del</kbd> Delete</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+Z</kbd> Undo</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Ctrl+Y</kbd> Redo</div>
                  <div><kbd className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>Esc</kbd> Cancel/Clear</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Canvas</h4>
                <div className="space-y-1 text-xs">
                  <div>Drag images from your computer onto the canvas</div>
                  <div>Use mouse wheel to zoom in/out</div>
                  <div>Hold Shift to multi-select elements</div>
                  <div>Double-click text elements to edit</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
