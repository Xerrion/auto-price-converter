// Observer setup for dynamic content detection
// Handles MutationObserver and IntersectionObserver

import type { Settings, ExchangeRates } from "../../lib/types";
import { CONVERTED_ATTR, PENDING_ATTR } from "./domUtils";

let observer: MutationObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

type ScanCallback = (container: HTMLElement) => void;
type ConvertCallback = (element: HTMLElement) => void;

/**
 * Setup MutationObserver to detect dynamically added content
 */
export function setupMutationObserver(
  settings: Settings | null,
  exchangeRates: ExchangeRates | null,
  onNewContent: ScanCallback,
): void {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    if (!settings?.enabled || !exchangeRates) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (!element.hasAttribute(CONVERTED_ATTR)) {
            requestAnimationFrame(() => {
              onNewContent(element);
            });
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Disconnect the MutationObserver
 */
export function disconnectMutationObserver(): void {
  observer?.disconnect();
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
 * Queue an element for conversion when it becomes visible
 */
export function observeForConversion(element: HTMLElement): void {
  if (!intersectionObserver) return;
  element.setAttribute(PENDING_ATTR, "true");
  intersectionObserver.observe(element);
}
