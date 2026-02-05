// Chrome storage utilities

import type { Settings, CachedRates, CachedSymbols, ExclusionEntry } from "./types";
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

export function normalizeSettings(settings?: Partial<Settings> | null): Settings {
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
  return new Promise((resolve) => {
    chrome.storage.sync.get(["settings"], (result) => {
      resolve(normalizeSettings(result.settings as Partial<Settings> | null));
    });
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings }, resolve);
  });
}

export async function getCachedRates(): Promise<CachedRates | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["cachedRates"], (result) => {
      const cached = result.cachedRates as CachedRates | undefined;

      // Check if cache is still valid
      if (
        cached &&
        Date.now() - cached.fetchedAt < CACHE_DURATION_MS &&
        cached.rates?.fetchedAt
      ) {
        resolve(cached);
      } else {
        resolve(undefined);
      }
    });
  });
}

export async function setCachedRates(rates: CachedRates): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ cachedRates: rates }, resolve);
  });
}

export async function getCachedSymbols(): Promise<CachedSymbols | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["cachedSymbols"], (result) => {
      const cached = result.cachedSymbols as CachedSymbols | undefined;

      if (
        cached &&
        Date.now() - cached.fetchedAt < CACHE_DURATION_MS &&
        cached.symbols &&
        Object.keys(cached.symbols).length > 0
      ) {
        resolve(cached);
      } else {
        resolve(undefined);
      }
    });
  });
}

export async function setCachedSymbols(symbols: CachedSymbols): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ cachedSymbols: symbols }, resolve);
  });
}

export async function getStorageItem<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, resolve);
  });
}
