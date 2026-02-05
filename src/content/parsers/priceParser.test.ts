import { describe, it, expect } from "vitest";
import { parsePrice, normalizeAmount, resolveCurrency } from "./priceParser";

describe("normalizeAmount", () => {
  it("parses US format (1,234.56)", () => {
    expect(normalizeAmount("1,234.56")).toBe(1234.56);
  });

  it("parses European format (1.234,56)", () => {
    expect(normalizeAmount("1.234,56")).toBe(1234.56);
  });

  it("parses simple integers", () => {
    expect(normalizeAmount("100")).toBe(100);
  });

  it("parses decimals without thousands separator", () => {
    expect(normalizeAmount("99.99")).toBe(99.99);
  });

  it("handles whitespace", () => {
    expect(normalizeAmount("  1,000  ")).toBe(1000);
  });
});

describe("resolveCurrency", () => {
  it("resolves currency codes", () => {
    expect(resolveCurrency("USD")).toBe("USD");
    expect(resolveCurrency("EUR")).toBe("EUR");
    expect(resolveCurrency("GBP")).toBe("GBP");
  });

  it("resolves lowercase currency codes", () => {
    expect(resolveCurrency("usd")).toBe("USD");
    expect(resolveCurrency("eur")).toBe("EUR");
  });

  it("resolves currency symbols", () => {
    expect(resolveCurrency("$")).toBe("USD");
    expect(resolveCurrency("€")).toBe("EUR");
    expect(resolveCurrency("£")).toBe("GBP");
    expect(resolveCurrency("¥")).toBe("JPY");
  });

  it("resolves multi-char symbols", () => {
    expect(resolveCurrency("CA$")).toBe("CAD");
    expect(resolveCurrency("A$")).toBe("AUD");
    expect(resolveCurrency("NZ$")).toBe("NZD");
  });

  it("returns null for unknown currencies", () => {
    expect(resolveCurrency("XYZ")).toBeNull();
    expect(resolveCurrency("???")).toBeNull();
  });
});

describe("parsePrice", () => {
  it("parses symbol before amount ($10.50)", () => {
    const result = parsePrice("$10.50");
    expect(result).toEqual({ amount: 10.5, currency: "USD" });
  });

  it("parses symbol after amount (10.50€)", () => {
    const result = parsePrice("10.50€");
    expect(result).toEqual({ amount: 10.5, currency: "EUR" });
  });

  it("parses symbol after amount with space (10.50 €)", () => {
    const result = parsePrice("10.50 €");
    expect(result).toEqual({ amount: 10.5, currency: "EUR" });
  });

  it("parses currency code before (USD 100)", () => {
    const result = parsePrice("USD 100");
    expect(result).toEqual({ amount: 100, currency: "USD" });
  });

  it("parses currency code after (100 EUR)", () => {
    const result = parsePrice("100 EUR");
    expect(result).toEqual({ amount: 100, currency: "EUR" });
  });

  it("parses multi-char symbols (CA$50)", () => {
    const result = parsePrice("CA$50");
    expect(result).toEqual({ amount: 50, currency: "CAD" });
  });

  it("parses prices with thousands separators ($1,234.56)", () => {
    const result = parsePrice("$1,234.56");
    expect(result).toEqual({ amount: 1234.56, currency: "USD" });
  });

  it("returns null for invalid prices", () => {
    expect(parsePrice("hello")).toBeNull();
    expect(parsePrice("$0")).toBeNull();
    expect(parsePrice("$-10")).toBeNull();
  });

  it("does not match model numbers followed by currency symbol", () => {
    // "KAYANO 14£140" - the 14 should not be matched, only £140
    const result = parsePrice("KAYANO 14£140");
    // Should match £140, not 14£
    expect(result).toEqual({ amount: 140, currency: "GBP" });
  });

  it("does not match product IDs as prices", () => {
    // Plain numbers without currency symbols should not match
    expect(parsePrice("Model 14")).toBeNull();
    expect(parsePrice("GEL-KAYANO 14")).toBeNull();
  });

  describe("new currency symbols", () => {
    it("parses ₦ (Nigerian Naira)", () => {
      const result = parsePrice("₦ 6,907");
      expect(result).toEqual({ amount: 6907, currency: "NGN" });
    });

    it("parses ₫ (Vietnamese Dong) - postfix", () => {
      const result = parsePrice("1005000 ₫");
      expect(result).toEqual({ amount: 1005000, currency: "VND" });
    });

    it("parses ₸ (Kazakhstani Tenge) - postfix", () => {
      const result = parsePrice("1000 ₸");
      expect(result).toEqual({ amount: 1000, currency: "KZT" });
    });

    it("parses ৳ (Bangladeshi Taka)", () => {
      const result = parsePrice("৳699");
      expect(result).toEqual({ amount: 699, currency: "BDT" });
    });

    it("parses ₽ (Russian Ruble) - postfix", () => {
      const result = parsePrice("1000 ₽");
      expect(result).toEqual({ amount: 1000, currency: "RUB" });
    });

    it("parses ₾ (Georgian Lari)", () => {
      const result = parsePrice("₾100");
      expect(result).toEqual({ amount: 100, currency: "GEL" });
    });

    it("parses GH₵ (Ghanaian Cedi)", () => {
      const result = parsePrice("GH₵ 47.00");
      expect(result).toEqual({ amount: 47, currency: "GHS" });
    });
  });
});
