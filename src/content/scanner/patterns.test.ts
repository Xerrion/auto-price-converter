import { describe, it, expect } from "vitest";
import type { ExchangeRates } from "$lib/types";
import { buildPatterns, escapeRegex } from "./patterns";

describe("buildPatterns", () => {
  it("builds regex patterns and ISO set from rates", () => {
    const exchangeRates: ExchangeRates = {
      base: "EUR",
      date: "2024-01-01",
      rates: {
        EUR: 1,
        USD: 1.2,
        GBP: 0.8,
      },
    };

    const patterns = buildPatterns(exchangeRates);

    expect(patterns.isoCodes.has("USD")).toBe(true);
    expect(patterns.quickCheck.test("$10")).toBe(true);
    expect(patterns.singlePrice.test("USD 20")).toBe(true);
    expect(patterns.rangePrice.test("$10 - $20")).toBe(true);
  });
});

describe("escapeRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("$10.00*")).toBe("\\$10\\.00\\*");
  });
});
