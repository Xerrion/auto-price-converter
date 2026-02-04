// Price parsing utilities
// Handles regex matching, amount normalization, and currency resolution
// Uses modular components for detection, extraction, and resolution

import type { MajorCurrency } from "$lib/types";
import { detectCurrency } from "./currencyDetector";
import { extractAmountString, parseLocalizedNumber } from "./amountExtractor";
import { resolveCurrency as resolveFromSymbol } from "./currencyResolver";
import type { CurrencyContext } from "./currencyResolver";

// Combined regex pattern to detect prices
// Matches: $10.50, €100, £50.00, 10.50€, 10,50 €, USD 100, 100 EUR, CA$10, A$50
// Uses negative lookbehind (?<!...) to avoid matching numbers that are part of product names
export const PRICE_REGEX = new RegExp(
  "(?:" +
    // Symbol before amount: $10.50, €100, £50.00
    "([€$£¥])\\s*([\\d,]+(?:\\.\\d{1,2})?)" +
    "|" +
    // Symbol after amount: 10.50€, 100 €, 10,50 €
    // Negative lookbehind to avoid matching "KAYANO 14£" as "14£"
    // Must NOT be preceded by a letter/digit, or by a space that follows a letter/digit
    "(?<![a-zA-Z0-9])(?<![a-zA-Z0-9]\\s)([\\d,.]+)\\s*([€$£¥])" +
    "|" +
    // Currency code before: USD 100, EUR 50.00
    "\\b(EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|CNY|SEK|NOK|DKK)\\s+([\\d,]+(?:\\.\\d{1,2})?)\\b" +
    "|" +
    // Currency code after: 100 USD, 50.00 EUR
    "\\b([\\d,]+(?:\\.\\d{1,2})?)\\s+(EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|CNY|SEK|NOK|DKK)\\b" +
    "|" +
    // Special multi-char symbols: CA$10, A$50, NZ$100
    "(CA\\$|A\\$|NZ\\$)\\s*([\\d,]+(?:\\.\\d{1,2})?)" +
    ")",
  "gi",
);

export interface ParsedPrice {
  amount: number;
  currency: MajorCurrency;
}

export interface ParsePriceOptions {
  /** Page context for currency disambiguation */
  context?: CurrencyContext;
  /** Locale for number parsing (e.g., "en-US", "de-DE") */
  locale?: string;
}

/**
 * Parse a price string into amount and currency
 *
 * @param priceStr - The price string to parse (e.g., "$10.50", "10,50 €", "USD 100")
 * @param options - Optional parsing options for context-aware parsing
 * @returns Parsed price with amount and currency, or null if parsing fails
 *
 * @example
 * // Basic usage
 * parsePrice("$10.50")  // { amount: 10.5, currency: "USD" }
 *
 * // With context for disambiguation
 * parsePrice("$50", { context: { currency: "CAD" } })  // { amount: 50, currency: "CAD" }
 *
 * // With locale for European number format
 * parsePrice("1.234,56 €", { locale: "de-DE" })  // { amount: 1234.56, currency: "EUR" }
 */
export function parsePrice(
  priceStr: string,
  options: ParsePriceOptions = {},
): ParsedPrice | null {
  const { context, locale = "en-US" } = options;

  // Step 1: Detect currency symbol/code in the string
  const currencyMatch = detectCurrency(priceStr);
  if (!currencyMatch) return null;

  // Step 2: Extract the amount string based on currency position
  const amountStr = extractAmountString(priceStr, currencyMatch);
  if (!amountStr) return null;

  // Step 3: Parse the amount using locale-aware parsing
  const amount = parseLocalizedNumber(amountStr, locale);
  if (isNaN(amount) || amount <= 0) return null;

  // Step 4: Resolve the currency symbol to a MajorCurrency
  // Use context for disambiguation if available
  const currency = resolveFromSymbol(currencyMatch.symbol, context);
  if (!currency) return null;

  return { amount, currency };
}

/**
 * Normalize a price string to a number
 * Handles both US (1,234.56) and European (1.234,56) formats
 *
 * @deprecated Use parseLocalizedNumber with explicit locale instead
 */
export function normalizeAmount(amountStr: string): number {
  let normalized = amountStr.trim().replace(/\s/g, "");

  // European format detection (comma as decimal separator)
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma > lastDot && lastComma === normalized.length - 3) {
    // European: 1.234,56 -> 1234.56
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    // US: 1,234.56 -> 1234.56
    normalized = normalized.replace(/,/g, "");
  }

  return parseFloat(normalized);
}

/**
 * Resolve a currency symbol or code to a MajorCurrency
 * Re-exports the currencyResolver function for backwards compatibility
 */
export function resolveCurrency(symbol: string): MajorCurrency | null {
  return resolveFromSymbol(symbol);
}
