import { describe, it, expect } from "vitest";
import { detectCurrency } from "./currencyDetector";

describe("detectCurrency", () => {
  describe("returns null for invalid inputs", () => {
    it("returns null for text without digits", () => {
      expect(detectCurrency("just text")).toBeNull();
      expect(detectCurrency("USD only")).toBeNull();
      expect(detectCurrency("€")).toBeNull();
    });

    it("returns null for digits without currency", () => {
      expect(detectCurrency("12345")).toBeNull();
      expect(detectCurrency("amount: 100")).toBeNull();
    });
  });

  describe("ISO currency codes", () => {
    it("detects code before amount", () => {
      const result = detectCurrency("USD 100");
      expect(result).toEqual({
        symbol: "USD",
        position: "before",
        startIndex: 0,
        endIndex: 3,
      });
    });

    it("detects code after amount", () => {
      const result = detectCurrency("100 EUR");
      expect(result).toEqual({
        symbol: "EUR",
        position: "after",
        startIndex: 4,
        endIndex: 7,
      });
    });

    it("detects lowercase codes", () => {
      const result = detectCurrency("usd 50");
      expect(result?.symbol.toUpperCase()).toBe("USD");
    });

    it("detects various currency codes", () => {
      expect(detectCurrency("GBP 100")?.symbol.toUpperCase()).toBe("GBP");
      expect(detectCurrency("100 JPY")?.symbol.toUpperCase()).toBe("JPY");
      expect(detectCurrency("UAH 500")?.symbol.toUpperCase()).toBe("UAH");
      expect(detectCurrency("1000 PLN")?.symbol.toUpperCase()).toBe("PLN");
    });
  });

  describe("multi-character symbols", () => {
    it("detects CA$ before amount", () => {
      const result = detectCurrency("CA$50");
      expect(result).toEqual({
        symbol: "CA$",
        position: "before",
        startIndex: 0,
        endIndex: 3,
      });
    });

    it("detects A$ (Australian dollar)", () => {
      const result = detectCurrency("A$100.50");
      expect(result?.symbol).toBe("A$");
      expect(result?.position).toBe("before");
    });

    it("detects other multi-char symbols", () => {
      expect(detectCurrency("NZ$75")?.symbol).toBe("NZ$");
      expect(detectCurrency("R$200")?.symbol).toBe("R$");
      expect(detectCurrency("S$150")?.symbol).toBe("S$");
      expect(detectCurrency("HK$1000")?.symbol).toBe("HK$");
      expect(detectCurrency("MX$500")?.symbol).toBe("MX$");
    });
  });

  describe("single character symbols", () => {
    it("detects $ before amount", () => {
      const result = detectCurrency("$100");
      expect(result).toEqual({
        symbol: "$",
        position: "before",
        startIndex: 0,
        endIndex: 1,
      });
    });

    it("detects € after amount", () => {
      const result = detectCurrency("100€");
      expect(result).toEqual({
        symbol: "€",
        position: "after",
        startIndex: 3,
        endIndex: 4,
      });
    });

    it("detects € after amount with space", () => {
      const result = detectCurrency("100 €");
      expect(result?.symbol).toBe("€");
      expect(result?.position).toBe("after");
    });

    it("detects various single symbols", () => {
      expect(detectCurrency("£50")?.symbol).toBe("£");
      expect(detectCurrency("¥1000")?.symbol).toBe("¥");
      expect(detectCurrency("₴500")?.symbol).toBe("₴");
      expect(detectCurrency("₺100")?.symbol).toBe("₺");
      expect(detectCurrency("₹2000")?.symbol).toBe("₹");
      expect(detectCurrency("₩50000")?.symbol).toBe("₩");
      expect(detectCurrency("฿1500")?.symbol).toBe("฿");
      expect(detectCurrency("₪200")?.symbol).toBe("₪");
      expect(detectCurrency("₱1000")?.symbol).toBe("₱");
    });
  });

  describe("text-based symbols", () => {
    it("detects zł (Polish zloty)", () => {
      const result = detectCurrency("100 zł");
      expect(result?.symbol).toBe("zł");
      expect(result?.position).toBe("after");
    });

    it("detects Kč (Czech koruna)", () => {
      const result = detectCurrency("500 Kč");
      expect(result?.symbol).toBe("Kč");
      expect(result?.position).toBe("after");
    });

    it("detects kr (Nordic currencies)", () => {
      const result = detectCurrency("1000 kr");
      expect(result?.symbol).toBe("kr");
      expect(result?.position).toBe("after");
    });

    it("detects other text symbols", () => {
      expect(detectCurrency("1000 Ft")?.symbol).toBe("Ft");
      expect(detectCurrency("50 lei")?.symbol).toBe("lei");
      expect(detectCurrency("Rp 50000")?.symbol).toBe("Rp");
      expect(detectCurrency("RM 100")?.symbol).toBe("RM");
      expect(detectCurrency("CHF 200")?.symbol).toBe("CHF");
    });
  });

  describe("position detection", () => {
    it("correctly identifies before position", () => {
      expect(detectCurrency("$100")?.position).toBe("before");
      expect(detectCurrency("€ 50")?.position).toBe("before");
      expect(detectCurrency("USD 100")?.position).toBe("before");
    });

    it("correctly identifies after position", () => {
      expect(detectCurrency("100$")?.position).toBe("after");
      expect(detectCurrency("50 €")?.position).toBe("after");
      expect(detectCurrency("100 USD")?.position).toBe("after");
    });
  });

  describe("priority order", () => {
    it("prioritizes ISO codes over symbols in same text", () => {
      // If both USD and $ appear, should match USD first
      const result = detectCurrency("USD $100");
      expect(result?.symbol.toUpperCase()).toBe("USD");
    });
  });

  describe("new currency symbols", () => {
    it("detects ₦ (Nigerian Naira) - prefix", () => {
      const result = detectCurrency("₦ 6,907");
      expect(result?.symbol).toBe("₦");
      expect(result?.position).toBe("before");
    });

    it("detects ₫ (Vietnamese Dong) - postfix", () => {
      const result = detectCurrency("1005000 ₫");
      expect(result?.symbol).toBe("₫");
      expect(result?.position).toBe("after");
    });

    it("detects ₸ (Kazakhstani Tenge) - postfix", () => {
      const result = detectCurrency("1000 ₸");
      expect(result?.symbol).toBe("₸");
      expect(result?.position).toBe("after");
    });

    it("detects ৳ (Bangladeshi Taka) - prefix", () => {
      const result = detectCurrency("৳699");
      expect(result?.symbol).toBe("৳");
      expect(result?.position).toBe("before");
    });

    it("detects ₽ (Russian Ruble) - postfix", () => {
      const result = detectCurrency("1000 ₽");
      expect(result?.symbol).toBe("₽");
      expect(result?.position).toBe("after");
    });

    it("detects ₾ (Georgian Lari) - prefix", () => {
      const result = detectCurrency("₾100");
      expect(result?.symbol).toBe("₾");
      expect(result?.position).toBe("before");
    });

    it("detects GH₵ (Ghanaian Cedi) - multi-char prefix", () => {
      const result = detectCurrency("GH₵ 47.00");
      expect(result?.symbol).toBe("GH₵");
      expect(result?.position).toBe("before");
    });
  });
});
