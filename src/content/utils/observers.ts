// Observer setup for dynamic content detection
// Handles MutationObserver and IntersectionObserver

import type { Settings, ExchangeRates } from "../../lib/types";
import { CONVERTED_ATTR, PENDING_ATTR } from "./domUtils";

let observer: MutationObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

// Debouncing state for MutationObserver
let pendingElements = new Set<HTMLElement>();
let rafId: number | null = null;

type ScanCallback = (container: HTMLElement) => void;
type ConvertCallback = (element: HTMLElement) => void;

/**
 * Setup MutationObserver to detect dynamically added content
 * Uses debouncing to batch multiple mutations into a single RAF callback
 */
export function setupMutationObserver(
  settings: Settings | null,
  exchangeRates: ExchangeRates | null,
  onNewContent: ScanCallback,
): void {
  if (observer) {
    observer.disconnect();
  }

  // Clear any pending state from previous observer
  pendingElements.clear();
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  observer = new MutationObserver((mutations) => {
    if (!settings?.enabled || !exchangeRates) return;

    // Collect all new elements into the pending set
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (!element.hasAttribute(CONVERTED_ATTR)) {
            pendingElements.add(element);
          }
        }
      }
    }

    // Schedule a single RAF callback to process all pending elements
    if (pendingElements.size > 0 && rafId === null) {
      rafId = requestAnimationFrame(() => {
        const elements = [...pendingElements];
        pendingElements.clear();
        rafId = null;
        elements.forEach(onNewContent);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Disconnect the MutationObserver and clean up pending state
 */
export function disconnectMutationObserver(): void {
  observer?.disconnect();
  observer = null;
  pendingElements.clear();
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Setup IntersectionObserver for lazy conversion of off-screen elements
 */
export function setupIntersectionObserver(onVisible: ConvertCallback): void {
  if (intersectionObserver) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          intersectionObserver!.unobserve(element);
          element.removeAttribute(PENDING_ATTR);
          onVisible(element);
        }
      }
    },
    {
      // Start converting slightly before element enters viewport
      rootMargin: "100px",
    },
  );
}

/**
 * Disconnect the IntersectionObserver and clean up
 */
export function disconnectIntersectionObserver(): void {
  intersectionObserver?.disconnect();
  intersectionObserver = null;
}

/**
 * Queue an element for conversion when it becomes visible
 */
export function observeForConversion(element: HTMLElement): void {
  if (!intersectionObserver) return;
  element.setAttribute(PENDING_ATTR, "true");
  intersectionObserver.observe(element);
}
