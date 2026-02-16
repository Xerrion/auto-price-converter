import { describe, it, expect } from "vitest";
import type { ExchangeRates } from "$lib/types";
import type { PricePatterns } from "./patterns";
import type { PageContext } from "../context";
import { buildPatterns } from "./patterns";
import { detectPrices, containsCurrencyIndicators } from "./priceDetector";

describe("priceDetector", () => {
  const exchangeRates: ExchangeRates = {
    base: "EUR",
    date: "2024-01-01",
    rates: {
      EUR: 1,
      USD: 1.1,
      GBP: 0.9,
    },
  };

  const context: PageContext = {
    locale: "en-US",
    localeSource: "html-lang",
    currency: "USD",
    currencySource: "dom",
    currencyConfidence: "low",
  };

  it("detects range and single prices without overlap", () => {
    const patterns = buildPatterns(exchangeRates);
    const text = "$10 - $20 and USD 30";

    const results = detectPrices(text, context, patterns);

    expect(results).toHaveLength(2);
    expect(results[0].isRange).toBe(true);
    expect(results[0].prices).toHaveLength(2);
    expect(results[0].prices[0].currency).toBe("USD");
    expect(results[1].isRange).toBe(false);
    expect(results[1].prices[0].amount).toBe(30);
  });

  it("reports currency indicators quickly", () => {
    const patterns = buildPatterns(exchangeRates);

    expect(containsCurrencyIndicators("hello world", patterns)).toBe(false);
    expect(containsCurrencyIndicators("EUR 9", patterns)).toBe(true);
  });

  it("ignores unsupported currencies and zero amounts", () => {
    const patterns = buildPatterns(exchangeRates);
    const text = "10 CHF and $0";

    const results = detectPrices(text, context, patterns);

    expect(results).toHaveLength(0);
  });

  it("uses the first currency when range omits the second symbol", () => {
    const patterns = buildPatterns(exchangeRates);
    const text = "USD 10 - 20 CHF";

    const results = detectPrices(text, context, patterns);

    expect(results).toHaveLength(1);
    expect(results[0].isRange).toBe(true);
    expect(results[0].prices[1].currency).toBe("USD");
  });

  it("ignores matches with insufficient capture groups", () => {
    const patterns: PricePatterns = {
      quickCheck: /foo/i,
      singlePrice: /(foo)/gi,
      rangePrice: /$^/g,
      isoCodes: new Set(["USD"]),
    };

    const results = detectPrices("foo", context, patterns);

    expect(results).toHaveLength(0);
  });

  it("ignores matches missing currency or amount", () => {
    const patterns: PricePatterns = {
      quickCheck: /\d+/,
      singlePrice: /(\d+)(\d+)/g,
      rangePrice: /$^/g,
      isoCodes: new Set(["USD"]),
    };

    const results = detectPrices("1234", context, patterns);

    expect(results).toHaveLength(0);
  });
});
