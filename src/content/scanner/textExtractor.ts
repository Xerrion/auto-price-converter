// Text extraction utilities
// Extracts visible text content from DOM elements

import { EXCLUDED_TAGS, HIDDEN_CLASSES } from "./selectors";

/**
 * Extract visible text from an element
 * Skips hidden elements, scripts, styles, etc.
 *
 * @param element - The element to extract text from
 * @returns Visible text content, normalized
 */
export function extractVisibleText(element: HTMLElement): string {
  const parts: string[] = [];

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // Skip excluded tags
      if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip hidden elements by class
      const className = parent.className || "";
      if (typeof className === "string") {
        if (HIDDEN_CLASSES.some((cls) => className.includes(cls))) {
          return NodeFilter.FILTER_REJECT;
        }
      }

      // Skip display:none (fast check via offsetParent)
      // Note: offsetParent is null for display:none, but also for body and fixed elements
      if (
        parent.tagName !== "BODY" &&
        parent.tagName !== "HTML" &&
        !parent.offsetParent &&
        getComputedStyle(parent).position !== "fixed"
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip visibility:hidden
      if (parent.style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    if (text.trim()) {
      parts.push(text);
    }
  }

  // Join with spaces and normalize whitespace
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Check if an element is visible (not hidden by CSS)
 *
 * @param element - Element to check
 * @returns true if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;

  // Check offsetParent (null for display:none)
  if (
    element.tagName !== "BODY" &&
    element.tagName !== "HTML" &&
    !element.offsetParent
  ) {
    // Could be position:fixed, check explicitly
    const style = getComputedStyle(element);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
  }

  // Check for hidden classes
  const className = element.className || "";
  if (typeof className === "string") {
    if (HIDDEN_CLASSES.some((cls) => className.includes(cls))) {
      return false;
    }
  }

  return true;
}

/**
 * Get all text nodes within an element
 *
 * @param element - The element to search
 * @returns Array of text nodes
 */
export function getTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
        return NodeFilter.FILTER_REJECT;
      }

      const text = node.textContent || "";
      if (!text.trim()) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  return textNodes;
}

/**
 * Get visible text nodes suitable for price replacement
 * Filters out nodes inside hidden/sr-only elements and scripts
 * 
 * Note: aria-hidden="true" elements ARE included because they are
 * visually displayed (just hidden from screen readers)
 *
 * @param element - The element to search
 * @returns Array of visible text nodes
 */
export function getVisibleTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // Skip excluded tags (script, style, etc.)
      if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip screen-reader-only / visually-hidden elements by class
      // These are hidden from visual display but read by screen readers
      const className = parent.className || "";
      if (typeof className === "string") {
        if (HIDDEN_CLASSES.some((cls) => className.includes(cls))) {
          return NodeFilter.FILTER_REJECT;
        }
      }

      // Note: We do NOT skip aria-hidden="true" elements because they ARE
      // visually displayed. aria-hidden only hides from screen readers.

      // Skip display:none elements (fast check via offsetParent)
      // Note: offsetParent is null for display:none, but also for body/fixed elements
      if (
        parent.tagName !== "BODY" &&
        parent.tagName !== "HTML" &&
        !parent.offsetParent
      ) {
        const style = getComputedStyle(parent);
        if (style.display === "none") return NodeFilter.FILTER_REJECT;
        if (style.position !== "fixed" && style.position !== "absolute") {
          return NodeFilter.FILTER_REJECT;
        }
      }

      // Skip visibility:hidden
      if (parent.style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip empty text nodes
      const text = node.textContent || "";
      if (!text.trim()) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  return textNodes;
}
