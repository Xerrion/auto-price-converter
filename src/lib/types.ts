// Shared types for the Chrome extension

// Fallback currency metadata (backend provides the authoritative list)
export const ALL_CURRENCIES = {
  AUD: { name: "Australian Dollar", symbol: "A$" },
  BDT: { name: "Bangladeshi Taka", symbol: "৳" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  CAD: { name: "Canadian Dollar", symbol: "CA$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Renminbi Yuan", symbol: "¥" },
  CZK: { name: "Czech Koruna", symbol: "Kč" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  GEL: { name: "Georgian Lari", symbol: "₾" },
  GHS: { name: "Ghanaian Cedi", symbol: "GH₵" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  HUF: { name: "Hungarian Forint", symbol: "Ft" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  ILS: { name: "Israeli New Shekel", symbol: "₪" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  ISK: { name: "Icelandic Króna", symbol: "kr" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  KZT: { name: "Kazakhstani Tenge", symbol: "₸" },
  MXN: { name: "Mexican Peso", symbol: "MX$" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  NGN: { name: "Nigerian Naira", symbol: "₦" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  PLN: { name: "Polish Złoty", symbol: "zł" },
  RON: { name: "Romanian Leu", symbol: "lei" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  THB: { name: "Thai Baht", symbol: "฿" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  UAH: { name: "Ukrainian Hryvnia", symbol: "₴" },
  USD: { name: "United States Dollar", symbol: "$" },
  VND: { name: "Vietnamese Dong", symbol: "₫" },
  ZAR: { name: "South African Rand", symbol: "R" },
} as const;

export type CurrencyCode = string;
export const CURRENCY_CODES = Object.keys(ALL_CURRENCIES) as CurrencyCode[];

// Major currencies that can be DETECTED on web pages (source currencies)
export const MAJOR_CURRENCIES = [
  // Major Western
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "CNY",
  // Nordic
  "SEK",
  "NOK",
  "DKK",
  "ISK",
  // Eastern European
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "UAH",
  "TRY",
  "RUB",
  // Asia Pacific
  "INR",
  "KRW",
  "SGD",
  "HKD",
  "THB",
  "PHP",
  "IDR",
  "MYR",
  "BDT",
  "VND",
  "KZT",
  "GEL",
  // Americas
  "BRL",
  "MXN",
  // Middle East & Africa
  "ZAR",
  "ILS",
  "NGN",
  "GHS",
] as const;

export type MajorCurrency = (typeof MAJOR_CURRENCIES)[number];

// Currency symbols mapping for detection
// Maps symbols to possible currencies (first is default for ambiguous symbols)
export const CURRENCY_SYMBOLS: Readonly<Record<string, MajorCurrency[]>> = {
  // Single character symbols
  "€": ["EUR"],
  $: ["USD", "CAD", "AUD", "NZD", "MXN", "SGD", "HKD"],
  "£": ["GBP"],
  "¥": ["JPY", "CNY"],
  "₴": ["UAH"],
  "₺": ["TRY"],
  "₹": ["INR"],
  "₩": ["KRW"],
  "฿": ["THB"],
  "₪": ["ILS"],
  "₱": ["PHP"],
  "₦": ["NGN"],
  "₫": ["VND"],
  "₸": ["KZT"],
  "৳": ["BDT"],
  "₽": ["RUB"],
  "₾": ["GEL"],

  // Multi-character symbols
  "CA$": ["CAD"],
  "A$": ["AUD"],
  "NZ$": ["NZD"],
  "R$": ["BRL"],
  "S$": ["SGD"],
  "HK$": ["HKD"],
  "MX$": ["MXN"],
  "GH₵": ["GHS"],

  // Text-based symbols
  kr: ["SEK", "NOK", "DKK", "ISK"],
  "zł": ["PLN"],
  "Kč": ["CZK"],
  Ft: ["HUF"],
  lei: ["RON"],
  Rp: ["IDR"],
  RM: ["MYR"],
  R: ["ZAR"],
  CHF: ["CHF"],

  // ISO code symbols (for direct code matching)
  SEK: ["SEK"],
  NOK: ["NOK"],
  DKK: ["DKK"],
  ISK: ["ISK"],
};

// ============================================
// Derived detection constants (used by currencyDetector.ts)
// These are computed from CURRENCY_SYMBOLS to maintain DRY principle
// ============================================

// Helper functions for categorizing symbols
// Single char currency symbols are non-alphabetic (€, $, £, etc.)
// Alphabetic single chars like R (ZAR) need word boundary matching
const isSingleSymbol = (s: string): boolean =>
  s.length === 1 && !/[a-zA-Z]/.test(s);
const isMultiCharSymbol = (s: string): boolean => s.length > 1 && /[$₵]/.test(s);
const isTextSymbol = (s: string): boolean =>
  (s.length === 1 && /[a-zA-Z]/.test(s)) || // Single alphabetic chars (R for ZAR)
  (s.length > 1 && !/[$₵]/.test(s) && !/^[A-Z]{3}$/.test(s));
const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const symbolKeys = Object.keys(CURRENCY_SYMBOLS);

// Single character symbols (for regex character class) - excludes alphabetic chars
export const SINGLE_SYMBOLS = symbolKeys.filter(isSingleSymbol).map(escapeRegex);

// Multi-character symbols ending in $ or ₵ (must check before single $)
export const MULTI_CHAR_SYMBOLS = symbolKeys
  .filter(isMultiCharSymbol)
  .map(escapeRegex);

// Text-based symbols (need word boundary matching) - includes single alphabetic chars
export const TEXT_SYMBOLS = symbolKeys.filter(isTextSymbol);

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

// Theme options
export const THEMES = {
  system: { name: "System", icon: "💻" },
  light: { name: "Light", icon: "☀️" },
  dark: { name: "Dark", icon: "🌙" },
} as const;

export type Theme = keyof typeof THEMES;
export const THEME_OPTIONS = Object.keys(THEMES) as Theme[];

export interface Settings {
  enabled: boolean;
  targetCurrency: CurrencyCode; // Can be ANY currency
  showOriginalPrice: boolean;
  highlightConverted: boolean;
  decimalPlaces: number;
  numberFormat: NumberFormat; // User's preferred number format
  theme: Theme; // light, dark, or system
  exclusionList: ExclusionEntry[]; // URLs/domains excluded from conversion
}

// Exclusion list types for URL/domain blacklist feature
export type ExclusionType = "url" | "domain" | "domain-exact";

export interface ExclusionEntry {
  id: string; // Unique ID for removal
  pattern: string; // The URL or domain pattern
  type: ExclusionType; // How to match: exact URL, domain with subdomains, or domain only
  addedAt: string; // ISO timestamp when added
}

export interface ExchangeRates {
  base: string;
  date: string;
  fetchedAt?: string;
  rates: Record<string, number>;
}

export interface CachedRates {
  rates: ExchangeRates;
  fetchedAt: number;
}

export interface SymbolsResponse {
  provider: string;
  symbols: Record<string, string>;
}

export interface CachedSymbols {
  symbols: Record<string, string>;
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
