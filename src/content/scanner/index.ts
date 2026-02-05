// Scanner module exports
// Provides the hybrid price detection system

export { SmartScanner, type ScannerOptions } from "./SmartScanner";
export { buildPatterns, type PricePatterns } from "./patterns";
export { detectPrices, containsCurrencyIndicators, type DetectedPrice } from "./priceDetector";
export { extractVisibleText, getTextNodes, isElementVisible } from "./textExtractor";
export { replacePrices, isConverted, isInsideConverted } from "./replacer";
export { LIKELY_PRICE_SELECTORS, EXCLUDED_TAGS, HIDDEN_CLASSES } from "./selectors";
