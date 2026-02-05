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

  // 2. Symbol lookup from CURRENCY_SYMBOLS (handles single, multi-char, and text symbols)
  const candidates = CURRENCY_SYMBOLS[symbol];
  if (!candidates?.length) return null;

  // 3. Single candidate - use it
  if (candidates.length === 1) return candidates[0];

  // 4. Multiple candidates - use context to disambiguate
  if (context?.currency && candidates.includes(context.currency as MajorCurrency)) {
    return context.currency as MajorCurrency;
  }

  // 5. Default to first candidate
  return candidates[0];
}
