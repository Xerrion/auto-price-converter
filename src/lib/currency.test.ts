import { describe, it, expect } from "vitest";
import {
  getCurrencyInfo,
  getCurrencyName,
  getCurrencySymbol,
  getCurrencyList,
} from "./currency";

describe("getCurrencyInfo", () => {
  it("returns currency info for known currency", () => {
    const info = getCurrencyInfo("USD");
    expect(info).toEqual({ name: "United States Dollar", symbol: "$" });
  });

  it("returns currency info for EUR", () => {
    const info = getCurrencyInfo("EUR");
    expect(info).toEqual({ name: "Euro", symbol: "€" });
  });

  it("returns undefined for unknown currency", () => {
    const info = getCurrencyInfo("XYZ");
    expect(info).toBeUndefined();
  });
});

describe("getCurrencyName", () => {
  it("returns name from fallback list when no symbols provided", () => {
    expect(getCurrencyName("USD")).toBe("United States Dollar");
    expect(getCurrencyName("EUR")).toBe("Euro");
  });

  it("returns name from symbols when provided", () => {
    const symbols = { USD: "US Dollar", EUR: "European Euro" };
    expect(getCurrencyName("USD", symbols)).toBe("US Dollar");
    expect(getCurrencyName("EUR", symbols)).toBe("European Euro");
  });

  it("falls back to built-in name when not in symbols", () => {
    const symbols = { USD: "US Dollar" };
    expect(getCurrencyName("EUR", symbols)).toBe("Euro");
  });

  it("returns code when currency is unknown", () => {
    expect(getCurrencyName("XYZ")).toBe("XYZ");
    expect(getCurrencyName("ABC", { USD: "Dollar" })).toBe("ABC");
  });

  it("handles null symbols", () => {
    expect(getCurrencyName("USD", null)).toBe("United States Dollar");
  });
});

describe("getCurrencySymbol", () => {
  it("returns symbol for known currency", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("JPY")).toBe("¥");
  });

  it("returns code for unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
  });
});

describe("getCurrencyList", () => {
  it("returns sorted keys from symbols when provided", () => {
    const symbols = { EUR: "Euro", USD: "Dollar", AUD: "Aussie Dollar" };
    const list = getCurrencyList(symbols);
    expect(list).toEqual(["AUD", "EUR", "USD"]);
  });

  it("returns CURRENCY_CODES when symbols is null", () => {
    const list = getCurrencyList(null);
    expect(list).toContain("USD");
    expect(list).toContain("EUR");
    expect(list.length).toBeGreaterThan(0);
  });

  it("returns CURRENCY_CODES when symbols is undefined", () => {
    const list = getCurrencyList();
    expect(list).toContain("USD");
    expect(list).toContain("EUR");
  });
});
