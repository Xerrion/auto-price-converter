// Price extraction from DOM elements
// Handles various e-commerce DOM structures

import { PLATFORM_CONFIGS } from "./platforms";
import { PRICE_REGEX } from "./priceParser";

/**
 * Extract price text from an e-commerce price container
 * Handles various DOM structures used by different platforms
 */
export function extractPriceText(element: HTMLElement): string | null {
  // Strategy 1: Look for screen reader / offscreen text (contains full price)
  for (const config of PLATFORM_CONFIGS) {
    if (config.offscreenSelector) {
      try {
        const offscreen = element.querySelector(config.offscreenSelector);
        if (offscreen?.textContent?.trim()) {
          return offscreen.textContent.trim();
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
  }

  // Strategy 2: Look for data attributes with price
  const dataPrice =
    element.getAttribute("data-price") ||
    element.getAttribute("data-product-price") ||
    element.getAttribute("content");
  if (dataPrice) {
    // Try to find a currency symbol nearby
    const symbol =
      element.querySelector('[class*="symbol"], [class*="currency"]')
        ?.textContent ||
      element.textContent?.match(/[€$£¥]/)?.[0] ||
      "$";
    const numericPrice = parseFloat(dataPrice);
    if (!isNaN(numericPrice)) {
      return `${symbol}${numericPrice.toFixed(2)}`;
    }
  }

  // Strategy 3: Combine price parts (symbol + whole + decimal + fraction)
  for (const config of PLATFORM_CONFIGS) {
    if (config.parts) {
      try {
        const symbolEl = config.parts.symbol
          ? element.querySelector(config.parts.symbol)
          : null;
        const wholeEl = config.parts.whole
          ? element.querySelector(config.parts.whole)
          : null;
        const fractionEl = config.parts.fraction
          ? element.querySelector(config.parts.fraction)
          : null;

        if (symbolEl && wholeEl) {
          const symbol = symbolEl.textContent?.trim() || "";
          // Handle Amazon's whole price (may contain decimal span inside)
          let whole = "";
          if (wholeEl.childNodes.length > 0) {
            // Get just the first text node
            for (const child of wholeEl.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) {
                whole = child.textContent?.trim() || "";
                break;
              }
            }
          }
          if (!whole) {
            whole = wholeEl.textContent?.replace(/\D/g, "") || "";
          }
          const fraction = fractionEl?.textContent?.trim() || "00";

          if (symbol && whole) {
            return `${symbol}${whole}.${fraction}`;
          }
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
  }

  // Strategy 4: Get visible text content (skip hidden elements)
  let visibleText = "";
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // Skip hidden/offscreen elements
      const className = parent.className || "";
      if (
        typeof className === "string" &&
        (className.includes("offscreen") ||
          className.includes("sr-only") ||
          className.includes("visually-hidden") ||
          className.includes("screen-reader"))
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      // Skip if display:none or visibility:hidden
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    visibleText += node.textContent;
  }

  visibleText = visibleText.replace(/\s+/g, " ").trim();

  // Check if it looks like a price
  if (visibleText && PRICE_REGEX.test(visibleText)) {
    PRICE_REGEX.lastIndex = 0; // Reset regex
    return visibleText;
  }

  // Strategy 5: Fallback to raw textContent
  const rawText = element.textContent?.replace(/\s+/g, " ").trim();
  if (rawText && PRICE_REGEX.test(rawText)) {
    PRICE_REGEX.lastIndex = 0;
    return rawText;
  }

  return null;
}
