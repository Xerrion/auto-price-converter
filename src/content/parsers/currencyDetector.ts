// Currency detection utilities
// Detects currency symbols and codes in text

import {
  MAJOR_CURRENCIES,
  SINGLE_SYMBOLS,
  MULTI_CHAR_SYMBOLS,
  TEXT_SYMBOLS,
} from "$lib/types";

export interface CurrencyMatch {
  symbol: string; // Raw matched text: €, $, USD, zł, CA$
  position: "before" | "after";
  startIndex: number;
  endIndex: number;
}

// ISO currency codes pattern
const ISO_CODES = MAJOR_CURRENCIES.join("|");
const ISO_CODE_REGEX = new RegExp(`\\b(${ISO_CODES})\\b`, "i");

// Build regex patterns from centralized constants
const MULTI_CHAR_REGEX = new RegExp(`(${MULTI_CHAR_SYMBOLS.join("|")})`, "");
const SINGLE_SYMBOL_REGEX = new RegExp(`([${SINGLE_SYMBOLS.join("")}])`, "");
// Note: \b doesn't work with Unicode chars like ł, č, so we use lookarounds
const TEXT_SYMBOL_REGEX = new RegExp(
  `(?<![a-zA-Z])(${TEXT_SYMBOLS.join("|")})(?![a-zA-Z])`,
  "",
);

// Pattern to find digits (to determine position)
const DIGIT_REGEX = /\d/;

/**
 * Detect currency symbol or code in text
 * Returns the first match found, checking in priority order
 */
export function detectCurrency(text: string): CurrencyMatch | null {
  // Early return if no digits - can't be a price without numbers
  if (!DIGIT_REGEX.test(text)) return null;

  // Try each pattern in priority order
  let match: RegExpExecArray | null;

  // 1. ISO codes (EUR, USD, etc.)
  match = ISO_CODE_REGEX.exec(text);
  if (match) {
    return buildMatch(match, text);
  }

  // 2. Multi-char symbols (CA$, A$, etc.) - must check before single $
  match = MULTI_CHAR_REGEX.exec(text);
  if (match) {
    return buildMatch(match, text);
  }

  // 3. Single symbols (€, $, £, etc.)
  match = SINGLE_SYMBOL_REGEX.exec(text);
  if (match) {
    return buildMatch(match, text);
  }

  // 4. Text symbols (zł, Kč, kr, etc.)
  match = TEXT_SYMBOL_REGEX.exec(text);
  if (match) {
    return buildMatch(match, text);
  }

  return null;
}

/**
 * Build a CurrencyMatch from a regex match
 */
function buildMatch(match: RegExpExecArray, text: string): CurrencyMatch {
  const symbol = match[1];
  const startIndex = match.index;
  const endIndex = startIndex + symbol.length;

  // Determine position by checking what's immediately adjacent to the symbol
  // Check character immediately before the symbol (if any)
  const charBefore = startIndex > 0 ? text[startIndex - 1] : "";
  // Check character immediately after the symbol (if any)
  const charAfter = endIndex < text.length ? text[endIndex] : "";

  const digitBefore = /\d/.test(charBefore);
  const digitAfter = /\d/.test(charAfter);

  let position: "before" | "after";

  if (digitAfter && !digitBefore) {
    // £140 -> symbol is BEFORE the amount
    position = "before";
  } else if (digitBefore && !digitAfter) {
    // 140£ -> symbol is AFTER the amount
    position = "after";
  } else if (digitAfter && digitBefore) {
    // 14£140 -> ambiguous, prefer the number after (more likely to be the price)
    // This handles cases like "KAYANO 14£140" where 140 is the price
    position = "before";
  } else {
    // Neither side has a digit adjacent - use space to determine
    // "EUR 100" or "100 EUR"
    const textBefore = text.slice(0, startIndex);
    const textAfter = text.slice(endIndex);
    const hasDigitBefore = DIGIT_REGEX.test(textBefore);
    const hasDigitAfter = DIGIT_REGEX.test(textAfter);

    if (hasDigitAfter && !hasDigitBefore) {
      position = "before";
    } else if (hasDigitBefore && !hasDigitAfter) {
      position = "after";
    } else if (hasDigitAfter) {
      // Both have digits, prefer after (symbol before amount is more common)
      position = "before";
    } else {
      // Default
      position = "before";
    }
  }

  return {
    symbol,
    position,
    startIndex,
    endIndex,
  };
}
