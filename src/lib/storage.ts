// Chrome storage utilities

import type { Settings, CachedRates } from "./types";
import { ALL_CURRENCIES, NUMBER_FORMATS, THEMES } from "./types";

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  targetCurrency: "EUR",
  showOriginalPrice: true,
  highlightConverted: true,
  decimalPlaces: 2,
  numberFormat: "en-US",
  theme: "system",
};

// Cache duration: 24 hours (rates are updated daily around 16:00 CET)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeSettings(settings?: Partial<Settings> | null): Settings {
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
  if (!ALL_CURRENCIES[merged.targetCurrency]) {
    merged.targetCurrency = DEFAULT_SETTINGS.targetCurrency;
  }
  if (!THEMES[merged.theme]) {
    merged.theme = DEFAULT_SETTINGS.theme;
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
      if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
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
