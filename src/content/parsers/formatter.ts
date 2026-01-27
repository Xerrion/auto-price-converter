// Price formatting utilities

import type { CurrencyCode, NumberFormat } from "../../lib/types";
import { ALL_CURRENCIES, NUMBER_FORMATS } from "../../lib/types";

/**
 * Format a converted price with the appropriate currency symbol and locale
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  decimalPlaces: number,
  numberFormat: NumberFormat = "en-US",
): string {
  const currencyInfo = ALL_CURRENCIES[currency];
  const locale = NUMBER_FORMATS[numberFormat].locale;

  // Format the number using the user's preferred locale
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

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
