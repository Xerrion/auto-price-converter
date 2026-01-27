// DOM utilities for price conversion
// Handles styles, highlighting, and viewport detection

// Attribute to mark elements pending conversion
export const PENDING_ATTR = "data-price-pending";

// Attribute used to mark converted elements
export const CONVERTED_ATTR = "data-price-converted";
export const ORIGINAL_ATTR = "data-original-price";

/**
 * Inject fade-out animation CSS for price highlights
 */
export function injectStyles(): void {
  if (document.getElementById("price-converter-styles")) return;

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
    rect.bottom >= -100 &&
    rect.top <= window.innerHeight + 100 &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth
  );
}
