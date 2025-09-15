import { render, screen, fireEvent } from '@testing-library/react';
import { ResizablePanels } from '../resizable-panels';

describe('ResizablePanels', () => {
  it('renders left and right panels', () => {
    render(
      <ResizablePanels>
        <div>Left Panel</div>
        <div>Right Panel</div>
      </ResizablePanels>
    );

    expect(screen.getByText('Left Panel')).toBeInTheDocument();
    expect(screen.getByText('Right Panel')).toBeInTheDocument();
  });

  it('applies default width to left panel', () => {
    const { container } = render(
      <ResizablePanels defaultLeftWidth={30}>
        <div>Left Panel</div>
        <div>Right Panel</div>
      </ResizablePanels>
    );

    const leftPanel = container.querySelector('div[style*="width: 30%"]');
    expect(leftPanel).toBeInTheDocument();
  });

  it('renders resizer handle', () => {
    const { container } = render(
      <ResizablePanels>
        <div>Left Panel</div>
        <div>Right Panel</div>
      </ResizablePanels>
    );

    const resizer = container.querySelector('.cursor-col-resize');
    expect(resizer).toBeInTheDocument();
  });

  it('handles mouse down on resizer', () => {
    const { container } = render(
      <ResizablePanels>
        <div>Left Panel</div>
        <div>Right Panel</div>
      </ResizablePanels>
    );

    const resizer = container.querySelector('.cursor-col-resize');
    expect(resizer).toBeInTheDocument();

    fireEvent.mouseDown(resizer!);
    // The component should handle the mouse down event without errors
  });
});