// Price replacement in DOM
// Modifies text nodes directly with converted prices, preserving DOM structure

import type { Settings, ExchangeRates } from "$lib/types";
import type { PageContext } from "../context";
import { convertCurrency } from "$lib/exchangeRates";
import { formatPrice } from "../parsers/formatter";
import {
  CONVERTED_ATTR,
  ORIGINAL_ATTR,
  applyFadingHighlight,
} from "../utils/domUtils";
import { getVisibleTextNodes } from "./textExtractor";
import { detectPrices, containsCurrencyIndicators, type DetectedPrice } from "./priceDetector";
import type { PricePatterns } from "./patterns";

/** Attribute to mark elements being processed */
export const PROCESSING_ATTR = "data-price-processing";

/**
 * Guard constants to prevent false positives on large text blocks
 */

/** Maximum text length for the fallback replacement to apply */
const MAX_FALLBACK_TEXT_LENGTH = 100;

/** Minimum ratio of price text to total text for fallback replacement */
const MIN_PRICE_TEXT_RATIO = 0.3;

/** Selectors for screen-reader-only price text (contains full price) */
const SCREEN_READER_SELECTORS = ".a-offscreen, .sr-only, .visually-hidden, [class*='screen-reader']";

export interface ReplaceOptions {
  settings: Settings;
  exchangeRates: ExchangeRates;
  patterns: PricePatterns;
  pageContext: PageContext;
}

/**
 * Replace prices in an element using text-node level replacement
 * Preserves DOM structure by modifying individual text nodes
 * Falls back to split-price handling for patterns like Amazon's a-price
 *
 * @param element - Element containing prices to replace
 * @param options - Settings, exchange rates, patterns, and context
 * @returns true if any prices were replaced
 */
export function replacePrices(
  element: HTMLElement,
  options: ReplaceOptions,
): boolean {
  const { settings, patterns } = options;

  // Skip if already converted
  if (element.hasAttribute(CONVERTED_ATTR)) return false;
  if (element.hasAttribute(PROCESSING_ATTR)) return false;

  // Mark as processing to prevent re-entry
  element.setAttribute(PROCESSING_ATTR, "true");

  try {
    // Phase 1: Try text-node level replacement
    const textNodeResult = replaceInTextNodes(element, options);
    if (textNodeResult.replaced) {
      markAsConverted(element, textNodeResult.originalTexts, settings);
      return true;
    }

    // Phase 2: Fallback for split price patterns (e.g., Amazon's a-price)
    // Check if element contains currency indicators but text-node replacement failed
    const elementText = element.textContent || "";
    if (containsCurrencyIndicators(elementText, patterns)) {
      const splitResult = replaceSplitPrices(element, options);
      if (splitResult) {
        return true;
      }
    }

    return false;
  } finally {
    // Remove processing flag
    element.removeAttribute(PROCESSING_ATTR);
  }
}

interface TextNodeResult {
  replaced: boolean;
  originalTexts: string[];
}

/**
 * Replace prices in visible text nodes
 */
function replaceInTextNodes(
  element: HTMLElement,
  options: ReplaceOptions,
): TextNodeResult {
  const { settings, exchangeRates, patterns, pageContext } = options;
  const textNodes = getVisibleTextNodes(element);
  let anyReplaced = false;
  const originalTexts: string[] = [];

  for (const textNode of textNodes) {
    const text = textNode.textContent || "";

    // Quick check for currency indicators
    if (!containsCurrencyIndicators(text, patterns)) continue;

    // Detect prices in this text node
    const matches = detectPrices(text, pageContext, patterns);
    if (matches.length === 0) continue;

    // Filter out prices that can't be converted
    const validMatches = matches.filter((match) => {
      return match.prices.every((p) => {
        if (p.currency === settings.targetCurrency) return false;
        if (!(p.currency in exchangeRates.rates)) return false;
        return true;
      });
    });

    if (validMatches.length === 0) continue;

    originalTexts.push(text);

    const replaced = replaceInTextNode(textNode, validMatches, {
      settings,
      exchangeRates,
    });

    anyReplaced = anyReplaced || replaced;
  }

  return { replaced: anyReplaced, originalTexts };
}

/**
 * Handle split price patterns where price is spread across multiple elements
 * Examples: Amazon's a-price with symbol/whole/fraction in separate spans
 *
 * Strategy:
 * 1. Look for screen-reader text (.a-offscreen) that contains the full price
 * 2. Detect and convert that price
 * 3. Replace the visual content (aria-hidden) with converted price
 */
