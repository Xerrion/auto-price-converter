// Price parsing utilities
// Handles regex matching, amount normalization, and currency resolution

import type { MajorCurrency } from "../lib/types";
import { CURRENCY_SYMBOLS, MAJOR_CURRENCIES } from "../lib/types";

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

/**
 * Parse a price string into amount and currency
 */
export function parsePrice(priceStr: string): ParsedPrice | null {
  PRICE_REGEX.lastIndex = 0;
  const match = PRICE_REGEX.exec(priceStr);

  if (!match) return null;

  let amountStr: string;
  let currencyStr: string;

  if (match[1] && match[2]) {
    // Symbol before: $10.50
    currencyStr = match[1];
    amountStr = match[2];
  } else if (match[3] && match[4]) {
    // Symbol after: 10.50€
    amountStr = match[3];
    currencyStr = match[4];
  } else if (match[5] && match[6]) {
    // Code before: USD 100
    currencyStr = match[5];
    amountStr = match[6];
  } else if (match[7] && match[8]) {
    // Code after: 100 USD
    amountStr = match[7];
    currencyStr = match[8];
  } else if (match[9] && match[10]) {
    // Multi-char symbol: CA$10
    currencyStr = match[9];
    amountStr = match[10];
  } else {
    return null;
  }

  const amount = normalizeAmount(amountStr);
  const currency = resolveCurrency(currencyStr);

  if (isNaN(amount) || amount <= 0 || !currency) {
    return null;
  }

  return { amount, currency };
}

/**
 * Normalize a price string to a number
 * Handles both US (1,234.56) and European (1.234,56) formats
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
 */
export function resolveCurrency(symbol: string): MajorCurrency | null {
  const upperSymbol = symbol.toUpperCase();

  // Direct currency code match
  if (MAJOR_CURRENCIES.includes(upperSymbol as MajorCurrency)) {
    return upperSymbol as MajorCurrency;
  }

  // Multi-char symbol lookup
  if (symbol === "CA$") return "CAD";
  if (symbol === "A$") return "AUD";
  if (symbol === "NZ$") return "NZD";

  // Symbol lookup
  const currencies = CURRENCY_SYMBOLS[symbol];
  if (currencies && currencies.length > 0) {
    return currencies[0];
  }

  return null;
}
