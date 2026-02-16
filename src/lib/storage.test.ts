import { storage } from "#imports";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { CachedRates, CachedSymbols, Settings } from "./types";
import {
  DEFAULT_SETTINGS,
  getCachedRates,
  getCachedSymbols,
  getSettings,
  getStorageItem,
  normalizeSettings,
  saveSettings,
  setCachedRates,
  setCachedSymbols,
  setStorageItem,
} from "./storage";

const baseSettings: Settings = {
  ...DEFAULT_SETTINGS,
  targetCurrency: "USD",
};

describe("storage utilities", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("normalizes invalid settings values", () => {
    const normalized = normalizeSettings({
      enabled: "yes" as unknown as boolean,
      targetCurrency: "  " as unknown as string,
      showOriginalPrice: "no" as unknown as boolean,
      highlightConverted: "no" as unknown as boolean,
      decimalPlaces: 99 as unknown as number,
      numberFormat: "bad" as unknown as Settings["numberFormat"],
      theme: "neon" as unknown as Settings["theme"],
      exclusionList: [
        {
          id: "ok",
          pattern: "example.com",
          type: "domain",
          addedAt: new Date().toISOString(),
        },
        {
          id: 123,
          pattern: "",
          type: "invalid",
          addedAt: null,
        },
      ] as unknown as Settings["exclusionList"],
    });

    expect(normalized).toEqual({
      ...DEFAULT_SETTINGS,
      exclusionList: [
        {
          id: "ok",
          pattern: "example.com",
          type: "domain",
          addedAt: normalized.exclusionList[0].addedAt,
        },
      ],
    });
  });

  it("uses default exclusion list when provided value is not an array", () => {
    const normalized = normalizeSettings({
      exclusionList: "not-an-array" as unknown as Settings["exclusionList"],
    });

    expect(normalized.exclusionList).toEqual(DEFAULT_SETTINGS.exclusionList);
  });

  it("returns default settings when nothing saved", async () => {
    await storage.removeItem("sync:settings");
    await storage.removeItem("local:settings");

    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("saves settings to sync storage when available", async () => {
    await saveSettings(baseSettings);

    const stored = await storage.getItem<Settings>("sync:settings");
    expect(stored).toEqual(baseSettings);
  });

  it("falls back to local storage when sync read fails", async () => {
    const localSettings: Settings = { ...baseSettings, targetCurrency: "GBP" };
    await storage.setItem("local:settings", localSettings);

    const originalGetItem = storage.getItem.bind(storage);
    vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
      if (key.startsWith("sync:")) {
        throw new Error("sync down");
      }
      return originalGetItem(key as never);
    });

    const settings = await getSettings();
    expect(settings).toEqual(localSettings);
  });

  it("returns undefined when local storage is unavailable", async () => {
    const originalGetItem = storage.getItem.bind(storage);
    vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
      if (key.startsWith("sync:")) {
        throw new Error("sync down");
      }
      if (key.startsWith("local:")) {
        throw new Error("local down");
      }
      return originalGetItem(key as never);
    });

    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("falls back to local storage when sync write fails", async () => {
    const localOnly: Settings = { ...baseSettings, targetCurrency: "CAD" };
    const originalSetItem = storage.setItem.bind(storage);

    vi.spyOn(storage, "setItem").mockImplementation(async (key, value) => {
      if (key.startsWith("sync:")) {
        throw new Error("sync down");
      }
      return originalSetItem(key as never, value as never);
    });

    await saveSettings(localOnly);

    const stored = await storage.getItem<Settings>("local:settings");
    expect(stored).toEqual(localOnly);
  });

  it("gets and sets generic storage items", async () => {
    await setStorageItem("sample", { hello: "world" });

    const stored = await getStorageItem<{ hello: string }>("sample");
    expect(stored).toEqual({ hello: "world" });
  });

  it("returns cached rates when still fresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T00:00:00Z"));

    const cached: CachedRates = {
      fetchedAt: Date.now(),
      rates: {
        base: "EUR",
        date: "2024-01-02",
        fetchedAt: new Date().toISOString(),
        rates: { EUR: 1, USD: 1.1 },
      },
    };

    await setCachedRates(cached);

    const result = await getCachedRates();
    expect(result).toEqual(cached);
  });

  it("returns undefined for expired cached rates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-03T00:00:00Z"));

    const cached: CachedRates = {
      fetchedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      rates: {
        base: "EUR",
        date: "2024-01-01",
        fetchedAt: new Date().toISOString(),
        rates: { EUR: 1, USD: 1.1 },
      },
    };

    await setCachedRates(cached);

    const result = await getCachedRates();
    expect(result).toBeUndefined();
  });

  it("returns undefined when cached rates are missing fetchedAt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T00:00:00Z"));

    const cached: CachedRates = {
      fetchedAt: Date.now(),
      rates: {
        base: "EUR",
        date: "2024-01-02",
        rates: { EUR: 1, USD: 1.1 },
      },
    };

    await setCachedRates(cached);

    const result = await getCachedRates();
    expect(result).toBeUndefined();
  });

  it("returns cached symbols when still fresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T00:00:00Z"));

    const cached: CachedSymbols = {
      fetchedAt: Date.now(),
      symbols: { USD: "$" },
    };

    await setCachedSymbols(cached);

    const result = await getCachedSymbols();
    expect(result).toEqual(cached);
  });

  it("returns undefined when cached symbols are empty", async () => {
    const cached: CachedSymbols = {
      fetchedAt: Date.now(),
      symbols: {},
    };

    await setCachedSymbols(cached);

    const result = await getCachedSymbols();
    expect(result).toBeUndefined();
  });

  it("returns undefined for expired cached symbols", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-03T00:00:00Z"));

    const cached: CachedSymbols = {
      fetchedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      symbols: { USD: "$" },
    };

    await setCachedSymbols(cached);

    const result = await getCachedSymbols();
    expect(result).toBeUndefined();
  });
});
