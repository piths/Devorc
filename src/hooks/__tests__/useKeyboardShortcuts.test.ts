import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, useFileNavigationShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: jest.Mock;

  beforeEach(() => {
    mockAction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register keyboard shortcuts', () => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Simulate Ctrl+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when disabled', () => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    // Simulate Ctrl+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should match complex key combinations', () => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        action: mockAction,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Simulate Ctrl+Shift+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
    });

    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not trigger on partial matches', () => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        action: mockAction,
        description: 'Test shortcut',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, true));

    // Simulate just Ctrl+K (missing Shift)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });
});

describe('useFileNavigationShortcuts', () => {
  let mockNavigateBack: jest.Mock;
  let mockNavigateForward: jest.Mock;

  beforeEach(() => {
    mockNavigateBack = jest.fn();
    mockNavigateForward = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate back with Alt+ArrowLeft', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        true, // canNavigateBack
        false, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
    expect(mockNavigateForward).not.toHaveBeenCalled();
  });

  it('should navigate forward with Alt+ArrowRight', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        false, // canNavigateBack
        true, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      altKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateForward).toHaveBeenCalledTimes(1);
    expect(mockNavigateBack).not.toHaveBeenCalled();
  });

  it('should navigate back with Cmd+[', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        true, // canNavigateBack
        false, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: '[',
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('should navigate forward with Cmd+]', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        false, // canNavigateBack
        true, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: ']',
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateForward).toHaveBeenCalledTimes(1);
  });

  it('should navigate back with Ctrl+[', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        true, // canNavigateBack
        false, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: '[',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('should not navigate when cannot navigate back', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        false, // canNavigateBack
        false, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateBack).not.toHaveBeenCalled();
  });

  it('should not navigate when cannot navigate forward', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        false, // canNavigateBack
        false, // canNavigateForward
        true // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      altKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateForward).not.toHaveBeenCalled();
  });

  it('should not trigger shortcuts when disabled', () => {
    renderHook(() => 
      useFileNavigationShortcuts(
        mockNavigateBack,
        mockNavigateForward,
        true, // canNavigateBack
        true, // canNavigateForward
        false // enabled
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
    });

    document.dispatchEvent(event);

    expect(mockNavigateBack).not.toHaveBeenCalled();
  });
});