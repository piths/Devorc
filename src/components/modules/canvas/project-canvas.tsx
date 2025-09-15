'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Arrow } from 'react-konva';
import Konva from 'konva';
import { useCanvas } from '@/contexts/CanvasContext';
import { CanvasElement, Point } from '@/types/storage';
import { JSX } from 'react/jsx-runtime';

interface ProjectCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ProjectCanvas = React.forwardRef<Konva.Stage, ProjectCanvasProps>(({ 
  width = 800,
  height = 600,
  className = '',
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  const combinedRef = ref || stageRef;
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectionRectRef = useRef<Konva.Rect>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width, height });
  const [selectionRect, setSelectionRect] = useState<{
    visible: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });
  const [isSelecting, setIsSelecting] = useState(false);

  const {
    project,
    selectedElements,
    tool,
    viewport,
    connectionStart,
    createElement,
    updateElement,
    selectElement,
    clearSelection,
    updateViewport,
    startConnection,
    finishConnection,
    cancelConnection,
  } = useCanvas();

  // Handle stage resize based on wrapper container size
  useEffect(() => {
    const updateFromContainer = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Guard against 0 sizes during layout
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateFromContainer();
    const ro = new ResizeObserver(() => updateFromContainer());
    if (containerRef.current) ro.observe(containerRef.current);

    const onResize = () => updateFromContainer();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!transformerRef.current || !stage) return;

    const transformer = transformerRef.current;

    if (selectedElements.length === 0) {
      transformer.nodes([]);
      return;
    }

    const selectedNodes = selectedElements
      .map(id => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== null && node !== undefined);

    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedElements, combinedRef]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.1;
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor;

    // Clamp zoom between 0.1 and 5
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.position(newPos);
    updateViewport({
      x: newPos.x,
      y: newPos.y,
      zoom: clampedScale,
    });
  }, [updateViewport, combinedRef]);

  // Handle stage mouse down for selection rectangle
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;

    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty && tool === 'select') {
      // Start selection rectangle
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        
        setSelectionRect({
          visible: true,
          x1: pos.x,
          y1: pos.y,
          x2: pos.x,
          y2: pos.y,
        });
        setIsSelecting(true);
      }
    } else if (clickedOnEmpty && (tool === 'text' || tool === 'rectangle' || tool === 'circle')) {
      // Create new element if a tool is selected
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const position: Point = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };

        let elementData: Partial<CanvasElement> = {
          type: tool,
          position,
        };

        switch (tool) {
          case 'text':
            elementData = {
              ...elementData,
              size: { width: 200, height: 50 },
              data: { text: 'Double click to edit' },
              style: {
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#ffffff',
              },
            };
            break;
          case 'rectangle':
            elementData = {
              ...elementData,
              size: { width: 100, height: 80 },
              style: {
                fill: '#6366f1',
                stroke: '#4f46e5',
                strokeWidth: 2,
              },
            };
            break;
          case 'circle':
            elementData = {
              ...elementData,
              size: { width: 80, height: 80 },
              style: {
                fill: '#8b5cf6',
                stroke: '#7c3aed',
                strokeWidth: 2,
              },
            };
            break;
        }

        createElement(elementData);
      }
    }

    if (clickedOnEmpty && !e.evt.shiftKey) {
      clearSelection();
      if (tool === 'connector') {
        cancelConnection();
      }
    }
  }, [tool, createElement, clearSelection, combinedRef, cancelConnection]);

  // Handle stage mouse move for selection rectangle
  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting) return;
    
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      const pos = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };
      
      setSelectionRect(prev => ({
        ...prev,
        x2: pos.x,
        y2: pos.y,
      }));
    }
  }, [isSelecting, combinedRef]);

  // Handle stage mouse up for selection rectangle
  const handleStageMouseUp = useCallback(() => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    
    if (!project) return;

    // Find elements within selection rectangle
    const x1 = Math.min(selectionRect.x1, selectionRect.x2);
    const y1 = Math.min(selectionRect.y1, selectionRect.y2);
    const x2 = Math.max(selectionRect.x1, selectionRect.x2);
    const y2 = Math.max(selectionRect.y1, selectionRect.y2);

    const selectedIds: string[] = [];
    
    project.elements.forEach(element => {
      const elementX1 = element.position.x;
      const elementY1 = element.position.y;
      const elementX2 = element.position.x + element.size.width;
      const elementY2 = element.position.y + element.size.height;

      // Check if element intersects with selection rectangle
      if (elementX1 < x2 && elementX2 > x1 && elementY1 < y2 && elementY2 > y1) {
        selectedIds.push(element.id);
      }
    });

    // Update selection
    selectedIds.forEach(id => selectElement(id, true));

    // Hide selection rectangle
    setSelectionRect(prev => ({ ...prev, visible: false }));
  }, [isSelecting, selectionRect, project, selectElement]);

  // Handle element click
  const handleElementClick = useCallback((elementId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    if (tool === 'connector') {
      if (connectionStart) {
        finishConnection(elementId);
      } else {
        startConnection(elementId);
      }
    } else {
      selectElement(elementId, e.evt.shiftKey);
    }
  }, [tool, connectionStart, selectElement, startConnection, finishConnection]);

  // Handle element drag
  const handleElementDragEnd = useCallback((elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(elementId, {
      position: {
        x: node.x(),
        y: node.y(),
      },
    });
  }, [updateElement]);

  // Handle element transform
  const handleElementTransform = useCallback((elementId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as unknown as Konva.Node;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update size
    node.scaleX(1);
    node.scaleY(1);

    updateElement(elementId, {
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      },
      rotation: node.rotation(),
    });
  }, [updateElement]);

  // Calculate connection points between elements
  const getConnectionPoints = (fromElement: CanvasElement, toElement: CanvasElement) => {
    const fromCenter = {
      x: fromElement.position.x + fromElement.size.width / 2,
      y: fromElement.position.y + fromElement.size.height / 2,
    };
    const toCenter = {
      x: toElement.position.x + toElement.size.width / 2,
      y: toElement.position.y + toElement.size.height / 2,
    };

    // Calculate edge points for better arrow positioning
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const angle = Math.atan2(dy, dx);

    const fromEdge = {
      x: fromCenter.x + Math.cos(angle) * (fromElement.size.width / 2),
      y: fromCenter.y + Math.sin(angle) * (fromElement.size.height / 2),
    };

    const toEdge = {
      x: toCenter.x - Math.cos(angle) * (toElement.size.width / 2),
      y: toCenter.y - Math.sin(angle) * (toElement.size.height / 2),
    };

    return { from: fromEdge, to: toEdge };
  };

  // Render connections
  const renderConnections = () => {
    if (!project) return [];

    const connections: JSX.Element[] = [];

    project.elements.forEach(element => {
      element.connections.forEach(connection => {
        const targetElement = project.elements.find(el => el.id === connection.targetElementId);
        if (!targetElement) return;

        const { from, to } = getConnectionPoints(element, targetElement);

        connections.push(
          <Arrow
            key={`${element.id}-${connection.id}`}
            points={[from.x, from.y, to.x, to.y]}
            stroke={connection.style.stroke || '#6366f1'}
            strokeWidth={connection.style.strokeWidth || 2}
            fill={connection.style.fill || '#6366f1'}
            pointerLength={10}
            pointerWidth={8}
          />
        );
      });
    });

    return connections;
  };

  // Render canvas element
  const renderElement = (element: CanvasElement) => {

    const isConnectionStart = connectionStart === element.id;
    
    const commonProps = {
      key: element.id,
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      rotation: element.rotation,
      draggable: tool === 'select',
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(element.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleElementTransform(element.id, e),
      // Highlight elements during connection mode
      shadowColor: isConnectionStart ? '#10b981' : undefined,
      shadowBlur: isConnectionStart ? 10 : undefined,
      shadowOpacity: isConnectionStart ? 0.8 : undefined,
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            fill={element.style.fill}
            stroke={element.style.stroke}
            strokeWidth={element.style.strokeWidth}
            opacity={element.style.opacity}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={Math.min(element.size.width, element.size.height) / 2}
            fill={element.style.fill}
            stroke={element.style.stroke}
            strokeWidth={element.style.strokeWidth}
            opacity={element.style.opacity}
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            text={String(element.data.text || 'Text')}
            fontSize={element.style.fontSize}
            fontFamily={element.style.fontFamily}
            fill={element.style.fill}
            align={element.style.textAlign}
          />
        );

      default:
        return null;
    }
  };

  if (!project) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <p className="text-gray-400">No project loaded</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-gray-900 ${className}`}>
      <Stage
        ref={combinedRef}
        width={stageSize.width}
        height={stageSize.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {/* Render connections first (behind elements) */}
          {renderConnections()}
          
          {/* Render elements */}
          {project.elements.map(renderElement)}
          
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformEnd={(e) => {
              // Ensure selected nodes are persisted after direct transform on anchors
              selectedElements.forEach((id) => handleElementTransform(id, e));
            }}
          />
          
          {/* Selection rectangle */}
          {selectionRect.visible && (
            <Rect
              ref={selectionRectRef}
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x2 - selectionRect.x1)}
              height={Math.abs(selectionRect.y2 - selectionRect.y1)}
              fill="rgba(99, 102, 241, 0.1)"
              stroke="#6366f1"
              strokeWidth={1}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

ProjectCanvas.displayName = 'ProjectCanvas';
