// Amount extraction and parsing utilities
// Extracts numeric amounts from text and parses them based on locale

import type { CurrencyMatch } from "./currencyDetector";

// Pattern for numeric amounts with various separators
// Matches: 1234, 1,234, 1.234, 1 234, 1,234.56, 1.234,56, 1 234,56
const AMOUNT_PATTERN = /[\d][,.\s\u00A0\u202F\d]*[\d]|[\d]+/;

// Pattern to detect negative signs before the amount
const NEGATIVE_PATTERN = /^[\s]*-[\s]*/;

/**
 * Extract the numeric amount string from text based on currency position
 * Returns null if a negative sign is detected (negative prices are invalid)
 */
export function extractAmountString(
  text: string,
  currencyMatch: CurrencyMatch,
): string | null {
  let searchText: string;

  if (currencyMatch.position === "before") {
    // Currency is before the amount - search after the currency
    searchText = text.slice(currencyMatch.endIndex);
  } else {
    // Currency is after the amount - search before the currency
    searchText = text.slice(0, currencyMatch.startIndex);
  }

  const trimmed = searchText.trim();

  // Reject negative amounts - check if there's a minus sign before the digits
  if (NEGATIVE_PATTERN.test(trimmed)) {
    return null;
  }

  const match = AMOUNT_PATTERN.exec(trimmed);
  if (!match) return null;

  return match[0];
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse a localized number string into a JavaScript number
 * Uses Intl.NumberFormat to detect the locale's separators
 */
export function parseLocalizedNumber(value: string, locale: string): number {
  // Get separators from Intl.NumberFormat
  let decimalSep = ".";
  let groupSep = ",";

  try {
    const formatter = new Intl.NumberFormat(locale);
    const resolved = formatter.resolvedOptions().locale;

    // Check if the locale was valid by comparing with resolved locale
    // If the resolved locale's language doesn't match the input, fall back to defaults
    const inputLang = locale.split("-")[0].toLowerCase();
    const resolvedLang = resolved.split("-")[0].toLowerCase();

    // Only use locale-specific separators if the locale was recognized
    if (inputLang === resolvedLang) {
      const parts = formatter.formatToParts(1234.56);
      decimalSep = parts.find((p) => p.type === "decimal")?.value ?? ".";
      groupSep = parts.find((p) => p.type === "group")?.value ?? ",";
    }
    // Otherwise keep defaults (en-US style: decimal=".", group=",")
  } catch {
    // If locale is invalid, use defaults
  }

  // Remove all group separators and whitespace characters
  const groupRegex = new RegExp(
    `[${escapeRegex(groupSep)}\\s\u00A0\u202F]`,
    "g",
  );
  let normalized = value.replace(groupRegex, "");

  // Replace locale decimal separator with standard decimal point
  if (decimalSep !== ".") {
    normalized = normalized.replace(decimalSep, ".");
  }

  return parseFloat(normalized);
}
