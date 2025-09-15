"use client";

import React, { createContext, useContext } from 'react';
import { useCanvas as createCanvasStore } from '@/hooks/useCanvas';
import type { CanvasState } from '@/types/canvas';

type CanvasStore = ReturnType<typeof createCanvasStore>;

const CanvasContext = createContext<CanvasStore | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const store = createCanvasStore();
  return <CanvasContext.Provider value={store}>{children}</CanvasContext.Provider>;
}

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used within a CanvasProvider');
  return ctx;
}

