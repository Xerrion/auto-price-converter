// Shared types for the Chrome extension

// All currencies available from Frankfurter API (can be used as target)
export const ALL_CURRENCIES = {
  AUD: { name: "Australian Dollar", symbol: "A$" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  CAD: { name: "Canadian Dollar", symbol: "CA$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Renminbi Yuan", symbol: "¥" },
  CZK: { name: "Czech Koruna", symbol: "Kč" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  HUF: { name: "Hungarian Forint", symbol: "Ft" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  ILS: { name: "Israeli New Shekel", symbol: "₪" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  ISK: { name: "Icelandic Króna", symbol: "kr" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  MXN: { name: "Mexican Peso", symbol: "MX$" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  PLN: { name: "Polish Złoty", symbol: "zł" },
  RON: { name: "Romanian Leu", symbol: "lei" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  THB: { name: "Thai Baht", symbol: "฿" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  USD: { name: "United States Dollar", symbol: "$" },
  ZAR: { name: "South African Rand", symbol: "R" },
} as const;

export type CurrencyCode = keyof typeof ALL_CURRENCIES;
export const CURRENCY_CODES = Object.keys(ALL_CURRENCIES) as CurrencyCode[];

// Major currencies that can be DETECTED on web pages (source currencies)
export const MAJOR_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "CNY",
  "SEK",
  "NOK",
  "DKK",
] as const;

export type MajorCurrency = (typeof MAJOR_CURRENCIES)[number];

// Currency symbols mapping for detection (only major currencies)
export const CURRENCY_SYMBOLS: Record<string, MajorCurrency[]> = {
  "€": ["EUR"],
  $: ["USD", "CAD", "AUD", "NZD"],
  "£": ["GBP"],
  "¥": ["JPY", "CNY"],
  CHF: ["CHF"],
  CA$: ["CAD"],
  A$: ["AUD"],
  NZ$: ["NZD"],
  kr: ["SEK", "NOK", "DKK"],
  SEK: ["SEK"],
  NOK: ["NOK"],
  DKK: ["DKK"],
};

// Number format options for thousands/decimal separators
export const NUMBER_FORMATS = {
  "en-US": { name: "1,234.56 (US/UK)", locale: "en-US" },
  "de-DE": { name: "1.234,56 (Europe)", locale: "de-DE" },
  "fr-FR": { name: "1 234,56 (French)", locale: "fr-FR" },
  "de-CH": { name: "1'234.56 (Swiss)", locale: "de-CH" },
} as const;

export type NumberFormat = keyof typeof NUMBER_FORMATS;
export const NUMBER_FORMAT_CODES = Object.keys(
  NUMBER_FORMATS,
) as NumberFormat[];

export interface Settings {
  enabled: boolean;
  targetCurrency: CurrencyCode; // Can be ANY currency
  showOriginalPrice: boolean;
  highlightConverted: boolean;
  decimalPlaces: number;
  numberFormat: NumberFormat; // User's preferred number format
}

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CachedRates {
  rates: ExchangeRates;
  fetchedAt: number;
}

export interface Message {
  type: string;
  payload?: unknown;
}

export interface TabInfo {
  tabId: number;
  url: string;
}

export interface PageInfo {
  title: string;
  url: string;
  domain: string;
}

export interface ConversionResult {
  original: string;
  converted: string;
  fromCurrency: MajorCurrency;
  toCurrency: CurrencyCode;
  originalAmount: number;
  convertedAmount: number;
}
