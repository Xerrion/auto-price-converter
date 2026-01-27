import { describe, it, expect } from "vitest";
import { formatPrice } from "./formatter";

describe("formatPrice", () => {
  it("formats USD with symbol before", () => {
    expect(formatPrice(10.5, "USD", 2)).toBe("$10.50");
  });

  it("formats EUR with symbol after", () => {
    expect(formatPrice(10.5, "EUR", 2)).toBe("10.50 €");
  });

  it("formats GBP with symbol before", () => {
    expect(formatPrice(99.99, "GBP", 2)).toBe("£99.99");
  });

  it("formats JPY with symbol after", () => {
    expect(formatPrice(1000, "JPY", 0)).toBe("1,000 ¥");
  });

  it("formats CAD with symbol before", () => {
    expect(formatPrice(25, "CAD", 2)).toBe("CA$25.00");
  });

  it("respects decimal places", () => {
    expect(formatPrice(10.555, "USD", 0)).toBe("$11");
    expect(formatPrice(10.555, "USD", 1)).toBe("$10.6");
    expect(formatPrice(10.555, "USD", 2)).toBe("$10.56");
  });

  // Number format tests
  describe("number formats", () => {
    it("formats with US format (comma thousands, period decimal)", () => {
      expect(formatPrice(1234.56, "EUR", 2, "en-US")).toBe("1,234.56 €");
    });

    it("formats with European format (period thousands, comma decimal)", () => {
      expect(formatPrice(1234.56, "EUR", 2, "de-DE")).toBe("1.234,56 €");
    });

    it("formats with French format (space thousands, comma decimal)", () => {
      // French uses narrow no-break space (U+202F) for thousands
      const result = formatPrice(1234.56, "EUR", 2, "fr-FR");
      expect(result).toMatch(/1.234,56 €/);
    });

    it("formats with Swiss format (apostrophe thousands, period decimal)", () => {
      expect(formatPrice(1234.56, "EUR", 2, "de-CH")).toBe("1'234.56 €");
    });
  });
});
