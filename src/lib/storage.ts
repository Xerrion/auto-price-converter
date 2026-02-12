// Chrome storage utilities

import type {
  Settings,
  CachedRates,
  CachedSymbols,
  ExclusionEntry,
} from "./types";
import { NUMBER_FORMATS, THEMES } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  targetCurrency: "EUR",
  showOriginalPrice: true,
  highlightConverted: true,
  decimalPlaces: 2,
  numberFormat: "en-US",
  theme: "system",
  exclusionList: [],
};

// Cache duration: 24 hours (backend sync interval)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

async function getSyncOrLocalItem<T>(key: string): Promise<T | undefined> {
  try {
    const result = await browser.storage.sync.get([key]);
    return result[key] as T | undefined;
  } catch (error) {
    console.warn(
      "storage.sync unavailable, falling back to storage.local",
      error,
    );
    const result = await browser.storage.local.get([key]);
    return result[key] as T | undefined;
  }
}

async function setSyncOrLocalItem<T>(key: string, value: T): Promise<void> {
  try {
    await browser.storage.sync.set({ [key]: value });
  } catch (error) {
    console.warn(
      "storage.sync unavailable, falling back to storage.local",
      error,
    );
    await browser.storage.local.set({ [key]: value });
  }
}

export function normalizeSettings(
  settings?: Partial<Settings> | null,
): Settings {
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
  } as Settings;

  if (typeof merged.enabled !== "boolean") {
    merged.enabled = DEFAULT_SETTINGS.enabled;
  }
  if (typeof merged.showOriginalPrice !== "boolean") {
    merged.showOriginalPrice = DEFAULT_SETTINGS.showOriginalPrice;
  }
  if (typeof merged.highlightConverted !== "boolean") {
    merged.highlightConverted = DEFAULT_SETTINGS.highlightConverted;
  }
  if (
    typeof merged.decimalPlaces !== "number" ||
    ![0, 1, 2].includes(merged.decimalPlaces)
  ) {
    merged.decimalPlaces = DEFAULT_SETTINGS.decimalPlaces;
  }
  if (!NUMBER_FORMATS[merged.numberFormat]) {
    merged.numberFormat = DEFAULT_SETTINGS.numberFormat;
  }
  if (
    typeof merged.targetCurrency !== "string" ||
    merged.targetCurrency.trim().length !== 3
  ) {
    merged.targetCurrency = DEFAULT_SETTINGS.targetCurrency;
  }
  if (!THEMES[merged.theme]) {
    merged.theme = DEFAULT_SETTINGS.theme;
  }

  // Validate exclusionList - ensure it's an array of valid entries
  if (!Array.isArray(merged.exclusionList)) {
    merged.exclusionList = DEFAULT_SETTINGS.exclusionList;
  } else {
    // Filter out invalid entries
    merged.exclusionList = merged.exclusionList.filter(
      (entry): entry is ExclusionEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.pattern === "string" &&
        entry.pattern.length > 0 &&
        ["url", "domain", "domain-exact"].includes(entry.type) &&
        typeof entry.addedAt === "string",
    );
  }

  return merged;
}

export async function getSettings(): Promise<Settings> {
  const settings = await getSyncOrLocalItem<Partial<Settings> | null>(
    "settings",
  );
  return normalizeSettings(settings ?? null);
}

export async function saveSettings(settings: Settings): Promise<void> {
  return setSyncOrLocalItem("settings", settings);
}

export async function getCachedRates(): Promise<CachedRates | undefined> {
  const result = await browser.storage.local.get(["cachedRates"]);
  const cached = result.cachedRates as CachedRates | undefined;

  if (
    cached &&
    Date.now() - cached.fetchedAt < CACHE_DURATION_MS &&
    cached.rates?.fetchedAt
  ) {
    return cached;
  }
  return undefined;
}

export async function setCachedRates(rates: CachedRates): Promise<void> {
  return browser.storage.local.set({ cachedRates: rates });
}

export async function getCachedSymbols(): Promise<CachedSymbols | undefined> {
  const result = await browser.storage.local.get(["cachedSymbols"]);
  const cached = result.cachedSymbols as CachedSymbols | undefined;

  if (
    cached &&
    Date.now() - cached.fetchedAt < CACHE_DURATION_MS &&
    cached.symbols &&
    Object.keys(cached.symbols).length > 0
  ) {
    return cached;
  }
  return undefined;
}

export async function setCachedSymbols(symbols: CachedSymbols): Promise<void> {
  return browser.storage.local.set({ cachedSymbols: symbols });
}

export async function getStorageItem<T>(key: string): Promise<T | undefined> {
  return getSyncOrLocalItem<T>(key);
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  return setSyncOrLocalItem(key, value);
}
