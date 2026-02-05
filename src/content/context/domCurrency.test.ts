import { describe, it, expect, afterEach } from "vitest";
import { extractDomCurrency } from "./domCurrency";

describe("extractDomCurrency", () => {
  // Clean up after each test
  afterEach(() => {
    // Remove added elements
    document
      .querySelectorAll("[data-testid]")
      .forEach((el) => el.remove());
    document
      .querySelectorAll('meta[property="product:price:currency"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll('meta[name="currency"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll('meta[itemprop="priceCurrency"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll("[data-currency]")
      .forEach((el) => el.remove());
    document
      .querySelectorAll("[data-shop-currency]")
      .forEach((el) => el.remove());
    document
      .querySelectorAll("[data-price-currency]")
      .forEach((el) => el.remove());
    document
      .querySelectorAll('select[name*="currency"]')
      .forEach((el) => el.remove());
  });

  describe("returns null when no currency found", () => {
    it("returns null currency and 'none' source when DOM is empty", () => {
      const result = extractDomCurrency();
      expect(result.currency).toBeNull();
      expect(result.source).toBe("none");
    });
  });

  describe("meta tags", () => {
    it("extracts currency from product:price:currency meta", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "USD");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("meta");
    });

    it("extracts currency from name=currency meta", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "currency");
      meta.setAttribute("content", "EUR");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBe("EUR");
      expect(result.source).toBe("meta");
    });

    it("extracts currency from itemprop=priceCurrency meta", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("itemprop", "priceCurrency");
      meta.setAttribute("content", "GBP");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBe("GBP");
      expect(result.source).toBe("meta");
    });

    it("normalizes lowercase currency codes", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "usd");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBe("USD");
    });
  });

  describe("data attributes", () => {
    it("extracts currency from data-currency attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("data-currency", "CAD");
      div.setAttribute("data-testid", "test");
      document.body.appendChild(div);

      const result = extractDomCurrency();
      expect(result.currency).toBe("CAD");
      expect(result.source).toBe("data-attr");
    });

    it("extracts currency from data-shop-currency attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("data-shop-currency", "AUD");
      div.setAttribute("data-testid", "test");
      document.body.appendChild(div);

      const result = extractDomCurrency();
      expect(result.currency).toBe("AUD");
      expect(result.source).toBe("data-attr");
    });

    it("extracts currency from data-price-currency attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("data-price-currency", "JPY");
      div.setAttribute("data-testid", "test");
      document.body.appendChild(div);

      const result = extractDomCurrency();
      expect(result.currency).toBe("JPY");
      expect(result.source).toBe("data-attr");
    });
  });

  describe("selected options", () => {
    it("extracts currency from selected option in currency select", () => {
      const select = document.createElement("select");
      select.setAttribute("name", "currency");
      select.setAttribute("data-testid", "test");

      const option = document.createElement("option");
      option.setAttribute("value", "CHF");
      option.setAttribute("selected", "");
      option.textContent = "Swiss Franc";
      select.appendChild(option);

      document.body.appendChild(select);

      const result = extractDomCurrency();
      expect(result.currency).toBe("CHF");
      expect(result.source).toBe("selected-option");
    });

    it("extracts currency from selected option by id", () => {
      const select = document.createElement("select");
      select.setAttribute("id", "shop-currency");
      select.setAttribute("data-testid", "test");

      const option = document.createElement("option");
      option.setAttribute("value", "NOK");
      option.setAttribute("selected", "");
      select.appendChild(option);

      document.body.appendChild(select);

      const result = extractDomCurrency();
      expect(result.currency).toBe("NOK");
      expect(result.source).toBe("selected-option");
    });
  });

  describe("priority order", () => {
    it("prefers meta tags over data attributes", () => {
      // Add data attribute first
      const div = document.createElement("div");
      div.setAttribute("data-currency", "CAD");
      div.setAttribute("data-testid", "test");
      document.body.appendChild(div);

      // Then add meta tag
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "USD");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("meta");
    });

    it("prefers data attributes over selected options", () => {
      // Add select first
      const select = document.createElement("select");
      select.setAttribute("name", "currency");
      select.setAttribute("data-testid", "test");
      const option = document.createElement("option");
      option.setAttribute("value", "CHF");
      option.setAttribute("selected", "");
      select.appendChild(option);
      document.body.appendChild(select);

      // Then add data attribute
      const div = document.createElement("div");
      div.setAttribute("data-currency", "EUR");
      div.setAttribute("data-testid", "test");
      document.body.appendChild(div);

      const result = extractDomCurrency();
      expect(result.currency).toBe("EUR");
      expect(result.source).toBe("data-attr");
    });
  });

  describe("validation", () => {
    it("ignores invalid currency codes", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "INVALID");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBeNull();
      expect(result.source).toBe("none");
    });

    it("ignores currencies not in MAJOR_CURRENCIES", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "XYZ"); // Not a real currency
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBeNull();
    });

    it("ignores empty content", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "product:price:currency");
      meta.setAttribute("content", "");
      meta.setAttribute("data-testid", "test");
      document.head.appendChild(meta);

      const result = extractDomCurrency();
      expect(result.currency).toBeNull();
    });
  });
});
