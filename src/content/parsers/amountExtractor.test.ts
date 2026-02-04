import { describe, it, expect } from "vitest";
import { extractAmountString, parseLocalizedNumber } from "./amountExtractor";
import type { CurrencyMatch } from "./currencyDetector";

describe("extractAmountString", () => {
  describe("currency before amount", () => {
    it("extracts simple integer", () => {
      const match: CurrencyMatch = {
        symbol: "$",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      };
      expect(extractAmountString("$100", match)).toBe("100");
    });

    it("extracts decimal amount", () => {
      const match: CurrencyMatch = {
        symbol: "$",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      };
      expect(extractAmountString("$99.99", match)).toBe("99.99");
    });

    it("extracts amount with US thousands separator", () => {
      const match: CurrencyMatch = {
        symbol: "$",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      };
      expect(extractAmountString("$1,234.56", match)).toBe("1,234.56");
    });

    it("extracts amount with space after symbol", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      };
      expect(extractAmountString("€ 100", match)).toBe("100");
    });
  });

  describe("currency after amount", () => {
    it("extracts simple integer", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "after",
        startIndex: 3,
        endIndex: 4,
      };
      expect(extractAmountString("100€", match)).toBe("100");
    });

    it("extracts European format amount", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "after",
        startIndex: 9,
        endIndex: 10,
      };
      expect(extractAmountString("1.234,56 €", match)).toBe("1.234,56");
    });

    it("extracts French format with space separator", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "after",
        startIndex: 9,
        endIndex: 10,
      };
      expect(extractAmountString("1 234,56 €", match)).toBe("1 234,56");
    });

    it("extracts amount with NBSP separator", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "after",
        startIndex: 9,
        endIndex: 10,
      };
      expect(extractAmountString("1\u00A0234,56 €", match)).toBe("1\u00A0234,56");
    });

    it("extracts amount with narrow NBSP separator", () => {
      const match: CurrencyMatch = {
        symbol: "€",
        position: "after",
        startIndex: 9,
        endIndex: 10,
      };
      expect(extractAmountString("1\u202F234,56 €", match)).toBe("1\u202F234,56");
    });
  });

  describe("edge cases", () => {
    it("returns null for no numeric content", () => {
      const match: CurrencyMatch = {
        symbol: "$",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      };
      expect(extractAmountString("$ abc", match)).toBeNull();
    });
  });
});

describe("parseLocalizedNumber", () => {
  describe("US format (1,234.56)", () => {
    it("parses simple integer", () => {
      expect(parseLocalizedNumber("100", "en-US")).toBe(100);
    });

    it("parses decimal", () => {
      expect(parseLocalizedNumber("99.99", "en-US")).toBe(99.99);
    });

    it("parses with thousands separator", () => {
      expect(parseLocalizedNumber("1,234.56", "en-US")).toBe(1234.56);
    });

    it("parses large number", () => {
      expect(parseLocalizedNumber("1,234,567.89", "en-US")).toBe(1234567.89);
    });
  });

  describe("German format (1.234,56)", () => {
    it("parses simple integer", () => {
      expect(parseLocalizedNumber("100", "de-DE")).toBe(100);
    });

    it("parses decimal", () => {
      expect(parseLocalizedNumber("99,99", "de-DE")).toBe(99.99);
    });

    it("parses with thousands separator", () => {
      expect(parseLocalizedNumber("1.234,56", "de-DE")).toBe(1234.56);
    });

    it("parses large number", () => {
      expect(parseLocalizedNumber("1.234.567,89", "de-DE")).toBe(1234567.89);
    });
  });

  describe("French format (1 234,56)", () => {
    it("parses with space thousands separator", () => {
      expect(parseLocalizedNumber("1 234,56", "fr-FR")).toBe(1234.56);
    });

    it("parses with NBSP thousands separator", () => {
      expect(parseLocalizedNumber("1\u00A0234,56", "fr-FR")).toBe(1234.56);
    });

    it("parses with narrow NBSP thousands separator", () => {
      expect(parseLocalizedNumber("1\u202F234,56", "fr-FR")).toBe(1234.56);
    });

    it("parses large number with spaces", () => {
      expect(parseLocalizedNumber("1 234 567,89", "fr-FR")).toBe(1234567.89);
    });
  });

  describe("fallback for invalid locale", () => {
    it("falls back to default parsing for invalid locale", () => {
      expect(parseLocalizedNumber("1,234.56", "invalid-locale")).toBe(1234.56);
    });
  });

  describe("short locale codes", () => {
    it("handles short locale codes", () => {
      expect(parseLocalizedNumber("1,234.56", "en")).toBe(1234.56);
      expect(parseLocalizedNumber("1.234,56", "de")).toBe(1234.56);
      expect(parseLocalizedNumber("1 234,56", "fr")).toBe(1234.56);
    });
  });
});
