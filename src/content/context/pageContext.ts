// Page context building
// Combines multiple sources to determine page locale and currency

import type { MajorCurrency } from "$lib/types";
import { MAJOR_CURRENCIES } from "$lib/types";
import { extractStructuredData } from "./structuredData";
import { extractDomCurrency } from "./domCurrency";

export interface PageContext {
  /** Detected locale (e.g., "en-US", "fr-FR") */
  locale: string;
  /** Source of locale detection */
  localeSource: "html-lang" | "navigator";
  /** Detected currency for the page */
  currency: MajorCurrency | null;
  /** Source of currency detection */
  currencySource: "json-ld" | "domain" | "dom" | "none";
  /** Confidence level of currency detection */
  currencyConfidence: "high" | "medium" | "low" | "none";
}

// TLD to currency mapping for domain-based currency detection
// This is a fallback when no other currency source is available
export const TLD_CURRENCY_MAP: Readonly<Record<string, MajorCurrency>> = {
  // Europe
  uk: "GBP",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
  be: "EUR",
  at: "EUR",
  pt: "EUR",
  ie: "EUR",
  fi: "EUR",
  gr: "EUR",
  ee: "EUR",
  lt: "EUR",
  lv: "EUR",
  sk: "EUR",
  si: "EUR",
  mt: "EUR",
  cy: "EUR",
  lu: "EUR",
  // Nordic
  se: "SEK",
  no: "NOK",
  dk: "DKK",
  is: "ISK",
  // Eastern Europe
  pl: "PLN",
  cz: "CZK",
  hu: "HUF",
  ro: "RON",
  ua: "UAH",
  tr: "TRY",
  // Americas
  us: "USD",
  ca: "CAD",
  mx: "MXN",
  br: "BRL",
  // Asia Pacific
  jp: "JPY",
  cn: "CNY",
  au: "AUD",
  nz: "NZD",
  in: "INR",
  kr: "KRW",
  sg: "SGD",
  hk: "HKD",
  th: "THB",
  ph: "PHP",
  id: "IDR",
  my: "MYR",
  // Middle East & Africa
  za: "ZAR",
  il: "ILS",
  // Switzerland
  ch: "CHF",
};

/**
 * Build complete page context by combining multiple sources
 *
 * Priority for currency:
 * 1. JSON-LD structured data (high confidence)
 * 2. TLD domain mapping (medium confidence)
 * 3. DOM attributes/meta (low confidence)
 *
 * Priority for locale:
 * 1. HTML lang attribute
 * 2. navigator.language
 */
export async function buildPageContext(): Promise<PageContext> {
  // Get locale
  const { locale, localeSource } = detectLocale();

  // Try JSON-LD first (high confidence)
  const structuredData = await extractStructuredData();
  if (structuredData.pageCurrency) {
    const currency = validateCurrency(structuredData.pageCurrency);
    if (currency) {
      return {
        locale,
        localeSource,
        currency,
        currencySource: "json-ld",
        currencyConfidence: "high",
      };
    }
  }

  // Try TLD mapping (medium confidence)
  const tldCurrency = detectCurrencyFromTLD();
  if (tldCurrency) {
    return {
      locale,
      localeSource,
      currency: tldCurrency,
      currencySource: "domain",
      currencyConfidence: "medium",
    };
  }

  // Try DOM scan (low confidence)
  const domResult = extractDomCurrency();
  if (domResult.currency) {
    return {
      locale,
      localeSource,
      currency: domResult.currency,
      currencySource: "dom",
      currencyConfidence: "low",
    };
  }

  // No currency detected
  return {
    locale,
    localeSource,
    currency: null,
    currencySource: "none",
    currencyConfidence: "none",
  };
}

/**
 * Detect page locale from HTML lang or navigator
 */
function detectLocale(): { locale: string; localeSource: "html-lang" | "navigator" } {
  // Check HTML lang attribute first
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) {
    return {
      locale: normalizeLocale(htmlLang),
      localeSource: "html-lang",
    };
  }

  // Fall back to navigator.language
  return {
    locale: navigator.language || "en-US",
    localeSource: "navigator",
  };
}

/**
 * Normalize locale string (e.g., "en_US" -> "en-US")
 */
function normalizeLocale(locale: string): string {
  return locale.replace("_", "-");
}

/**
 * Detect currency from domain TLD
 */
function detectCurrencyFromTLD(): MajorCurrency | null {
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const tld = parts[parts.length - 1].toLowerCase();

    return TLD_CURRENCY_MAP[tld] ?? null;
  } catch {
    return null;
  }
}

/**
 * Validate and normalize a currency code
 */
function validateCurrency(value: string): MajorCurrency | null {
  const normalized = value.toUpperCase().trim();

  if (normalized.length !== 3) return null;

  if (MAJOR_CURRENCIES.includes(normalized as MajorCurrency)) {
    return normalized as MajorCurrency;
  }

  return null;
}
