// Structured data extraction from JSON-LD
// Parses JSON-LD scripts on the page to extract currency information

export interface StructuredDataResult {
  pageCurrency: string | null; // Most common priceCurrency found
}

/**
 * Extract currency information from JSON-LD structured data on the page
 *
 * Uses simple recursive traversal to find priceCurrency properties.
 * This approach is more reliable than using jsonld.flatten() because:
 * 1. It doesn't require fetching external context definitions
 * 2. It works with any JSON-LD structure (Shopify, WooCommerce, Magento, etc.)
 * 3. It's faster and has no external dependencies
 */
export async function extractStructuredData(): Promise<StructuredDataResult> {
  const currencies: string[] = [];

  // Find all JSON-LD scripts
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );

  for (const script of scripts) {
    try {
      const content = script.textContent;
      if (!content) continue;

      const data = JSON.parse(content) as unknown;
      extractCurrenciesFromData(data, currencies);
    } catch {
      // Skip malformed JSON-LD
      continue;
    }
  }

  // Find the most common currency
  const pageCurrency = findMostCommon(currencies);

  return { pageCurrency };
}

/**
 * Extract currencies from parsed JSON-LD data
 * Handles both direct objects and @graph arrays
 */
function extractCurrenciesFromData(data: unknown, currencies: string[]): void {
  if (!data || typeof data !== "object") return;

  // Handle @graph structure (common in WooCommerce, some Shopify)
  if ("@graph" in data && Array.isArray((data as Record<string, unknown>)["@graph"])) {
    const graph = (data as Record<string, unknown>)["@graph"] as unknown[];
    for (const node of graph) {
      if (node && typeof node === "object") {
        extractCurrenciesRecursive(node as Record<string, unknown>, currencies);
      }
    }
  } else {
    extractCurrenciesRecursive(data as Record<string, unknown>, currencies);
  }
}

/**
 * Recursively extract priceCurrency values from an object
 */
function extractCurrenciesRecursive(
  obj: Record<string, unknown>,
  currencies: string[],
): void {
  if (!obj || typeof obj !== "object") return;

  // Check for priceCurrency property
  const currency = obj["priceCurrency"];
  if (typeof currency === "string" && currency.length === 3) {
    currencies.push(currency.toUpperCase());
  }

  // Recurse into nested objects and arrays
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          extractCurrenciesRecursive(item as Record<string, unknown>, currencies);
        }
      }
    } else if (value && typeof value === "object") {
      extractCurrenciesRecursive(value as Record<string, unknown>, currencies);
    }
  }
}

/**
 * Find the most common string in an array
 */
function findMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;

  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  let maxCount = 0;
  let mostCommon: string | null = null;

  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  }

  return mostCommon;
}
