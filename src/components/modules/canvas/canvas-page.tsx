'use client';

import React, { useRef } from 'react';
import Konva from 'konva';
import { ProjectCanvas } from './project-canvas';
import { CanvasToolbar } from './canvas-toolbar';
import { CanvasProperties } from './canvas-properties';
import { CanvasProvider } from '@/contexts/CanvasContext';

export const CanvasPage: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null!);

  return (
    <CanvasProvider>
      <div className="flex flex-col h-full min-h-[calc(100vh-var(--header-height))] bg-gray-900">
        {/* Toolbar */}
        <CanvasToolbar stageRef={stageRef} />
        
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 relative">
            <ProjectCanvas 
              ref={stageRef}
              className="w-full h-full"
            />
          </div>
          
          {/* Properties Panel */}
          <div className="w-64 border-l border-gray-700 bg-gray-800 p-4">
            <CanvasProperties />
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
};
