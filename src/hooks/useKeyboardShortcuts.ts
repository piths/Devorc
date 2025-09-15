import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const metaMatches = (shortcut.metaKey ?? false) === event.metaKey;
      const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
      const altMatches = (shortcut.altKey ?? false) === event.altKey;

      return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return shortcuts;
}

export function useFileNavigationShortcuts(
  navigateBack: () => void,
  navigateForward: () => void,
  canNavigateBack: boolean,
  canNavigateForward: boolean,
  enabled: boolean = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowLeft',
      altKey: true,
      action: () => {
        if (canNavigateBack) {
          navigateBack();
        }
      },
      description: 'Navigate to previous file',
    },
    {
      key: 'ArrowRight',
      altKey: true,
      action: () => {
        if (canNavigateForward) {
          navigateForward();
        }
      },
      description: 'Navigate to next file',
    },
    {
      key: '[',
      metaKey: true,
      action: () => {
        if (canNavigateBack) {
          navigateBack();
        }
      },
      description: 'Navigate to previous file (Mac)',
    },
    {
      key: ']',
      metaKey: true,
      action: () => {
        if (canNavigateForward) {
          navigateForward();
        }
      },
      description: 'Navigate to next file (Mac)',
    },
    {
      key: '[',
      ctrlKey: true,
      action: () => {
        if (canNavigateBack) {
          navigateBack();
        }
      },
      description: 'Navigate to previous file (Windows/Linux)',
    },
    {
      key: ']',
      ctrlKey: true,
      action: () => {
        if (canNavigateForward) {
          navigateForward();
        }
      },
      description: 'Navigate to next file (Windows/Linux)',
    },
  ];

  return useKeyboardShortcuts(shortcuts, enabled);
}