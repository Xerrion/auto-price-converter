// Currency resolution utilities
// Resolves detected symbols/codes to ISO currency codes with context disambiguation

import type { MajorCurrency } from "$lib/types";
import { CURRENCY_SYMBOLS, MAJOR_CURRENCIES } from "$lib/types";

/**
 * Page context for currency disambiguation
 * This interface matches the one in ../context/pageContext.ts
 */
export interface CurrencyContext {
  currency: string | null;
}

// Multi-character symbol to currency code mapping
const MULTI_CHAR_MAP: Readonly<Record<string, MajorCurrency>> = {
  "CA$": "CAD",
  "A$": "AUD",
  "NZ$": "NZD",
  "R$": "BRL",
  "S$": "SGD",
  "HK$": "HKD",
  "MX$": "MXN",
};

/**
 * Resolve a currency symbol or code to a MajorCurrency
 * Uses context to disambiguate symbols that could be multiple currencies
 */
export function resolveCurrency(
  symbol: string,
  context?: CurrencyContext,
): MajorCurrency | null {
  const upper = symbol.toUpperCase();

  // 1. Direct ISO code match
  if (MAJOR_CURRENCIES.includes(upper as MajorCurrency)) {
    return upper as MajorCurrency;
  }

  // 2. Multi-character symbol lookup
  const multiChar = MULTI_CHAR_MAP[symbol];
  if (multiChar) return multiChar;

  // 3. Single/text symbol lookup from CURRENCY_SYMBOLS
  const candidates = CURRENCY_SYMBOLS[symbol];
  if (!candidates?.length) return null;

  // 4. Single candidate - use it
  if (candidates.length === 1) return candidates[0];

  // 5. Multiple candidates - use context to disambiguate
  if (context?.currency && candidates.includes(context.currency as MajorCurrency)) {
    return context.currency as MajorCurrency;
  }

  // 6. Default to first candidate
  return candidates[0];
}
