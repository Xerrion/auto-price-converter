// DOM-based currency detection
// Fallback when JSON-LD structured data is not available

import type { MajorCurrency } from "$lib/types";
import { MAJOR_CURRENCIES } from "$lib/types";

export interface DomCurrencyResult {
  currency: MajorCurrency | null;
  source: "meta" | "data-attr" | "selected-option" | "none";
}

// Attribute names to check for currency values
const CURRENCY_ATTRIBUTES = [
  "content", // for meta tags
  "data-currency",
  "data-shop-currency",
  "data-price-currency",
  "value", // for select options
];

/**
 * Scan the DOM for currency indicators
 * Returns the first valid currency found, or null if none found
 */
export function extractDomCurrency(): DomCurrencyResult {
  // First, check meta tags (most reliable)
  const metaResult = checkMetaTags();
  if (metaResult) {
    return { currency: metaResult, source: "meta" };
  }

  // Check data attributes
  const dataAttrResult = checkDataAttributes();
  if (dataAttrResult) {
    return { currency: dataAttrResult, source: "data-attr" };
  }

  // Check selected currency options
  const selectedResult = checkSelectedOptions();
  if (selectedResult) {
    return { currency: selectedResult, source: "selected-option" };
  }

  return { currency: null, source: "none" };
}

/**
 * Check meta tags for currency
 */
function checkMetaTags(): MajorCurrency | null {
  const selectors = [
    'meta[property="product:price:currency"]',
    'meta[name="currency"]',
    'meta[itemprop="priceCurrency"]',
  ];

  for (const selector of selectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute("content");
      const currency = validateCurrency(content);
      if (currency) return currency;
    }
  }

  return null;
}

/**
 * Check data attributes for currency
 */
function checkDataAttributes(): MajorCurrency | null {
  const selectors = [
    "[data-currency]",
    "[data-shop-currency]",
    "[data-price-currency]",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      for (const attr of CURRENCY_ATTRIBUTES) {
        const value = element.getAttribute(attr);
        const currency = validateCurrency(value);
        if (currency) return currency;
      }
    }
  }

  return null;
}

/**
 * Check selected currency options in dropdowns
 */
function checkSelectedOptions(): MajorCurrency | null {
  const selectors = [
    'select[name*="currency"] option[selected]',
    'select[id*="currency"] option[selected]',
    ".currency-selector option[selected]",
  ];

  for (const selector of selectors) {
    const option = document.querySelector(selector);
    if (option) {
      // Check value attribute first, then text content
      const value =
        option.getAttribute("value") || option.textContent?.trim();
      const currency = validateCurrency(value);
      if (currency) return currency;
    }
  }

  return null;
}

/**
 * Validate and normalize a currency code
 */
function validateCurrency(value: string | null | undefined): MajorCurrency | null {
  if (!value) return null;

  const normalized = value.toUpperCase().trim();

  // Check if it's a valid 3-letter currency code
  if (normalized.length !== 3) return null;

  // Check if it's in our known currencies
  if (MAJOR_CURRENCIES.includes(normalized as MajorCurrency)) {
    return normalized as MajorCurrency;
  }

  return null;
}
