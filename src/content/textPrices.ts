// Text price scanning and conversion
// Uses findAndReplaceDOMText for inline text prices

// @ts-ignore - No types available for findAndReplaceDOMText
import findAndReplaceDOMText from "findandreplacedomtext";
import { convertCurrency } from "../lib/exchangeRates";
import type { Settings, ExchangeRates } from "../lib/types";

import { ALL_PRICE_SELECTORS } from "./platforms";
import { PRICE_REGEX, parsePrice } from "./priceParser";
import { formatPrice } from "./formatter";
import {
  CONVERTED_ATTR,
  ORIGINAL_ATTR,
  applyFadingHighlight,
} from "./domUtils";

/** Tags that should never contain prices */
const EXCLUDED_TAGS = [
  "script",
  "style",
  "noscript",
  "textarea",
  "input",
  "select",
  "svg",
];

/** Classes indicating screen reader / accessibility hidden elements */
const HIDDEN_CLASSES = [
  "offscreen",
  "sr-only",
  "visually-hidden",
  "screen-reader",
];

/** Selectors for product title/name elements (avoid matching model numbers) */
const PRODUCT_TITLE_SELECTORS = [
  '[itemprop="name"]',
  '[data-e2e="product-name"]',
  ".product-name",
  ".product-title",
  ".productName",
  "#productItemTitle h1",
  "#productItemTitle h2",
].join(", ");

/**
 * Check if an element should be excluded from text price scanning
 */
function shouldExcludeElement(element: Element): boolean {
  if (!element?.tagName) return true;

  const tagName = element.tagName.toLowerCase();

  // Skip non-content elements
  if (EXCLUDED_TAGS.includes(tagName)) return true;

  // Skip headings - typically product names, not prices
  if (/^h[1-6]$/.test(tagName)) return true;

  // Skip already-converted elements
  if (element.hasAttribute?.(CONVERTED_ATTR)) return true;
  if (element.closest?.(`[${CONVERTED_ATTR}]`)) return true;

  // Skip product title/name elements
  try {
    if (element.matches?.(PRODUCT_TITLE_SELECTORS)) return true;
    if (element.closest?.(PRODUCT_TITLE_SELECTORS)) return true;
  } catch {
    // Ignore selector errors
  }

  // Skip elements matching price selectors (handled separately by priceContainers)
  try {
    if (element.matches?.(ALL_PRICE_SELECTORS)) return true;
  } catch {
    // Ignore selector errors
  }

  // Skip screen reader / accessibility hidden elements
  const className = element.className || "";
  if (typeof className === "string") {
    if (HIDDEN_CLASSES.some((cls) => className.includes(cls))) return true;
  }

  return false;
}

/**
 * Create a converted price span element
 */
function createConvertedPriceSpan(
  originalText: string,
  formattedPrice: string,
  showOriginal: boolean,
  highlight: boolean,
): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute(CONVERTED_ATTR, "true");
  span.setAttribute(ORIGINAL_ATTR, originalText);
  span.textContent = showOriginal
    ? `${formattedPrice} (${originalText})`
    : formattedPrice;
  span.title = `Converted from ${originalText}`;

  if (highlight) {
    applyFadingHighlight(span);
  }

  return span;
}

/**
 * Process a regex match and return converted price or original text
 */
function processTextMatch(
  fullMatch: string,
  originalText: string,
  settings: Settings,
  exchangeRates: ExchangeRates,
): HTMLSpanElement | string {
  // Skip matches that look like IDs, years, or other non-price numbers
  if (/^\d{4,}$/.test(fullMatch.trim())) {
    return originalText;
  }

  const parsed = parsePrice(fullMatch);
  if (!parsed || parsed.currency === settings.targetCurrency) {
    return originalText;
  }

  const convertedAmount = convertCurrency(
    parsed.amount,
    parsed.currency,
    settings.targetCurrency,
    exchangeRates,
  );

  const formattedPrice = formatPrice(
    convertedAmount,
    settings.targetCurrency,
    settings.decimalPlaces,
    settings.numberFormat,
  );

  return createConvertedPriceSpan(
    fullMatch,
    formattedPrice,
    settings.showOriginalPrice,
    settings.highlightConverted,
  );
}

/**
 * Scan container for text prices and convert them using findAndReplaceDOMText
 */
export function processTextPrices(
  container: HTMLElement,
  settings: Settings,
  exchangeRates: ExchangeRates,
): void {
  try {
    findAndReplaceDOMText(container, {
      find: PRICE_REGEX,
      replace: (
        portion: { index: number; text: string },
        match: RegExpMatchArray,
      ) => {
        // Only process the first portion of a match
        if (portion.index > 0) return "";
        return processTextMatch(
          match[0],
          portion.text,
          settings,
          exchangeRates,
        );
      },
      filterElements: (element: Element) => !shouldExcludeElement(element),
    });
  } catch (error) {
    console.error("Price Converter: Error in text processing", error);
  }
}
