// Global state for hovered text element (shared across components)
export const globalHoverState = {
  hoveredElement: null as HTMLElement | null
};
export const globalHoverListeners: Set<(element: HTMLElement | null) => void> = new Set();

// Compatibility exports for existing code
export const getGlobalHoveredElement = () => globalHoverState.hoveredElement;
export const setGlobalHoveredElement = (element: HTMLElement | null) => {
  globalHoverState.hoveredElement = element;
};
