// URL/Domain exclusion utilities
// Handles checking if a URL matches exclusion patterns

import type { ExclusionEntry, ExclusionType } from "./types";

/**
 * Check if a URL should be excluded from price conversion
 *
 * @param url - The full URL to check
 * @param exclusionList - List of exclusion entries
 * @returns true if the URL should be excluded
 */
export function isUrlExcluded(
  url: string,
  exclusionList: ExclusionEntry[],
): boolean {
  if (!exclusionList || exclusionList.length === 0) return false;

  const normalizedUrl = normalizeUrl(url);
  const urlDomain = extractDomain(url);

  for (const entry of exclusionList) {
    switch (entry.type) {
      case "url":
        // Exact URL match (normalized)
        if (normalizeUrl(entry.pattern) === normalizedUrl) {
          return true;
        }
        break;

      case "domain":
        // Domain match including subdomains (*.example.com)
        if (matchesDomain(urlDomain, entry.pattern, true)) {
          return true;
        }
        break;

      case "domain-exact":
        // Exact domain match only (example.com, not sub.example.com)
        if (matchesDomain(urlDomain, entry.pattern, false)) {
          return true;
        }
        break;
    }
  }

  return false;
}

/**
 * Extract the domain (hostname) from a URL
 *
 * @param url - The full URL
 * @returns The domain/hostname in lowercase
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?([^\/:\?#]+)/i);
    return match ? match[1].toLowerCase() : "";
  }
}

/**
 * Extract the full URL without hash fragment
 *
 * @param url - The full URL
 * @returns URL without hash, or empty string if invalid
 */
export function extractUrlWithoutHash(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove hash fragment
    urlObj.hash = "";
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Normalize a URL for comparison
 * Removes trailing slashes, lowercases, removes hash fragments
 *
 * @param url - The URL to normalize
 * @returns Normalized URL string
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Lowercase the hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();
    // Remove hash fragment
    urlObj.hash = "";
    // Get the URL string
    let normalized = urlObj.toString();
    // Remove trailing slash (but keep if it's just the origin)
    if (normalized.endsWith("/") && urlObj.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    // If parsing fails, just return lowercase trimmed
    return url.toLowerCase().trim();
  }
}

/**
 * Check if a domain matches a pattern
 *
 * @param urlDomain - The domain from the URL (e.g., "sub.example.com")
 * @param pattern - The pattern to match (e.g., "example.com")
 * @param includeSubdomains - If true, "sub.example.com" matches "example.com"
 * @returns true if the domain matches
 */
export function matchesDomain(
  urlDomain: string,
  pattern: string,
  includeSubdomains: boolean,
): boolean {
  const normalizedDomain = urlDomain.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  // Remove www. prefix for more intuitive matching
  const domainWithoutWww = normalizedDomain.replace(/^www\./, "");
  const patternWithoutWww = normalizedPattern.replace(/^www\./, "");

  if (includeSubdomains) {
    // Match exact domain or any subdomain
    // "example.com" matches "example.com", "www.example.com", "sub.example.com"
    return (
      domainWithoutWww === patternWithoutWww ||
      domainWithoutWww.endsWith("." + patternWithoutWww)
    );
  } else {
    // Exact match only (with or without www)
    return domainWithoutWww === patternWithoutWww;
  }
}

/**
 * Generate a unique ID for an exclusion entry
 *
 * @returns A unique string ID
 */
export function generateExclusionId(): string {
  return `excl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new exclusion entry
 *
 * @param pattern - The URL or domain pattern
 * @param type - The type of exclusion
 * @returns A new ExclusionEntry
 */
export function createExclusionEntry(
  pattern: string,
  type: ExclusionType,
): ExclusionEntry {
  return {
    id: generateExclusionId(),
    pattern: type === "url" ? normalizeUrl(pattern) : extractDomain(pattern),
    type,
    addedAt: new Date().toISOString(),
  };
}

/**
 * Get a human-readable label for an exclusion type
 *
 * @param type - The exclusion type
 * @returns Human-readable label
 */
export function getExclusionTypeLabel(type: ExclusionType): string {
  switch (type) {
    case "url":
      return "Exact URL";
    case "domain":
      return "Domain + Subdomains";
    case "domain-exact":
      return "Domain Only";
  }
}

/**
 * Check if an exclusion entry already exists for a pattern
 *
 * @param pattern - The pattern to check
 * @param type - The exclusion type
 * @param exclusionList - The current exclusion list
 * @returns true if a matching entry exists
 */
export function exclusionExists(
  pattern: string,
  type: ExclusionType,
  exclusionList: ExclusionEntry[],
): boolean {
  const normalizedPattern =
    type === "url" ? normalizeUrl(pattern) : extractDomain(pattern).toLowerCase();

  return exclusionList.some(
    (entry) =>
      entry.type === type &&
      (entry.type === "url"
        ? normalizeUrl(entry.pattern) === normalizedPattern
        : entry.pattern.toLowerCase() === normalizedPattern),
  );
}
