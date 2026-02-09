// Smart Scanner - Hybrid 3-phase price detection
// Phase 1: CSS pre-filter (fast)
// Phase 2: Viewport pruned scan (targeted)
// Phase 3: Background deep scan (complete, during idle time)

import type { Settings, ExchangeRates } from "$lib/types";
import type { PageContext } from "../context";
import { isInViewport, CONVERTED_ATTR } from "../utils/domUtils";

import { buildPatterns, type PricePatterns } from "./patterns";
import { LIKELY_PRICE_SELECTORS, EXCLUDED_TAGS } from "./selectors";
import { containsCurrencyIndicators } from "./priceDetector";
import { replacePrices, isConverted, isInsideConverted } from "./replacer";

// Polyfill for requestIdleCallback
const requestIdleCallback =
  window.requestIdleCallback ||
  ((cb: IdleRequestCallback) =>
    window.setTimeout(
      () => cb({ didTimeout: false, timeRemaining: () => 50 }),
      1,
    ));

const cancelIdleCallback =
  window.cancelIdleCallback || ((id: number) => window.clearTimeout(id));

export interface ScannerOptions {
  settings: Settings;
  exchangeRates: ExchangeRates;
  pageContext: PageContext;
}

/**
 * Guard constants to prevent false positives on large text blocks
 */

/** Maximum text length for an element to be considered a price container */
const MAX_PRICE_ELEMENT_TEXT_LENGTH = 200;

/**
 * SmartScanner - Hybrid price detection with 3-phase scanning
 *
 * Uses a combination of CSS selectors and text analysis to find prices
 * efficiently, with background processing for complete coverage.
 */
export class SmartScanner {
  private options: ScannerOptions;
  private patterns: PricePatterns;
  private processedElements: WeakSet<Element> = new WeakSet();
  private pendingElements: Set<HTMLElement> = new Set();
  private idleCallbackId: number | null = null;
  private isScanning = false;

  constructor(options: ScannerOptions) {
    this.options = options;

    // Build regex patterns dynamically from API-provided rates
    this.patterns = buildPatterns(options.exchangeRates);

    console.log(
      `Auto Price Converter: Scanner initialized with ${this.patterns.isoCodes.size} currencies`,
    );
  }

