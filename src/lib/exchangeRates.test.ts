import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  getCachedRates: vi.fn(),
  setCachedRates: vi.fn(),
}));

import {
  convertCurrency,
  fetchLatestRates,
  getExchangeRates,
} from "./exchangeRates";
import type { ExchangeRates } from "./types";
import { getCachedRates, setCachedRates } from "./storage";

const mockGetCachedRates = vi.mocked(getCachedRates);
const mockSetCachedRates = vi.mocked(setCachedRates);

const mockRates: ExchangeRates = {
  base: "EUR",
  date: "2024-01-01",
  rates: {
    EUR: 1,
    USD: 1.1,
    GBP: 0.85,
    JPY: 160,
    CAD: 1.45,
    AUD: 1.65,
    CHF: 0.95,
    CNY: 7.8,
    SEK: 11.2,
    NOK: 11.5,
    DKK: 7.45,
    NZD: 1.75,
  },
};

describe("convertCurrency", () => {
  it("returns same amount for same currency", () => {
    expect(convertCurrency(100, "USD", "USD", mockRates)).toBe(100);
  });

  it("converts EUR to USD", () => {
    // 100 EUR * 1.1 = 110 USD
    expect(convertCurrency(100, "EUR", "USD", mockRates)).toBe(110);
  });

  it("converts USD to EUR", () => {
    // 110 USD / 1.1 = 100 EUR
    expect(convertCurrency(110, "USD", "EUR", mockRates)).toBe(100);
  });

  it("converts USD to GBP (cross rate)", () => {
    // 100 USD -> EUR: 100 / 1.1 = 90.909...
    // EUR -> GBP: 90.909... * 0.85 = 77.27...
    const result = convertCurrency(100, "USD", "GBP", mockRates);
    expect(result).toBeCloseTo(77.27, 1);
  });

  it("converts large amounts", () => {
    const result = convertCurrency(1000000, "EUR", "JPY", mockRates);
    expect(result).toBe(160000000);
  });

  it("handles small amounts", () => {
    const result = convertCurrency(0.01, "EUR", "USD", mockRates);
    expect(result).toBeCloseTo(0.011, 3);
  });

  it("throws for missing currency rates", () => {
    expect(() =>
      convertCurrency(100, "EUR", "XYZ" as any, mockRates),
    ).toThrow();
  });
});

describe("fetchLatestRates", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized exchange rates", async () => {
    (globalThis.fetch as Mock).mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({
        base: "EUR",
        date: "2024-02-01",
        fetched_at: "2024-02-01T00:00:00Z",
        rates: { USD: 1.2 },
      }),
    } as Response);

    await expect(fetchLatestRates()).resolves.toEqual({
      base: "EUR",
      date: "2024-02-01",
      fetchedAt: "2024-02-01T00:00:00Z",
      rates: { EUR: 1, USD: 1.2 },
    });
  });

  it("throws when response is not ok", async () => {
    (globalThis.fetch as Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({}),
    } as Response);

    await expect(fetchLatestRates()).rejects.toThrow(
      "Failed to fetch exchange rates: Server Error",
    );
  });

  it("throws when backend returns non-EUR base", async () => {
    (globalThis.fetch as Mock).mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({
        base: "USD",
        date: "2024-02-01",
        rates: { EUR: 0.9 },
      }),
    } as Response);

    await expect(fetchLatestRates()).rejects.toThrow(
      "Unexpected base currency from backend: USD",
    );
  });

  it("uses configured API base", async () => {
    const base =
      import.meta.env.VITE_RATES_API_BASE ?? "https://apc-api.up.railway.app";

    (globalThis.fetch as Mock).mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({
        base: "EUR",
        date: "2024-02-01",
        rates: { USD: 1.2 },
      }),
    } as Response);

    await fetchLatestRates();
    expect(globalThis.fetch).toHaveBeenCalledWith(`${base}/rates/latest`);
  });
});

describe("getExchangeRates", () => {
  beforeEach(() => {
    mockGetCachedRates.mockReset();
    mockSetCachedRates.mockReset();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns cached rates when available", async () => {
    mockGetCachedRates.mockResolvedValue({
      fetchedAt: Date.now(),
      rates: mockRates,
    });

    await expect(getExchangeRates()).resolves.toEqual(mockRates);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fetches and caches rates when cache is missing", async () => {
    mockGetCachedRates.mockResolvedValue(undefined);
    (globalThis.fetch as Mock).mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: async () => ({
        base: "EUR",
        date: "2024-02-01",
        rates: { USD: 1.2 },
      }),
    } as Response);

    const rates = await getExchangeRates();
    expect(rates.base).toBe("EUR");
    expect(rates.rates.USD).toBe(1.2);
    expect(mockSetCachedRates).toHaveBeenCalledTimes(1);
  });
});
