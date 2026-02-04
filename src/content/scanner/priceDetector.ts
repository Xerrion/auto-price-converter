// Price detection using dynamic patterns
// Detects single prices and range prices in text

import type { PageContext } from "../context";
import type { PricePatterns } from "./patterns";
import { parseLocalizedNumber } from "../parsers/amountExtractor";
import { resolveCurrency } from "../parsers/currencyResolver";

/**
 * A detected price in text
 */
export interface DetectedPrice {
  /** Original matched text (e.g., "$10.50" or "$10 - $20") */
  text: string;
  /** Start index in source text */
  startIndex: number;
  /** End index in source text */
  endIndex: number;
  /** True if this is a range (e.g., "$10 - $20") */
  isRange: boolean;
  /** Individual prices within the match */
  prices: Array<{
    /** Parsed amount */
    amount: number;
    /** Resolved currency code */
    currency: string;
  }>;
}

/**
 * Detect all prices in text using dynamic patterns
 *
 * @param text - Text to search for prices
 * @param context - Page context for currency disambiguation
 * @param patterns - Dynamic patterns built from exchange rates
 * @returns Array of detected prices
 */
export function detectPrices(
  text: string,
  context: PageContext,
  patterns: PricePatterns,
): DetectedPrice[] {
  const results: DetectedPrice[] = [];
  const usedRanges: Array<[number, number]> = [];

  // First, find range prices (they take precedence)
  patterns.rangePrice.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = patterns.rangePrice.exec(text)) !== null) {
    const rangeResult = parseRangeMatch(
      match,
      text,
      context,
      patterns.isoCodes,
    );
    if (rangeResult) {
      results.push(rangeResult);
      usedRanges.push([rangeResult.startIndex, rangeResult.endIndex]);
    }
  }

  // Then, find single prices (excluding those already in ranges)
  patterns.singlePrice.lastIndex = 0;

  while ((match = patterns.singlePrice.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    // Skip if this overlaps with a range
    const overlaps = usedRanges.some(
      ([s, e]) =>
        (startIndex >= s && startIndex < e) ||
        (endIndex > s && endIndex <= e) ||
        (startIndex <= s && endIndex >= e),
    );
    if (overlaps) continue;

    const singleResult = parseSingleMatch(
      match,
      text,
      context,
      patterns.isoCodes,
    );
    if (singleResult) {
      results.push(singleResult);
    }
  }

  // Sort by position
  return results.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Parse a single price match
 */
function parseSingleMatch(
  match: RegExpExecArray,
  _fullText: string,
  context: PageContext,
  validCodes: Set<string>,
): DetectedPrice | null {
  const fullMatch = match[0];
  const startIndex = match.index;
  const endIndex = startIndex + fullMatch.length;

  // Extract currency and amount from match groups
  const { currency, amount } = extractCurrencyAndAmount(
    match,
    context,
    validCodes,
  );

  if (!currency || amount === null || isNaN(amount) || amount <= 0) {
    return null;
  }

  return {
    text: fullMatch,
    startIndex,
    endIndex,
    isRange: false,
    prices: [{ amount, currency }],
  };
}

/**
 * Parse a range price match (e.g., "$10 - $20")
 */
function parseRangeMatch(
  match: RegExpExecArray,
  _fullText: string,
  context: PageContext,
  validCodes: Set<string>,
): DetectedPrice | null {
  const fullMatch = match[0];
  const startIndex = match.index;
  const endIndex = startIndex + fullMatch.length;

  // Range matches have two price groups
  // The regex captures: (price1)(connector)(price2)
  // We need to parse both prices

  // Split by range connector to get individual prices
  const connectorMatch = fullMatch.match(/\s*[-–—]\s*|\s+to\s+/i);
  if (!connectorMatch) return null;

  const connectorIndex = fullMatch.indexOf(connectorMatch[0]);
  const price1Text = fullMatch.slice(0, connectorIndex);
  const price2Text = fullMatch.slice(connectorIndex + connectorMatch[0].length);

  const price1 = parsePriceText(price1Text, context, validCodes);
  const price2 = parsePriceText(price2Text, context, validCodes);

  if (!price1 || !price2) return null;

  // Both prices should have the same currency for a valid range
  // If not, use the first price's currency for both (common case: "$10 - 20")
  const currency = price1.currency || price2.currency;
  if (!currency) return null;

  return {
    text: fullMatch,
    startIndex,
    endIndex,
    isRange: true,
    prices: [
      { amount: price1.amount, currency },
      { amount: price2.amount, currency },
    ],
  };
}

/**
 * Parse a price text string
 */
function parsePriceText(
  text: string,
  context: PageContext,
  validCodes: Set<string>,
): { amount: number; currency: string | null } | null {
  // Extract currency symbol/code
  const currencyMatch = text.match(
    /([€$£¥₴₺₹₩฿₪₱]|CA\$|A\$|NZ\$|HK\$|S\$|MX\$|R\$|[A-Z]{3}|kr|zł|Kč|Ft|lei|Rp|RM|CHF)/i,
  );

  let currency: string | null = null;
  if (currencyMatch) {
    currency = resolveCurrency(currencyMatch[1], {
      currency: context.currency,
    });
  }

  // Validate currency exists in API
  if (currency && !validCodes.has(currency)) {
    currency = null;
  }

  // Extract amount
  const amountMatch = text.match(/[\d][\d\s.,]*[\d]|[\d]/);
  if (!amountMatch) return null;

  const amount = parseLocalizedNumber(amountMatch[0], context.locale);
  if (isNaN(amount) || amount <= 0) return null;

  return { amount, currency };
}

/**
 * Extract currency and amount from regex match groups
 */
function extractCurrencyAndAmount(
  match: RegExpExecArray,
  context: PageContext,
  validCodes: Set<string>,
): { currency: string | null; amount: number | null } {
  // The regex has multiple capture groups for different patterns
  // We need to find which groups matched

  const groups = match.slice(1).filter((g) => g !== undefined);
  if (groups.length < 2) {
    return { currency: null, amount: null };
  }

  // Determine which is currency and which is amount
  let currencyStr: string | null = null;
  let amountStr: string | null = null;

  for (const group of groups) {
    if (!group) continue;

    // Check if it looks like a number
    if (/^[\d\s.,]+$/.test(group)) {
      amountStr = group;
    } else {
      currencyStr = group;
    }
  }

  if (!currencyStr || !amountStr) {
    return { currency: null, amount: null };
  }

  // Resolve currency
  let currency = resolveCurrency(currencyStr, { currency: context.currency });

  // Validate currency exists in API rates
  if (currency && !validCodes.has(currency)) {
    currency = null;
  }

  // Parse amount using locale
  const amount = parseLocalizedNumber(amountStr, context.locale);

  return { currency, amount };
}

/**
 * Check if text contains any currency indicators (fast check)
 */
export function containsCurrencyIndicators(
  text: string,
  patterns: PricePatterns,
): boolean {
  return patterns.quickCheck.test(text);
}
