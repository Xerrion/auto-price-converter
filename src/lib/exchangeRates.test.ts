import { describe, it, expect } from "vitest";
import { convertCurrency } from "./exchangeRates";
import type { ExchangeRates } from "./types";

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
