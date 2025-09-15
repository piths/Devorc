'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy } from 'lucide-react';
import { useCanvas } from '@/contexts/CanvasContext';
import { CanvasElement } from '@/types';

export const CanvasProperties: React.FC = () => {
  const { theme } = useTheme();
  const { 
    project, 
    selectedElements, 
    updateElement, 
    deleteElement,
    createElement 
  } = useCanvas();

  if (!project || selectedElements.length === 0) {
    return (
      <Card className={`w-64 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Select an element to edit properties</p>
        </CardContent>
      </Card>
    );
  }

  // Handle multiple selection
  const selectedElementsData = project.elements.filter(el => 
    selectedElements.includes(el.id)
  );

  // For bulk editing, show common properties
  const isBulkEdit = selectedElements.length > 1;
  const primaryElement = selectedElementsData[0];
  
  if (!primaryElement) {
    return null;
  }

  // Bulk update functions
  const handleBulkPositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    const offset = numValue - primaryElement.position[axis];
    
    selectedElements.forEach(elementId => {
      const element = project.elements.find(el => el.id === elementId);
      if (element) {
        updateElement(elementId, {
          position: {
            ...element.position,
            [axis]: element.position[axis] + offset,
          },
        });
      }
    });
  };

  const handleBulkSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = Math.max(5, parseFloat(value) || 5);
    
    selectedElements.forEach(elementId => {
      updateElement(elementId, {
        size: {
          ...selectedElementsData.find(el => el.id === elementId)?.size || { width: 100, height: 100 },
          [dimension]: numValue,
        },
      });
    });
  };

  const handleBulkStyleChange = (property: string, value: string | number) => {
    selectedElements.forEach(elementId => {
      const element = selectedElementsData.find(el => el.id === elementId);
      if (element) {
        updateElement(elementId, {
          style: {
            ...element.style,
            [property]: value,
          },
        });
      }
    });
  };

  const handleSingleUpdate = (elementId: string, updates: Partial<CanvasElement>) => {
    updateElement(elementId, updates);
  };

  const handleDeleteSelected = () => {
    selectedElements.forEach(elementId => {
      deleteElement(elementId);
    });
  };

  const handleDuplicateSelected = () => {
    selectedElements.forEach(elementId => {
      const element = selectedElementsData.find(el => el.id === elementId);
      if (element) {
        createElement({
          ...element,
          position: {
            x: element.position.x + 20,
            y: element.position.y + 20,
          },
        });
      }
    });
  };

  return (
    <Card className={`w-64 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {isBulkEdit ? (
              <div className="flex items-center gap-2">
                <span>Bulk Edit</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedElements.length}
                </Badge>
              </div>
            ) : (
              `Properties - ${primaryElement.type}`
            )}
          </CardTitle>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicateSelected}
            className="h-7 px-2 text-xs"
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteSelected}
            className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400">
            Position {isBulkEdit && "(Relative)"}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">X</Label>
              <Input
                type="number"
                value={Math.round(primaryElement.position.x)}
                onChange={(e) => handleBulkPositionChange('x', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Y</Label>
              <Input
                type="number"
                value={Math.round(primaryElement.position.y)}
                onChange={(e) => handleBulkPositionChange('y', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Width</Label>
              <Input
                type="number"
                value={Math.round(primaryElement.size.width)}
                onChange={(e) => handleBulkSizeChange('width', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Height</Label>
              <Input
                type="number"
                value={Math.round(primaryElement.size.height)}
                onChange={(e) => handleBulkSizeChange('height', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Rotation - only for single selection */}
        {!isBulkEdit && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Rotation</Label>
            <Input
              type="range"
              min="0"
              max="360"
              value={primaryElement.rotation || 0}
              onChange={(e) => handleSingleUpdate(primaryElement.id, {
                rotation: parseFloat(e.target.value)
              })}
              className="h-7 bg-gray-700"
            />
            <div className="text-xs text-gray-500 text-center">
              {Math.round(primaryElement.rotation || 0)}°
            </div>
          </div>
        )}

        <Separator className="bg-gray-700" />

        {/* Style Properties */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400">Style</Label>
          
          {/* Fill Color */}
          <div>
            <Label className="text-xs text-gray-500">Fill</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryElement.style.fill || '#6366f1'}
                onChange={(e) => handleBulkStyleChange('fill', e.target.value)}
                className="h-7 w-12 p-1 bg-gray-700 border-gray-600"
              />
              <Input
                type="text"
                value={primaryElement.style.fill || '#6366f1'}
                onChange={(e) => handleBulkStyleChange('fill', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
          </div>

          {/* Stroke Color */}
          <div>
            <Label className="text-xs text-gray-500">Stroke</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryElement.style.stroke || '#4f46e5'}
                onChange={(e) => handleBulkStyleChange('stroke', e.target.value)}
                className="h-7 w-12 p-1 bg-gray-700 border-gray-600"
              />
              <Input
                type="text"
                value={primaryElement.style.stroke || '#4f46e5'}
                onChange={(e) => handleBulkStyleChange('stroke', e.target.value)}
                className="h-7 text-xs bg-gray-700 border-gray-600"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <Label className="text-xs text-gray-500">Stroke Width</Label>
            <Input
              type="number"
              min="0"
              max="20"
              value={primaryElement.style.strokeWidth || 2}
              onChange={(e) => handleBulkStyleChange('strokeWidth', parseFloat(e.target.value) || 0)}
              className="h-7 text-xs bg-gray-700 border-gray-600"
            />
          </div>

          {/* Opacity */}
          <div>
            <Label className="text-xs text-gray-500">Opacity</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={primaryElement.style.opacity || 1}
              onChange={(e) => handleBulkStyleChange('opacity', parseFloat(e.target.value))}
              className="h-7 bg-gray-700"
            />
            <div className="text-xs text-gray-500 text-center">
              {Math.round((primaryElement.style.opacity || 1) * 100)}%
            </div>
          </div>
        </div>

        {/* Text-specific properties - only for single text selection */}
        {!isBulkEdit && primaryElement.type === 'text' && (
          <>
            <Separator className="bg-gray-700" />
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Text</Label>
              
              <div>
                <Label className="text-xs text-gray-500">Content</Label>
                <Textarea
                  value={String(primaryElement.data.text || '')}
                  onChange={(e) => handleSingleUpdate(primaryElement.id, {
                    data: { ...primaryElement.data, text: e.target.value }
                  })}
                  className="min-h-[60px] text-xs bg-gray-700 border-gray-600 resize-none"
                  placeholder="Enter text content..."
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Font Size</Label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={primaryElement.style.fontSize || 16}
                  onChange={(e) => handleSingleUpdate(primaryElement.id, {
                    style: { 
                      ...primaryElement.style, 
                      fontSize: parseFloat(e.target.value) || 16 
                    }
                  })}
                  className="h-7 text-xs bg-gray-700 border-gray-600"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Font Family</Label>
                <Select
                  value={primaryElement.style.fontFamily || 'Arial'}
                  onValueChange={(value) => handleSingleUpdate(primaryElement.id, {
                    style: { ...primaryElement.style, fontFamily: value }
                  })}
                >
                  <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Text Align</Label>
                <Select
                  value={primaryElement.style.textAlign || 'left'}
                  onValueChange={(value) => handleSingleUpdate(primaryElement.id, {
                    style: { ...primaryElement.style, textAlign: value as 'left' | 'center' | 'right' }
                  })}
                >
                  <SelectTrigger className="h-7 text-xs bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Multi-selection summary */}
        {isBulkEdit && (
          <>
            <Separator className="bg-gray-700" />
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Selection Summary</Label>
              <div className="text-xs text-gray-500 space-y-1">
                {Object.entries(
                  selectedElementsData.reduce((acc, el) => {
                    acc[el.type] = (acc[el.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