  /**
   * Main entry point - scans container using hybrid 3-phase strategy
   *
   * @param container - Element to scan for prices
   */
  scan(container: HTMLElement): void {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      // Phase 1: Fast CSS pre-filter
      this.scanByCssSelectors(container);

      // Phase 2: Viewport pruned scan (immediate)
      if (isInViewport(container)) {
        this.scanWithPruning(container);
      }

      // Phase 3: Schedule deep scan for idle time
      this.scheduleDeepScan(container);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Phase 1: Query elements matching price-related CSS selectors
   * Fast because it uses browser-optimized CSS matching
   */
  private scanByCssSelectors(container: HTMLElement): void {
    let elements: NodeListOf<Element>;

    try {
      elements = container.querySelectorAll(LIKELY_PRICE_SELECTORS);
    } catch (e) {
      console.error("Auto Price Converter: Selector error", e);
      return;
    }

    for (const element of elements) {
      if (this.shouldProcess(element as HTMLElement)) {
        this.processElement(element as HTMLElement);
      }
    }

    // Also check if container itself matches
    try {
      if (
        container.matches?.(LIKELY_PRICE_SELECTORS) &&
        this.shouldProcess(container)
      ) {
        this.processElement(container);
      }
    } catch {
      // Ignore matches errors
    }
  }

  /**
   * Phase 2: Walk DOM with pruning
   * Skips entire subtrees that don't contain currency indicators
   *
   * @param element - Element to scan
   * @param depth - Maximum depth to traverse
   */
  private scanWithPruning(element: HTMLElement, depth = 10): void {
    if (depth <= 0) return;
    if (!this.shouldProcess(element)) return;

    // Quick check: does this subtree contain currency indicators?
    const text = element.textContent || "";
    if (!containsCurrencyIndicators(text, this.patterns)) {
      return; // Prune entire subtree!
    }

    // Check if this element is a leaf price element
    if (this.isLeafPriceElement(element)) {
      this.processElement(element);
      return;
    }

    // Recurse into child elements
    for (const child of element.children) {
      if (child instanceof HTMLElement) {
        this.scanWithPruning(child, depth - 1);
      }
    }
  }

  /**
   * Phase 3: Schedule background processing during browser idle time
   */
  private scheduleDeepScan(container: HTMLElement): void {
    // Collect elements not yet processed
    this.collectPendingElements(container);

    if (this.pendingElements.size === 0) return;
    if (this.idleCallbackId !== null) return;

    this.idleCallbackId = requestIdleCallback((deadline) => {
      this.idleCallbackId = null;
      this.processIdleChunk(deadline);
    });
  }

  /**
   * Collect elements that need processing for Phase 3
   */
  private collectPendingElements(container: HTMLElement): void {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const el = node as HTMLElement;

          // Skip excluded tags
          if (EXCLUDED_TAGS.has(el.tagName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip already processed
          if (this.processedElements.has(el)) {
            return NodeFilter.FILTER_SKIP;
          }

          // Skip already converted
          if (el.hasAttribute(CONVERTED_ATTR)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node as HTMLElement;

      // Only add leaf elements with currency indicators
      if (this.isLeafPriceElement(el)) {
        const text = el.textContent || "";
        if (containsCurrencyIndicators(text, this.patterns)) {
          this.pendingElements.add(el);
        }
      }
    }
  }

  /**
   * Process pending elements during idle time
   */
  private processIdleChunk(deadline: IdleDeadline): void {
    // Process elements while we have time
    while (deadline.timeRemaining() > 5 && this.pendingElements.size > 0) {
      const element = this.pendingElements.values().next().value;
      if (element) {
        this.pendingElements.delete(element);
        this.processElement(element);
      }
    }

    // Schedule more if needed
    if (this.pendingElements.size > 0) {
      this.idleCallbackId = requestIdleCallback((deadline) => {
        this.idleCallbackId = null;
        this.processIdleChunk(deadline);
      });
    }
  }

  /**
   * Process a single element - detect and convert prices
   */
  private processElement(element: HTMLElement): void {
    // Mark as processed (even if no prices found)
    if (this.processedElements.has(element)) return;
    this.processedElements.add(element);

    // Skip if already converted
    if (isConverted(element) || isInsideConverted(element)) return;

    // Replace prices in DOM using text-node level replacement
    // Detection now happens inside replacePrices for each text node
    replacePrices(element, {
      settings: this.options.settings,
      exchangeRates: this.options.exchangeRates,
      patterns: this.patterns,
      pageContext: this.options.pageContext,
    });
  }

  /**
   * Check if element should be processed
   */
  private shouldProcess(element: HTMLElement): boolean {
    if (!element) return false;
    if (this.processedElements.has(element)) return false;
    if (element.hasAttribute(CONVERTED_ATTR)) return false;
    if (element.closest?.(`[${CONVERTED_ATTR}]`)) return false;

    // Skip excluded tags
    if (EXCLUDED_TAGS.has(element.tagName.toLowerCase())) return false;

    return true;
  }

  /**
   * Check if element is a "leaf" price element (no nested price containers)
   * Also validates that the element isn't too large to be a price container
   */
  private isLeafPriceElement(element: HTMLElement): boolean {
    // Guard: Skip elements with too much text
    // Large text blocks are unlikely to be price containers
    // This prevents processing documentation pages, articles, etc.
    const text = element.textContent || "";
    if (text.length > MAX_PRICE_ELEMENT_TEXT_LENGTH) return false;

    // If it has child elements matching price selectors, it's not a leaf
    try {
      const childPrices = element.querySelectorAll(LIKELY_PRICE_SELECTORS);
      if (childPrices.length > 0) return false;
    } catch {
      // Ignore selector errors
    }

    // If element is small enough (few children), treat as leaf
    return element.childElementCount <= 5;
  }

  /**
   * Update options (e.g., when settings change)
   */
  updateOptions(options: Partial<ScannerOptions>): void {
    this.options = { ...this.options, ...options };

    // Rebuild patterns if exchange rates changed
    if (options.exchangeRates) {
      this.patterns = buildPatterns(options.exchangeRates);
    }
  }

  /**
   * Clear processed state (for re-scanning)
   */
  reset(): void {
    this.processedElements = new WeakSet();
    this.pendingElements.clear();

    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
  }

  /**
   * Cleanup resources
   */
  disconnect(): void {
    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
    this.pendingElements.clear();
  }
}