function replaceSplitPrices(
  element: HTMLElement,
  options: ReplaceOptions,
): boolean {
  const { settings, exchangeRates, patterns, pageContext } = options;

  // Look for screen-reader price source (contains full price like "$2,107.14")
  const srElement = element.querySelector(SCREEN_READER_SELECTORS) as HTMLElement | null;
  
  if (srElement) {
    const srText = srElement.textContent?.trim() || "";
    
    // Detect price in screen-reader text
    const matches = detectPrices(srText, pageContext, patterns);
    if (matches.length === 0) return false;

    // Filter valid matches
    const validMatches = matches.filter((match) => {
      return match.prices.every((p) => {
        if (p.currency === settings.targetCurrency) return false;
        if (!(p.currency in exchangeRates.rates)) return false;
        return true;
      });
    });

    if (validMatches.length === 0) return false;

    // Convert the first match (usually only one price)
    const match = validMatches[0];
    const convertedText = formatConvertedMatch(match, { settings, exchangeRates });
    if (!convertedText) return false;

    const displayText = settings.showOriginalPrice
      ? `${convertedText} (${match.text})`
      : convertedText;

    // Find the visual target to replace
    // Priority: aria-hidden span > rest of element content
    const visualTarget = element.querySelector('[aria-hidden="true"]') as HTMLElement | null;

    if (visualTarget) {
      // Store original and replace visual content
      const originalVisual = visualTarget.textContent || "";
      visualTarget.textContent = displayText;
      
      markAsConverted(element, [srText, originalVisual], settings);
      return true;
    }
  }

  // Fallback: Try to detect price from combined element text
  // This handles cases without screen-reader text
  const combinedText = element.textContent || "";

  // Guard: Skip elements with too much text (probably not a price container)
  // This prevents false positives on documentation pages, articles, etc.
  if (combinedText.length > MAX_FALLBACK_TEXT_LENGTH) {
    return false;
  }

  const matches = detectPrices(combinedText, pageContext, patterns);

  if (matches.length > 0) {
    const trimmedLength = combinedText.trim().length;

    const validMatches = matches.filter((match) => {
      // Standard currency validation
      const currencyValid = match.prices.every((p) => {
        if (p.currency === settings.targetCurrency) return false;
        if (!(p.currency in exchangeRates.rates)) return false;
        return true;
      });
      if (!currencyValid) return false;

      // Guard: Check price-to-text ratio
      // Price should be a significant portion of the element's text
      // This prevents converting elements where a price-like pattern
      // is a tiny part of larger content (e.g., "$1" in documentation)
      if (trimmedLength > 0) {
        const ratio = match.text.length / trimmedLength;
        if (ratio < MIN_PRICE_TEXT_RATIO) return false;
      }

      return true;
    });

    if (validMatches.length > 0) {
      const match = validMatches[0];
      const convertedText = formatConvertedMatch(match, { settings, exchangeRates });
      if (!convertedText) return false;

      const displayText = settings.showOriginalPrice
        ? `${convertedText} (${match.text})`
        : convertedText;

      // As a last resort, replace element's text content
      // This loses structure but ensures the price is converted
      element.setAttribute(ORIGINAL_ATTR, combinedText);
      element.setAttribute(CONVERTED_ATTR, "true");
      element.textContent = displayText;

      if (settings.highlightConverted) {
        applyFadingHighlight(element);
      }

      return true;
    }
  }

  return false;
}

/**
 * Mark element as converted with original text stored
 */
function markAsConverted(
  element: HTMLElement,
  originalTexts: string[],
  settings: Settings,
): void {
  element.setAttribute(ORIGINAL_ATTR, originalTexts.join(" | "));
  element.setAttribute(CONVERTED_ATTR, "true");

  if (settings.highlightConverted) {
    applyFadingHighlight(element);
  }
}

interface ConvertOptions {
  settings: Settings;
  exchangeRates: ExchangeRates;
}

/**
 * Replace prices within a single text node
 * Uses splitText() to preserve surrounding text
 *
 * @param textNode - The text node to modify
 * @param matches - Detected prices, sorted by position ascending
 * @param options - Settings and exchange rates
 * @returns true if any replacements were made
 */
function replaceInTextNode(
  textNode: Text,
  matches: DetectedPrice[],
  options: ConvertOptions,
): boolean {
  const { settings } = options;

  // Sort by position descending (process from end to preserve indices)
  const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);

  let replaced = false;

  for (const match of sortedMatches) {
    const convertedText = formatConvertedMatch(match, options);
    if (!convertedText) continue;

    const displayText = settings.showOriginalPrice
      ? `${convertedText} (${match.text})`
      : convertedText;

    const text = textNode.textContent || "";

    // Verify indices are still valid
    if (match.startIndex < 0 || match.endIndex > text.length) continue;
    if (match.startIndex >= match.endIndex) continue;

    // Verify the text at this position matches what we expect
    const actualText = text.slice(match.startIndex, match.endIndex);
    if (actualText !== match.text) {
      // Text has changed, skip this match
      continue;
    }

    // Split: [before][match][after]
    // 1. Split at endIndex to get "after" node
    if (match.endIndex < text.length) {
      textNode.splitText(match.endIndex);
    }

    // 2. Split at startIndex to isolate the price text
    if (match.startIndex > 0) {
      const priceNode = textNode.splitText(match.startIndex);
      // Replace price node text
      priceNode.textContent = displayText;
    } else {
      // Price is at the start, just replace this node's content
      // But we need to preserve the "after" part which was split off
      textNode.textContent = displayText;
    }

    replaced = true;
  }

  return replaced;
}

/**
 * Format a converted price match
 *
 * @param match - Detected price match
 * @param options - Settings and exchange rates
 * @returns Formatted converted price string, or null if conversion fails
 */
function formatConvertedMatch(
  match: DetectedPrice,
  options: ConvertOptions,
): string | null {
  const { settings, exchangeRates } = options;
  const converted: string[] = [];

  for (const price of match.prices) {
    try {
      const amount = convertCurrency(
        price.amount,
        price.currency as Parameters<typeof convertCurrency>[1],
        settings.targetCurrency,
        exchangeRates,
      );

      const formatted = formatPrice(
        amount,
        settings.targetCurrency,
        settings.decimalPlaces,
        settings.numberFormat,
      );

      converted.push(formatted);
    } catch {
      // Conversion failed (missing rate, etc.)
      return null;
    }
  }

  if (match.isRange && converted.length === 2) {
    // Preserve range connector style from original
    const connector = match.text.includes("–")
      ? " – "
      : match.text.includes("—")
        ? " — "
        : " - ";
    return converted.join(connector);
  }

  return converted[0] || null;
}

/**
 * Check if an element has already been converted
 */
export function isConverted(element: Element): boolean {
  return element.hasAttribute(CONVERTED_ATTR);
}

/**
 * Check if an element is inside a converted element
 */
export function isInsideConverted(element: Element): boolean {
  return element.closest(`[${CONVERTED_ATTR}]`) !== null;
}
