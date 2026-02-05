import { describe, it, expect } from "vitest";
import { resolveCurrency } from "./currencyResolver";

describe("resolveCurrency", () => {
  describe("direct ISO code match", () => {
    it("resolves uppercase currency codes", () => {
      expect(resolveCurrency("EUR")).toBe("EUR");
      expect(resolveCurrency("USD")).toBe("USD");
      expect(resolveCurrency("GBP")).toBe("GBP");
      expect(resolveCurrency("JPY")).toBe("JPY");
    });

    it("resolves lowercase currency codes", () => {
      expect(resolveCurrency("eur")).toBe("EUR");
      expect(resolveCurrency("usd")).toBe("USD");
      expect(resolveCurrency("gbp")).toBe("GBP");
    });

    it("resolves mixed case currency codes", () => {
      expect(resolveCurrency("Eur")).toBe("EUR");
      expect(resolveCurrency("Usd")).toBe("USD");
    });

    it("resolves all major currencies", () => {
      expect(resolveCurrency("UAH")).toBe("UAH");
      expect(resolveCurrency("PLN")).toBe("PLN");
      expect(resolveCurrency("CZK")).toBe("CZK");
      expect(resolveCurrency("HUF")).toBe("HUF");
      expect(resolveCurrency("RON")).toBe("RON");
      expect(resolveCurrency("TRY")).toBe("TRY");
      expect(resolveCurrency("INR")).toBe("INR");
      expect(resolveCurrency("KRW")).toBe("KRW");
      expect(resolveCurrency("BRL")).toBe("BRL");
      expect(resolveCurrency("MXN")).toBe("MXN");
    });
  });

  describe("multi-character symbols", () => {
    it("resolves CA$ to CAD", () => {
      expect(resolveCurrency("CA$")).toBe("CAD");
    });

    it("resolves A$ to AUD", () => {
      expect(resolveCurrency("A$")).toBe("AUD");
    });

    it("resolves NZ$ to NZD", () => {
      expect(resolveCurrency("NZ$")).toBe("NZD");
    });

    it("resolves other multi-char symbols", () => {
      expect(resolveCurrency("R$")).toBe("BRL");
      expect(resolveCurrency("S$")).toBe("SGD");
      expect(resolveCurrency("HK$")).toBe("HKD");
      expect(resolveCurrency("MX$")).toBe("MXN");
    });
  });

  describe("single character symbols", () => {
    it("resolves € to EUR", () => {
      expect(resolveCurrency("€")).toBe("EUR");
    });

    it("resolves £ to GBP", () => {
      expect(resolveCurrency("£")).toBe("GBP");
    });

    it("resolves unique currency symbols", () => {
      expect(resolveCurrency("₴")).toBe("UAH");
      expect(resolveCurrency("₺")).toBe("TRY");
      expect(resolveCurrency("₹")).toBe("INR");
      expect(resolveCurrency("₩")).toBe("KRW");
      expect(resolveCurrency("฿")).toBe("THB");
      expect(resolveCurrency("₪")).toBe("ILS");
      expect(resolveCurrency("₱")).toBe("PHP");
    });
  });

  describe("text-based symbols", () => {
    it("resolves zł to PLN", () => {
      expect(resolveCurrency("zł")).toBe("PLN");
    });

    it("resolves Kč to CZK", () => {
      expect(resolveCurrency("Kč")).toBe("CZK");
    });

    it("resolves other text symbols", () => {
      expect(resolveCurrency("Ft")).toBe("HUF");
      expect(resolveCurrency("lei")).toBe("RON");
      expect(resolveCurrency("Rp")).toBe("IDR");
      expect(resolveCurrency("RM")).toBe("MYR");
    });
  });

  describe("ambiguous symbols without context", () => {
    it("defaults $ to USD", () => {
      expect(resolveCurrency("$")).toBe("USD");
    });

    it("defaults ¥ to JPY", () => {
      expect(resolveCurrency("¥")).toBe("JPY");
    });

    it("defaults kr to SEK", () => {
      expect(resolveCurrency("kr")).toBe("SEK");
    });
  });

  describe("ambiguous symbols with context", () => {
    it("resolves $ to CAD when context specifies CAD", () => {
      expect(resolveCurrency("$", { currency: "CAD" })).toBe("CAD");
    });

    it("resolves $ to AUD when context specifies AUD", () => {
      expect(resolveCurrency("$", { currency: "AUD" })).toBe("AUD");
    });

    it("resolves $ to NZD when context specifies NZD", () => {
      expect(resolveCurrency("$", { currency: "NZD" })).toBe("NZD");
    });

    it("resolves $ to MXN when context specifies MXN", () => {
      expect(resolveCurrency("$", { currency: "MXN" })).toBe("MXN");
    });

    it("resolves ¥ to CNY when context specifies CNY", () => {
      expect(resolveCurrency("¥", { currency: "CNY" })).toBe("CNY");
    });

    it("resolves kr to NOK when context specifies NOK", () => {
      expect(resolveCurrency("kr", { currency: "NOK" })).toBe("NOK");
    });

    it("resolves kr to DKK when context specifies DKK", () => {
      expect(resolveCurrency("kr", { currency: "DKK" })).toBe("DKK");
    });

    it("ignores context if currency not in candidates", () => {
      // $ candidates are USD, CAD, AUD, NZD, MXN, SGD, HKD
      // EUR is not a candidate, so should still default to USD
      expect(resolveCurrency("$", { currency: "EUR" })).toBe("USD");
    });
  });

  describe("unknown symbols", () => {
    it("returns null for unknown symbols", () => {
      expect(resolveCurrency("XYZ")).toBeNull();
      expect(resolveCurrency("???")).toBeNull();
      expect(resolveCurrency("")).toBeNull();
    });
  });
});
