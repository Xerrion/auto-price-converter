// CSS heuristic selectors for finding price elements
// These broad patterns catch most e-commerce price containers

/**
 * Class and attribute patterns that commonly contain prices
 * Used for Phase 1: Fast CSS pre-filter
 *
 * NOTE: Intentionally excludes overly broad selectors like [class*="value"]
 * which match too many non-price elements (forms, documentation, etc.)
 */
export const PRICE_CLASS_PATTERNS = [
  // Generic price indicators
  '[class*="price"]',
  '[class*="Price"]',
  '[class*="PRICE"]',
  '[class*="cost"]',
  '[class*="Cost"]',
  '[class*="amount"]',
  '[class*="Amount"]',
  '[class*="total"]',
  '[class*="Total"]',
  '[class*="money"]',
  '[class*="Money"]',
  '[class*="currency"]',
  '[class*="Currency"]',
  // NOTE: Removed [class*="value"] and [class*="Value"] - too broad,
  // matches forms, documentation, and many non-price elements

  // Data attributes - only specific price-related ones
  "[data-price]",
  "[data-cost]",
  "[data-amount]",
  // NOTE: Removed [data-value] - too broad, matches many non-price elements
  '[data-qa*="price"]',
  '[data-qa*="Price"]',
  '[data-testid*="price"]',
  '[data-testid*="Price"]',

  // Schema.org / structured data
  '[itemprop="price"]',
  '[itemprop="lowPrice"]',
  '[itemprop="highPrice"]',
  '[itemprop="priceCurrency"]',

  // Common e-commerce class names
  ".product-price",
  ".cart-total",
  ".checkout-total",
  ".sale-price",
  ".regular-price",
  ".special-price",
  ".discount-price",
  ".final-price",
  ".current-price",
  ".was-price",
  ".now-price",
  ".list-price",
  ".our-price",
  ".your-price",

  // Platform-specific (common ones)
  ".a-price", // Amazon
  ".a-offscreen", // Amazon screen reader price
  ".woocommerce-Price-amount", // WooCommerce
  ".shopify-payment-button__price", // Shopify
];

/**
 * Combined selector for querySelectorAll
 */
export const LIKELY_PRICE_SELECTORS = PRICE_CLASS_PATTERNS.join(", ");

/**
 * Tags that should never contain prices (skip during scanning)
 */
export const EXCLUDED_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "svg",
  "textarea",
  "input",
  "select",
  "button",
  "code",
  "pre",
  "head",
  "meta",
  "link",
]);

/**
 * Classes indicating screen reader / accessibility hidden elements
 * These often contain duplicate price text
 */
export const HIDDEN_CLASSES = [
  "sr-only",
  "visually-hidden",
  "offscreen",
  "screen-reader",
  "hidden",
  "hide",
];

/**
 * Selectors for product title/name elements (avoid false positives)
 */
export const PRODUCT_TITLE_SELECTORS = [
  '[itemprop="name"]',
  '[data-e2e="product-name"]',
  ".product-name",
  ".product-title",
  ".productName",
  "#productItemTitle h1",
  "#productItemTitle h2",
].join(", ");
