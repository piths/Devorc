'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Arrow, Line, Image, Group, RegularPolygon } from 'react-konva';
import Konva from 'konva';
import { useTheme } from 'next-themes';
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
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [isDrawingPen, setIsDrawingPen] = useState(false);
  const [currentPenPath, setCurrentPenPath] = useState<number[]>([]);
  const [isPenMouseDown, setIsPenMouseDown] = useState(false);
  const { theme } = useTheme();

  const {
    project,
    selectedElements,
    tool,
    setTool,
    viewport,
    connectionStart,
    createElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    updateViewport,
    startConnection,
    finishConnection,
    cancelConnection,
    saveProject,
    undo,
    redo,
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
      transformer.getLayer()?.batchDraw();
      return;
    }

    // Find selected nodes with a small delay to ensure they're rendered
    setTimeout(() => {
      const selectedNodes = selectedElements
        .map(id => stage.findOne(`#${id}`))
        .filter((node): node is Konva.Node => node !== null && node !== undefined);
      
      if (selectedNodes.length > 0) {
        transformer.nodes(selectedNodes);
        transformer.moveToTop();
        transformer.getLayer()?.batchDraw();
      }
    }, 10);
  }, [selectedElements, combinedRef]);

  // Pan state for hand tool
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

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

  // Handle stage mouse down for selection rectangle and drawing
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;

    console.log('Mouse down, current tool:', tool);
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
    } else if (clickedOnEmpty && (tool === 'text' || tool === 'rectangle' || tool === 'circle' || tool === 'polygon' || tool === 'sticky-note' || tool === 'flowchart-shape')) {
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
                fill: theme === 'dark' ? '#ffffff' : '#000000',
              },
            };
            break;
          case 'rectangle':
            elementData = {
              ...elementData,
              size: { width: 100, height: 80 },
              style: {
                fill: canvasColors.accent,
                stroke: theme === 'dark' ? '#4f46e5' : '#3730a3',
                strokeWidth: 2,
              },
            };
            break;
          case 'circle':
            elementData = {
              ...elementData,
              size: { width: 80, height: 80 },
              style: {
                fill: theme === 'dark' ? '#8b5cf6' : '#a855f7',
                stroke: theme === 'dark' ? '#7c3aed' : '#7c2d12',
                strokeWidth: 2,
              },
            };
            break;
          case 'polygon':
            elementData = {
              ...elementData,
              size: { width: 80, height: 80 },
              data: { sides: 6 },
              style: {
                fill: canvasColors.success,
                stroke: theme === 'dark' ? '#059669' : '#047857',
                strokeWidth: 2,
              },
            };
            break;
          case 'sticky-note':
            elementData = {
              ...elementData,
              size: { width: 150, height: 100 },
              data: { text: 'Sticky Note' },
              style: {
                fill: theme === 'dark' ? '#fef08a' : '#fef3c7',
                stroke: theme === 'dark' ? '#eab308' : '#d97706',
                strokeWidth: 1,
                fontSize: 14,
                borderRadius: 8,
                shadowColor: theme === 'dark' ? '#000000' : '#6b7280',
                shadowBlur: 4,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
              },
            };
            break;
          case 'flowchart-shape':
            elementData = {
              ...elementData,
              size: { width: 120, height: 60 },
              data: { text: 'Process' },
              style: {
                fill: theme === 'dark' ? '#0f172a' : '#e0f2fe',
                stroke: theme === 'dark' ? '#0284c7' : '#0369a1',
                strokeWidth: 2,
                fontSize: 14,
                borderRadius: 8,
              },
            };
            break;
        }

        createElement(elementData);
      }
    } else if (clickedOnEmpty && tool === 'image') {
      // Handle image insertion with improved error handling
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          // Validate file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            alert('Image file is too large. Please select an image smaller than 10MB.');
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (!result) return;
            
            const img = new window.Image();
            img.onload = () => {
              const pointer = stage.getPointerPosition();
              if (pointer) {
                const position: Point = {
                  x: (pointer.x - stage.x()) / stage.scaleX(),
                  y: (pointer.y - stage.y()) / stage.scaleY(),
                };

                // Calculate size to fit within reasonable bounds
                const maxWidth = 400;
                const maxHeight = 400;
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                  width *= ratio;
                  height *= ratio;
                }

                createElement({
                  type: 'image',
                  position,
                  size: { width, height },
                  data: { 
                    image: img,
                    src: result,
                    originalWidth: img.width,
                    originalHeight: img.height
                  },
                  style: { opacity: 1 },
                });
              }
            };
            img.onerror = () => {
              alert('Failed to load image. Please try a different file.');
            };
            img.src = result;
          };
          reader.onerror = () => {
            alert('Failed to read image file. Please try again.');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (clickedOnEmpty && tool === 'line') {
      // Start drawing a line
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        setIsDrawingLine(true);
        setCurrentLine([pos.x, pos.y, pos.x, pos.y]);
      }
    }

    // Handle pen drawing - start drawing regardless of what's clicked
    if (tool === 'pen') {
      console.log('Pen tool mouse down detected');
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        console.log('Starting pen drawing at:', pos);
        setIsPenMouseDown(true);
        setIsDrawingPen(true);
        setCurrentPenPath([pos.x, pos.y]);
      }
    }

    // Handle panning with hand tool
    if (clickedOnEmpty && tool === 'hand') {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        setIsPanning(true);
        setLastPanPoint(pointer);
        stage.container().style.cursor = 'grabbing';
      }
    }

    if (clickedOnEmpty && !e.evt.shiftKey && tool !== 'pen') {
      clearSelection();
      if (tool === 'connector') {
        cancelConnection();
      }
    }
  }, [tool, createElement, clearSelection, combinedRef, cancelConnection]);

  // Handle stage mouse move for selection rectangle and panning
  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;

    // Handle panning
    if (isPanning && lastPanPoint && tool === 'hand') {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const dx = pointer.x - lastPanPoint.x;
        const dy = pointer.y - lastPanPoint.y;
        
        const newPos = {
          x: stage.x() + dx,
          y: stage.y() + dy,
        };
        
        stage.position(newPos);
        updateViewport(newPos);
        setLastPanPoint(pointer);
      }
      return;
    }

    // Handle pen drawing
    if (isPenMouseDown && isDrawingPen && tool === 'pen') {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        console.log('Adding pen point:', pos);
        setCurrentPenPath(prev => [...prev, pos.x, pos.y]);
      }
      return;
    }

    // Handle line drawing
    if (isDrawingLine && tool === 'line') {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        setCurrentLine(prev => [prev[0], prev[1], pos.x, pos.y]);
      }
      return;
    }

    // Handle selection rectangle
    if (isSelecting) {
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
    }

    // Update cursor based on tool and hover state
    if (tool === 'hand' && !isPanning) {
      stage.container().style.cursor = 'grab';
    } else if (tool === 'pen') {
      stage.container().style.cursor = 'crosshair';
    } else if (tool === 'select') {
      // Check if hovering over an editable element
      const pointer = stage.getPointerPosition();
      if (pointer && project) {
        const pos = {
          x: (pointer.x - stage.x()) / stage.scaleX(),
          y: (pointer.y - stage.y()) / stage.scaleY(),
        };
        
        const hoveredElement = project.elements.find(element => {
          return pos.x >= element.position.x && 
                 pos.x <= element.position.x + element.size.width &&
                 pos.y >= element.position.y && 
                 pos.y <= element.position.y + element.size.height &&
                 (element.type === 'text' || element.type === 'sticky-note' || element.type === 'flowchart-shape');
        });
        
        if (hoveredElement) {
          stage.container().style.cursor = 'text';
        } else {
          stage.container().style.cursor = 'default';
        }
      } else {
        stage.container().style.cursor = 'default';
      }
    } else {
      stage.container().style.cursor = 'crosshair';
    }
  }, [isSelecting, isPanning, lastPanPoint, tool, combinedRef, updateViewport]);

  // Handle stage mouse up for selection rectangle, panning, and line drawing
  const handleStageMouseUp = useCallback(() => {
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    
    // Handle pen drawing end
    if (isPenMouseDown) {
      console.log('Ending pen drawing, path length:', currentPenPath.length);
      setIsPenMouseDown(false);
      
      if (isDrawingPen && currentPenPath.length >= 4) {
        // Calculate bounding box for the pen path
        const xCoords = currentPenPath.filter((_, i) => i % 2 === 0);
        const yCoords = currentPenPath.filter((_, i) => i % 2 === 1);
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        console.log('Creating pen drawing element');
        createElement({
          type: 'pen-drawing',
          position: { x: minX, y: minY },
          size: { 
            width: Math.max(maxX - minX, 10), 
            height: Math.max(maxY - minY, 10) 
          },
          data: { 
            points: currentPenPath,
            offsetX: minX,
            offsetY: minY
          },
          style: {
            stroke: canvasColors.accent,
            strokeWidth: 3,
            opacity: 1,
          },
        });
      }
      setIsDrawingPen(false);
      setCurrentPenPath([]);
    }

    // Handle line drawing end
    if (isDrawingLine && tool === 'line') {
      if (currentLine.length === 4) {
        const [x1, y1, x2, y2] = currentLine;
        // Only create line if it has some length
        if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
          createElement({
            type: 'line',
            position: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
            size: { 
              width: Math.abs(x2 - x1) || 1, 
              height: Math.abs(y2 - y1) || 1 
            },
            data: { points: currentLine },
            style: {
              stroke: canvasColors.accent,
              strokeWidth: 2,
              opacity: 1,
            },
          });
        }
      }
      setIsDrawingLine(false);
      setCurrentLine([]);
    }
    
    // Handle panning end
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      if (stage) {
        stage.container().style.cursor = tool === 'hand' ? 'grab' : 'default';
      }
    }

    // Handle selection rectangle
    if (isSelecting) {
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
    }
  }, [isSelecting, isPanning, isDrawingLine, isDrawingPen, isPenMouseDown, currentLine, currentPenPath, selectionRect, project, selectElement, tool, combinedRef, createElement]);

  // Handle element click
  const handleElementClick = useCallback((elementId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    if (tool === 'connector') {
      if (connectionStart) {
        finishConnection(elementId);
      } else {
        startConnection(elementId);
      }
    } else if (tool === 'select' || selectedElements.includes(elementId)) {
      // Allow selection in select mode or if element is already selected
      selectElement(elementId, e.evt.shiftKey);
    }
  }, [tool, connectionStart, selectedElements, selectElement, startConnection, finishConnection]);

  // Handle element double click for text editing
  const handleElementDoubleClick = useCallback((elementId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const element = project?.elements.find(el => el.id === elementId);
    if (!element || (element.type !== 'text' && element.type !== 'sticky-note' && element.type !== 'flowchart-shape')) {
      return;
    }

    const currentText = String(element.data.text || '');
    
    // Create a more user-friendly text editing experience
    const textareaContainer = document.createElement('div');
    textareaContainer.style.position = 'fixed';
    textareaContainer.style.top = '50%';
    textareaContainer.style.left = '50%';
    textareaContainer.style.transform = 'translate(-50%, -50%)';
    textareaContainer.style.zIndex = '10000';
    textareaContainer.style.backgroundColor = 'white';
    textareaContainer.style.padding = '20px';
    textareaContainer.style.borderRadius = '8px';
    textareaContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    textareaContainer.style.minWidth = '300px';
    
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.style.width = '100%';
    textarea.style.minHeight = '100px';
    textarea.style.border = '1px solid #ccc';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.fontSize = '14px';
    textarea.style.fontFamily = 'Arial, sans-serif';
    textarea.style.resize = 'vertical';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = '#6366f1';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#6b7280';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    
    const cleanup = () => {
      document.body.removeChild(textareaContainer);
    };
    
    saveButton.onclick = () => {
      updateElement(elementId, {
        data: { ...element.data, text: textarea.value }
      });
      cleanup();
    };
    
    cancelButton.onclick = cleanup;
    
    // Handle keyboard shortcuts
    textarea.onkeydown = (e) => {
      if (e.key === 'Escape') {
        cleanup();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        saveButton.click();
      }
    };
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    textareaContainer.appendChild(textarea);
    textareaContainer.appendChild(buttonContainer);
    document.body.appendChild(textareaContainer);
    
    textarea.focus();
    textarea.select();
  }, [project, updateElement]);

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

    // Calculate new dimensions
    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);

    // Reset scale to 1 to avoid compound scaling
    node.scaleX(1);
    node.scaleY(1);

    // Update element with new properties
    updateElement(elementId, {
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: newWidth,
        height: newHeight,
      },
      rotation: node.rotation(),
    });

    // Force re-render by updating the layer
    node.getLayer()?.batchDraw();
  }, [updateElement]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Tool shortcuts
      if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case 'v':
          case 'V':
            setTool('select');
            break;
          case 'h':
          case 'H':
            setTool('hand');
            break;
          case 'p':
          case 'P':
            setTool('pen');
            break;
          case 't':
          case 'T':
            setTool('text');
            break;
          case 'r':
          case 'R':
            setTool('rectangle');
            break;
          case 'c':
          case 'C':
            setTool('circle');
            break;
          case 'l':
          case 'L':
            setTool('line');
            break;
          case 'a':
          case 'A':
            setTool('connector');
            break;
          case 'i':
          case 'I':
            setTool('image');
            break;
          case 'Escape':
            clearSelection();
            if (connectionStart) {
              cancelConnection();
            }
            break;
          case '?':
            // This will be handled by the toolbar component
            break;
        }
      }
      
      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedElements.forEach(elementId => {
          deleteElement(elementId);
        });
      }
      
      // Copy selected elements (Ctrl+C)
      if (e.ctrlKey && e.key === 'c' && selectedElements.length > 0) {
        e.preventDefault();
        const elementsToCopy = project?.elements.filter(el => 
          selectedElements.includes(el.id)
        );
        if (elementsToCopy) {
          localStorage.setItem('canvas-clipboard', JSON.stringify(elementsToCopy));
        }
      }
      
      // Paste elements (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        const clipboardData = localStorage.getItem('canvas-clipboard');
        if (clipboardData) {
          try {
            const elementsToPaste = JSON.parse(clipboardData);
            elementsToPaste.forEach((element: CanvasElement) => {
              createElement({
                ...element,
                position: {
                  x: element.position.x + 20,
                  y: element.position.y + 20,
                },
              });
            });
          } catch (error) {
            console.error('Failed to paste elements:', error);
          }
        }
      }
      
      // Select all (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        if (project) {
          project.elements.forEach(element => {
            selectElement(element.id, true);
          });
        }
      }
      
      // Save project (Ctrl+S)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
      
      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Duplicate selected elements (Ctrl+D)
      if (e.ctrlKey && e.key === 'd' && selectedElements.length > 0) {
        e.preventDefault();
        const elementsToDuplicate = project?.elements.filter(el => 
          selectedElements.includes(el.id)
        );
        if (elementsToDuplicate) {
          clearSelection();
          elementsToDuplicate.forEach((element: CanvasElement) => {
            const newElement = createElement({
              ...element,
              position: {
                x: element.position.x + 20,
                y: element.position.y + 20,
              },
            });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, project, deleteElement, createElement, selectElement, saveProject, undo, redo]);

  // Calculate connection points between elements with better edge detection
  const getConnectionPoints = (fromElement: CanvasElement, toElement: CanvasElement) => {
    const fromCenter = {
      x: fromElement.position.x + fromElement.size.width / 2,
      y: fromElement.position.y + fromElement.size.height / 2,
    };
    const toCenter = {
      x: toElement.position.x + toElement.size.width / 2,
      y: toElement.position.y + toElement.size.height / 2,
    };

    // Calculate which edges to connect based on relative positions
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    
    // Determine connection points based on element positions
    let fromEdge: Point, toEdge: Point;
    
    // From element edge calculation
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        // Connect from right edge of fromElement
        fromEdge = {
          x: fromElement.position.x + fromElement.size.width,
          y: fromCenter.y,
        };
      } else {
        // Connect from left edge of fromElement
        fromEdge = {
          x: fromElement.position.x,
          y: fromCenter.y,
        };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        // Connect from bottom edge of fromElement
        fromEdge = {
          x: fromCenter.x,
          y: fromElement.position.y + fromElement.size.height,
        };
      } else {
        // Connect from top edge of fromElement
        fromEdge = {
          x: fromCenter.x,
          y: fromElement.position.y,
        };
      }
    }
    
    // To element edge calculation
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        // Connect to left edge of toElement
        toEdge = {
          x: toElement.position.x,
          y: toCenter.y,
        };
      } else {
        // Connect to right edge of toElement
        toEdge = {
          x: toElement.position.x + toElement.size.width,
          y: toCenter.y,
        };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        // Connect to top edge of toElement
        toEdge = {
          x: toCenter.x,
          y: toElement.position.y,
        };
      } else {
        // Connect to bottom edge of toElement
        toEdge = {
          x: toCenter.x,
          y: toElement.position.y + toElement.size.height,
        };
      }
    }

    return { from: fromEdge, to: toEdge };
  };

  // Render connections with improved arrow styles and curved paths
  const renderConnections = () => {
    if (!project) return [];

    const connections: JSX.Element[] = [];

    project.elements.forEach(element => {
      element.connections.forEach(connection => {
        const targetElement = project.elements.find(el => el.id === connection.targetElementId);
        if (!targetElement) return;

        const { from, to } = getConnectionPoints(element, targetElement);
        
        // Calculate curved path for better visual flow
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Create curved path for longer connections
        if (distance > 100) {
          const midX = from.x + dx * 0.5;
          const midY = from.y + dy * 0.5;
          
          // Add curve offset based on connection direction
          const curveOffset = Math.min(50, distance * 0.2);
          const perpX = -dy / distance * curveOffset;
          const perpY = dx / distance * curveOffset;
          
          const controlX = midX + perpX;
          const controlY = midY + perpY;
          
          // Create curved line using quadratic curve
          const curvePoints = [];
          for (let t = 0; t <= 1; t += 0.1) {
            const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlX + t * t * to.x;
            const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlY + t * t * to.y;
            curvePoints.push(x, y);
          }
          
          connections.push(
            <Line
              key={`${element.id}-${connection.id}-curve`}
              points={curvePoints}
              stroke={connection.style.stroke || '#6366f1'}
              strokeWidth={connection.style.strokeWidth || 2}
              tension={0.3}
            />
          );
          
          // Add arrowhead at the end
          const arrowAngle = Math.atan2(to.y - controlY, to.x - controlX);
          const arrowLength = 12;
          const arrowWidth = 6;
          
          const arrowPoints = [
            to.x, to.y,
            to.x - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
            to.y - arrowLength * Math.sin(arrowAngle - Math.PI / 6),
            to.x - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
            to.y - arrowLength * Math.sin(arrowAngle + Math.PI / 6),
          ];
          
          connections.push(
            <Line
              key={`${element.id}-${connection.id}-arrow`}
              points={arrowPoints}
              fill={connection.style.fill || '#6366f1'}
              stroke={connection.style.stroke || '#6366f1'}
              strokeWidth={1}
              closed={true}
            />
          );
        } else {
          // Use straight arrow for short connections
          connections.push(
            <Arrow
              key={`${element.id}-${connection.id}`}
              points={[from.x, from.y, to.x, to.y]}
              stroke={connection.style.stroke || '#6366f1'}
              strokeWidth={connection.style.strokeWidth || 2}
              fill={connection.style.fill || '#6366f1'}
              pointerLength={12}
              pointerWidth={8}
            />
          );
        }
      });
    });

    return connections;
  };

  // Render connection points for connector mode
  const renderConnectionPoints = (element: CanvasElement) => {
    if (tool !== 'connector') return [];
    
    const points = [
      { x: element.position.x, y: element.position.y + element.size.height / 2 }, // left
      { x: element.position.x + element.size.width, y: element.position.y + element.size.height / 2 }, // right
      { x: element.position.x + element.size.width / 2, y: element.position.y }, // top
      { x: element.position.x + element.size.width / 2, y: element.position.y + element.size.height }, // bottom
    ];
    
    return points.map((point, index) => (
      <Circle
        key={`${element.id}-connection-${index}`}
        x={point.x}
        y={point.y}
        radius={4}
        fill={connectionStart === element.id ? canvasColors.success : canvasColors.accent}
        stroke={theme === 'dark' ? '#ffffff' : '#000000'}
        strokeWidth={1}
        opacity={0.8}
      />
    ));
  };

  // Render canvas element
  const renderElement = (element: CanvasElement) => {
    const isConnectionStart = connectionStart === element.id;
    const isConnectorMode = tool === 'connector';
    
    const isSelected = selectedElements.includes(element.id);
    
    const commonProps = {
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      rotation: element.rotation,
      draggable: tool === 'select' || isSelected,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(element.id, e),
      onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementDoubleClick(element.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleElementDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleElementTransform(element.id, e),
      onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (tool === 'select') {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'pointer';
          }
        }
      },
      onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (tool === 'select') {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }
      },
      // Highlight elements during connection mode
      shadowColor: isConnectionStart ? '#10b981' : (isConnectorMode ? '#6366f1' : undefined),
      shadowBlur: isConnectionStart ? 10 : (isConnectorMode ? 5 : undefined),
      shadowOpacity: isConnectionStart ? 0.8 : (isConnectorMode ? 0.5 : undefined),

    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            fill={element.style.fill}
            stroke={isSelected ? canvasColors.accent : element.style.stroke}
            strokeWidth={isSelected ? 3 : element.style.strokeWidth}
            opacity={element.style.opacity}
          />
        );

      case 'circle':
        return (
          <Circle
            key={element.id}
            {...commonProps}
            radius={Math.min(element.size.width, element.size.height) / 2}
            fill={element.style.fill}
            stroke={isSelected ? canvasColors.accent : element.style.stroke}
            strokeWidth={isSelected ? 3 : element.style.strokeWidth}
            opacity={element.style.opacity}
          />
        );

      case 'text':
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={String(element.data.text || 'Text')}
            fontSize={element.style.fontSize || 16}
            fontFamily={element.style.fontFamily || 'Arial'}
            fill={element.style.fill || (theme === 'dark' ? '#ffffff' : '#000000')}
            align={element.style.textAlign || 'left'}
            fontWeight={element.style.fontWeight}
            fontStyle={element.style.fontStyle}
            textDecoration={element.style.textDecoration}
          />
        );

      case 'line':
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={element.data.points as number[] || [0, 0, 100, 0]}
            stroke={element.style.stroke || '#000000'}
            strokeWidth={element.style.strokeWidth || 2}
            opacity={element.style.opacity || 1}
          />
        );

      case 'polygon':
        return (
          <RegularPolygon
            key={element.id}
            {...commonProps}
            sides={element.data.sides as number || 6}
            radius={Math.min(element.size.width, element.size.height) / 2}
            fill={element.style.fill || '#ffffff'}
            stroke={element.style.stroke || '#000000'}
            strokeWidth={element.style.strokeWidth || 1}
            opacity={element.style.opacity || 1}
          />
        );

      case 'sticky-note':
        const stickyText = String(element.data.text || 'Double-click to edit');
        const isEmpty = !element.data.text || element.data.text === '';
        
        return (
          <Group key={element.id}>
            <Rect
              {...commonProps}
              fill={element.style.fill || '#fef08a'}
              stroke={element.style.stroke || '#eab308'}
              strokeWidth={element.style.strokeWidth || 1}
              cornerRadius={element.style.borderRadius || 8}
              shadowColor={element.style.shadowColor || '#000000'}
              shadowBlur={element.style.shadowBlur || 4}
              shadowOffsetX={element.style.shadowOffsetX || 2}
              shadowOffsetY={element.style.shadowOffsetY || 2}
            />
            {/* Add a small fold effect in the top-right corner */}
            <Line
              points={[
                element.position.x + element.size.width - 15, element.position.y,
                element.position.x + element.size.width, element.position.y + 15
              ]}
              stroke={element.style.stroke || '#eab308'}
              strokeWidth={1}
            />
            <Line
              points={[
                element.position.x + element.size.width - 15, element.position.y,
                element.position.x + element.size.width - 15, element.position.y + 15,
                element.position.x + element.size.width, element.position.y + 15
              ]}
              fill="#f59e0b"
              closed={true}
            />
            <Text
              x={element.position.x + 12}
              y={element.position.y + 12}
              width={element.size.width - 24}
              height={element.size.height - 24}
              text={stickyText}
              fontSize={element.style.fontSize || 14}
              fontFamily={element.style.fontFamily || 'Arial'}
              fill={isEmpty ? (theme === 'dark' ? '#9ca3af' : '#6b7280') : (element.style.stroke || (theme === 'dark' ? '#000000' : '#1f2937'))}
              align={element.style.textAlign || 'left'}
              verticalAlign="top"
              wrap="word"
              fontStyle={isEmpty ? 'italic' : 'normal'}
            />
            {/* Add edit indicator */}
            {tool === 'select' && selectedElements.includes(element.id) && (
              <Text
                x={element.position.x + element.size.width - 60}
                y={element.position.y + element.size.height - 20}
                text="✏️ Edit"
                fontSize={10}
                fill="#6b7280"
                opacity={0.7}
              />
            )}
          </Group>
        );

      case 'flowchart-shape':
        const flowchartText = String(element.data.text || 'Double-click to edit');
        const isFlowchartEmpty = !element.data.text || element.data.text === '';
        
        return (
          <Group key={element.id}>
            <Rect
              {...commonProps}
              fill={element.style.fill || '#e0f2fe'}
              stroke={element.style.stroke || '#0284c7'}
              strokeWidth={element.style.strokeWidth || 2}
              cornerRadius={element.style.borderRadius || 8}
            />
            <Text
              x={element.position.x + 12}
              y={element.position.y + element.size.height / 2 - 10}
              width={element.size.width - 24}
              text={flowchartText}
              fontSize={element.style.fontSize || 14}
              fontFamily={element.style.fontFamily || 'Arial'}
              fill={isFlowchartEmpty ? (theme === 'dark' ? '#9ca3af' : '#6b7280') : (element.style.stroke || (theme === 'dark' ? '#0284c7' : '#0369a1'))}
              align="center"
              verticalAlign="middle"
              wrap="word"
              fontStyle={isFlowchartEmpty ? 'italic' : 'normal'}
            />
            {/* Add edit indicator */}
            {tool === 'select' && selectedElements.includes(element.id) && (
              <Text
                x={element.position.x + element.size.width - 50}
                y={element.position.y + element.size.height - 15}
                text="✏️"
                fontSize={12}
                fill="#6b7280"
                opacity={0.7}
              />
            )}
          </Group>
        );

      case 'image':
        // Handle both HTMLImageElement and string src
        const imageElement = element.data.image as HTMLImageElement;
        const imageSrc = element.data.src as string;
        
        if (imageElement) {
          return (
            <Image
              key={element.id}
              {...commonProps}
              image={imageElement}
              opacity={element.style.opacity || 1}
            />
          );
        } else if (imageSrc) {
          // Create image element from src if not already created
          const img = new window.Image();
          img.src = imageSrc;
          img.onload = () => {
            // Force re-render when image loads
            updateElement(element.id, {
              data: { ...element.data, image: img }
            });
          };
          return null; // Don't render until image is loaded
        }
        return null;

      case 'pen-drawing':
        const penPoints = element.data.points as number[];
        const offsetX = element.data.offsetX as number || 0;
        const offsetY = element.data.offsetY as number || 0;
        
        // Adjust points relative to element position
        const adjustedPoints = penPoints.map((point, index) => {
          if (index % 2 === 0) {
            // X coordinate
            return point - offsetX + element.position.x;
          } else {
            // Y coordinate
            return point - offsetY + element.position.y;
          }
        });
        
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={adjustedPoints}
            stroke={element.style.stroke || '#6366f1'}
            strokeWidth={element.style.strokeWidth || 3}
            opacity={element.style.opacity || 1}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
        );

      default:
        return null;
    }
  };

  // Theme-based colors
  const canvasColors = {
    background: theme === 'dark' ? '#111827' : '#f9fafb',
    text: theme === 'dark' ? '#9ca3af' : '#6b7280',
    border: theme === 'dark' ? '#374151' : '#d1d5db',
    accent: theme === 'dark' ? '#6366f1' : '#4f46e5',
    success: theme === 'dark' ? '#10b981' : '#059669',
  };

  // Handle drag and drop for images - moved before early return to follow Rules of Hooks
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    const stage = (combinedRef as React.MutableRefObject<Konva.Stage>).current;
    if (!stage) return;
    
    // Get drop position relative to canvas
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;
    
    const position: Point = {
      x: (dropX - stage.x()) / stage.scaleX(),
      y: (dropY - stage.y()) / stage.scaleY(),
    };
    
    // Process each image file
    imageFiles.forEach((file, index) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Please use images smaller than 10MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        
        const img = new window.Image();
        img.onload = () => {
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          // Offset multiple images so they don't overlap
          const offsetX = index * 20;
          const offsetY = index * 20;
          
          createElement({
            type: 'image',
            position: { 
              x: position.x + offsetX, 
              y: position.y + offsetY 
            },
            size: { width, height },
            data: { 
              image: img,
              src: result,
              originalWidth: img.width,
              originalHeight: img.height,
              fileName: file.name
            },
            style: { opacity: 1 },
          });
        };
        img.onerror = () => {
          alert(`Failed to load image "${file.name}". Please try a different file.`);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  }, [createElement, combinedRef]);

  if (!project) {
    return (
      <div className={`flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} ${className}`}>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No project loaded</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ backgroundColor: canvasColors.background }}
    >
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
          
          {/* Render connection points in connector mode */}
          {tool === 'connector' && project.elements.map(element => (
            <React.Fragment key={`connections-${element.id}`}>
              {renderConnectionPoints(element)}
            </React.Fragment>
          ))}
          
          {/* Render current line being drawn */}
          {isDrawingLine && currentLine.length === 4 && (
            <Line
              points={currentLine}
              stroke={canvasColors.accent}
              strokeWidth={2}
              opacity={0.7}
              dash={[5, 5]}
            />
          )}
          
          {/* Render current pen path being drawn */}
          {isDrawingPen && currentPenPath.length >= 4 && (
            <Line
              points={currentPenPath}
              stroke={canvasColors.accent}
              strokeWidth={3}
              opacity={0.7}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
            />
          )}
          
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize but allow smaller minimum sizes
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              'top-left', 'top-center', 'top-right',
              'middle-right', 'middle-left',
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
            rotateEnabled={true}
            borderEnabled={true}
            anchorSize={10}
            anchorStroke={theme === 'dark' ? '#ffffff' : '#000000'}
            anchorFill={canvasColors.accent}
            anchorCornerRadius={2}
            borderStroke={canvasColors.accent}
            borderStrokeWidth={2}
            borderDash={[4, 4]}
            keepRatio={false}
            centeredScaling={false}
            onTransform={(e) => {
              // Real-time transform feedback
              const node = e.target;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              
              // Update the node's size in real-time for better UX
              node.width(node.width() * scaleX);
              node.height(node.height() * scaleY);
              node.scaleX(1);
              node.scaleY(1);
            }}
            onTransformEnd={(e) => {
              // Ensure selected nodes are persisted after direct transform on anchors
              const node = e.target;
              const elementId = node.id();
              if (elementId) {
                handleElementTransform(elementId, e);
              }
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
              fill={theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)'}
              stroke={canvasColors.accent}
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
