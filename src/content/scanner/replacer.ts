// Price replacement in DOM
// Modifies text content directly with converted prices

import type { Settings, ExchangeRates } from "$lib/types";
import { convertCurrency } from "$lib/exchangeRates";
import { formatPrice } from "../parsers/formatter";
import {
  CONVERTED_ATTR,
  ORIGINAL_ATTR,
  applyFadingHighlight,
} from "../utils/domUtils";
import type { DetectedPrice } from "./priceDetector";

/** Attribute to mark elements being processed */
export const PROCESSING_ATTR = "data-price-processing";

export interface ReplaceOptions {
  settings: Settings;
  exchangeRates: ExchangeRates;
}

/**
 * Replace detected prices in an element with converted values
 *
 * @param element - Element containing prices to replace
 * @param matches - Detected prices from priceDetector
 * @param options - Settings and exchange rates
 * @returns true if any prices were replaced
 */
export function replacePrices(
  element: HTMLElement,
  matches: DetectedPrice[],
  options: ReplaceOptions,
): boolean {
  const { settings, exchangeRates } = options;

  // Skip if already converted
  if (element.hasAttribute(CONVERTED_ATTR)) return false;
  if (element.hasAttribute(PROCESSING_ATTR)) return false;

  // Filter out prices that can't be converted
  const validMatches = matches.filter((match) => {
    // All prices in the match must have valid currencies in rates
    return match.prices.every((p) => {
      if (p.currency === settings.targetCurrency) return false; // Same currency
      if (!(p.currency in exchangeRates.rates)) return false; // Unknown currency
      return true;
    });
  });

  if (validMatches.length === 0) return false;

  // Mark as processing to prevent re-entry
  element.setAttribute(PROCESSING_ATTR, "true");

  try {
    // Get current text content
    const originalText = element.textContent || "";
    let currentText = originalText;
    let offset = 0;

    // Process matches in order (adjusting for offset as we go)
    for (const match of validMatches) {
      const convertedText = formatConvertedMatch(match, options);
      if (!convertedText) continue;

      // Build display text with original in parentheses if enabled
      const displayText = settings.showOriginalPrice
        ? `${convertedText} (${match.text})`
        : convertedText;

      // Calculate adjusted indices
      const adjustedStart = match.startIndex + offset;
      const adjustedEnd = match.endIndex + offset;

      // Replace in text
      currentText =
        currentText.slice(0, adjustedStart) +
        displayText +
        currentText.slice(adjustedEnd);

      // Update offset for next match
      offset += displayText.length - (match.endIndex - match.startIndex);
    }

    // Only update if text changed
    if (currentText !== originalText) {
      // Store original and mark as converted
      element.setAttribute(ORIGINAL_ATTR, originalText);
      element.setAttribute(CONVERTED_ATTR, "true");

      // Set tooltip with original price
      element.title = `Original: ${originalText}`;

      // Update text content
      element.textContent = currentText;

      // Apply highlight if enabled
      if (settings.highlightConverted) {
        applyFadingHighlight(element);
      }

      return true;
    }
  } finally {
    // Remove processing flag
    element.removeAttribute(PROCESSING_ATTR);
  }

  return false;
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
  options: ReplaceOptions,
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
