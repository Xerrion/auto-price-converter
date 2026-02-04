// Price formatting utilities

import type { CurrencyCode, NumberFormat } from "../../lib/types";
import { ALL_CURRENCIES, NUMBER_FORMATS } from "../../lib/types";

// Cache for Intl.NumberFormat instances to avoid recreation on each call
const formatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Get a cached Intl.NumberFormat instance for the given locale and decimal places
 */
function getFormatter(locale: string, decimalPlaces: number): Intl.NumberFormat {
  const key = `${locale}:${decimalPlaces}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Format a converted price with the appropriate currency symbol and locale
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  decimalPlaces: number,
  numberFormat: NumberFormat = "en-US",
): string {
  const currencyInfo =
    ALL_CURRENCIES[currency as keyof typeof ALL_CURRENCIES] ?? {
      symbol: currency,
    };
  const locale = NUMBER_FORMATS[numberFormat].locale;

  // Format the number using the user's preferred locale (cached formatter)
  let formattedAmount = getFormatter(locale, decimalPlaces).format(amount);

  if (numberFormat === "de-CH") {
    formattedAmount = formattedAmount.replace(/[\u2019\u02BC]/g, "'");
  }

  // Currencies that typically show symbol before the amount
  const symbolBefore = [
    "USD",
    "GBP",
    "CAD",
    "AUD",
    "NZD",
    "HKD",
    "SGD",
    "MXN",
  ].includes(currency);

  if (symbolBefore) {
    return `${currencyInfo.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currencyInfo.symbol}`;
  }
}
