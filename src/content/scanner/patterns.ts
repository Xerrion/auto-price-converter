// Dynamic pattern builder for price detection
// Builds regex patterns from API-provided exchange rates

import type { ExchangeRates } from "$lib/types";

// ============================================================================
// STATIC PATTERNS (currency symbols that never change)
// ============================================================================

/** Single character currency symbols */
export const SINGLE_CHAR_SYMBOLS = "€$£¥₴₺₹₩฿₪₱";

/** Multi-character symbol prefixes (must check before single $) */
export const MULTI_CHAR_SYMBOLS = [
  "CA\\$",
  "A\\$",
  "NZ\\$",
  "HK\\$",
  "S\\$",
  "MX\\$",
  "R\\$",
];

/** Text-based currency symbols */
export const TEXT_SYMBOLS = ["kr", "zł", "Kč", "Ft", "lei", "Rp", "RM", "CHF"];

/** Range connectors between prices */
export const RANGE_CONNECTORS = "\\s*[-–—]\\s*|\\s+to\\s+";

/**
 * Amount pattern - matches various number formats:
 * - 10, 10.50, 10,50
 * - 1,234.56, 1.234,56, 1 234,56
 * - Allows spaces as thousand separators (European)
 */
export const AMOUNT_PATTERN = "\\d(?:[\\d\\s.,]*\\d)?";

// ============================================================================
// DYNAMIC PATTERN BUILDER
// ============================================================================

export interface PricePatterns {
  /** Fast check: does text contain currency indicators? */
  quickCheck: RegExp;
  /** Match single prices */
  singlePrice: RegExp;
  /** Match range prices (e.g., $10 - $20) */
  rangePrice: RegExp;
  /** All valid ISO codes from API */
  isoCodes: Set<string>;
}

/**
 * Build regex patterns using ISO codes from exchange rates
 *
 * @param exchangeRates - Exchange rates from API (contains all supported currencies)
 * @returns Compiled regex patterns for price detection
 */
export function buildPatterns(exchangeRates: ExchangeRates): PricePatterns {
  // Get all currency codes the API supports
  const isoCodes = Object.keys(exchangeRates.rates);
  const isoPattern = isoCodes.join("|");

  // Quick check regex (for pruning subtrees)
  const quickCheck = new RegExp(
    `[${SINGLE_CHAR_SYMBOLS}]|\\b(${isoPattern})\\b`,
    "i",
  );

  // Single price pattern
  const singlePricePattern = buildSinglePricePattern(isoPattern);
  const singlePrice = new RegExp(singlePricePattern, "gi");

  // Range price pattern: price1 - price2
  const rangePricePattern = `(${singlePricePattern})(?:${RANGE_CONNECTORS})(${singlePricePattern})`;
  const rangePrice = new RegExp(rangePricePattern, "gi");

  return {
    quickCheck,
    singlePrice,
    rangePrice,
    isoCodes: new Set(isoCodes),
  };
}

/**
 * Build the single price regex pattern
 */
function buildSinglePricePattern(isoPattern: string): string {
  const multiCharPattern = MULTI_CHAR_SYMBOLS.join("|");
  const textSymbolPattern = TEXT_SYMBOLS.join("|");

  return (
    `(?:` +
    // Symbol before amount: $10.50, €100, £50
    `([${SINGLE_CHAR_SYMBOLS}])\\s*(${AMOUNT_PATTERN})` +
    `|` +
    // Multi-char before amount: CA$10, A$50, NZ$100
    `(${multiCharPattern})\\s*(${AMOUNT_PATTERN})` +
    `|` +
    // ISO code before amount: USD 100, UAH 1 109
    `\\b(${isoPattern})\\s+(${AMOUNT_PATTERN})\\b` +
    `|` +
    // Amount then symbol: 10.50€, 100 €, 10,50€
    `(${AMOUNT_PATTERN})\\s*([${SINGLE_CHAR_SYMBOLS}])` +
    `|` +
    // Amount then ISO code: 100 USD, 1 109 UAH
    `\\b(${AMOUNT_PATTERN})\\s+(${isoPattern})\\b` +
    `|` +
    // Amount then text symbol: 100 kr, 50 zł
    `(${AMOUNT_PATTERN})\\s+(${textSymbolPattern})(?![a-zA-Z])` +
    `)`
  );
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
