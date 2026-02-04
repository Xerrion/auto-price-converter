// DOM utilities for price conversion
// Handles styles, highlighting, and viewport detection

// Attribute to mark elements pending conversion
export const PENDING_ATTR = "data-price-pending";

// Attribute used to mark converted elements
export const CONVERTED_ATTR = "data-price-converted";
export const ORIGINAL_ATTR = "data-original-price";

// Viewport margin for near-viewport detection (pixels)
const VIEWPORT_MARGIN = 100;

// Module-level flag to avoid DOM query on each call
let stylesInjected = false;

/**
 * Inject fade-out animation CSS for price highlights
 */
export function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement("style");
  style.id = "price-converter-styles";
  style.textContent = `
    @keyframes price-highlight-fade {
      0% { background-color: rgba(255, 235, 59, 0.5); }
      70% { background-color: rgba(255, 235, 59, 0.3); }
      100% { background-color: transparent; }
    }
    .price-highlight-fade {
      animation: price-highlight-fade 1s ease-out forwards;
      border-radius: 2px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Apply fading highlight animation to an element
 */
export function applyFadingHighlight(element: HTMLElement): void {
  element.classList.add("price-highlight-fade");
}

/**
 * Check if an element is within or near the viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom >= -VIEWPORT_MARGIN &&
    rect.top <= window.innerHeight + VIEWPORT_MARGIN &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth
  );
}
