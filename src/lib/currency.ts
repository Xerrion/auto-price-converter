// Currency helper utilities for displaying currency information

import type { CurrencyCode } from "./types";
import { ALL_CURRENCIES, CURRENCY_CODES } from "./types";

const currencyMap = ALL_CURRENCIES as Record<
  string,
  { name: string; symbol: string }
>;

/**
 * Get currency metadata (name and symbol) from the fallback list
 */
export function getCurrencyInfo(
  code: CurrencyCode,
): { name: string; symbol: string } | undefined {
  return currencyMap[code];
}

/**
 * Get the display name for a currency code.
 * Uses API-provided symbols if available, falls back to built-in list.
 */
export function getCurrencyName(
  code: CurrencyCode,
  symbols?: Record<string, string> | null,
): string {
  return symbols?.[code] ?? getCurrencyInfo(code)?.name ?? code;
}

/**
 * Get the symbol for a currency code (e.g., "$" for USD, "€" for EUR)
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  return getCurrencyInfo(code)?.symbol ?? code;
}

/**
 * Get a sorted list of available currency codes.
 * Uses API-provided symbols if available, falls back to built-in list.
 */
export function getCurrencyList(
  symbols?: Record<string, string> | null,
): string[] {
  if (symbols && Object.keys(symbols).length > 0) {
    return Object.keys(symbols).sort();
  }
  return CURRENCY_CODES;
}
