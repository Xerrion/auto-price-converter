import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildPageContext, TLD_CURRENCY_MAP } from "./pageContext";

describe("buildPageContext", () => {
  // Store original values
  let originalLang: string;

  beforeEach(() => {
    originalLang = document.documentElement.lang;
  });

  afterEach(() => {
    // Restore original values
    document.documentElement.lang = originalLang;

    // Clean up DOM
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll('meta[property="product:price:currency"]')
      .forEach((el) => el.remove());
    document
      .querySelectorAll("[data-currency]")
      .forEach((el) => el.remove());
  });

  // Helper to add JSON-LD script
  function addJsonLd(data: object): void {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Helper to add meta tag
  function addMeta(property: string, content: string): void {
    const meta = document.createElement("meta");
    meta.setAttribute("property", property);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }

  describe("locale detection", () => {
    it("uses html lang attribute when present", async () => {
      document.documentElement.lang = "de-DE";

      const context = await buildPageContext();
      expect(context.locale).toBe("de-DE");
      expect(context.localeSource).toBe("html-lang");
    });

    it("normalizes underscore to hyphen in locale", async () => {
      document.documentElement.lang = "en_US";

      const context = await buildPageContext();
      expect(context.locale).toBe("en-US");
    });

    it("falls back to navigator.language when no html lang", async () => {
      document.documentElement.lang = "";

      const context = await buildPageContext();
      expect(context.localeSource).toBe("navigator");
    });
  });

  describe("currency detection priority", () => {
    it("prefers JSON-LD over TLD (high > medium)", async () => {
      // Set up TLD (medium confidence)
      // Note: In tests, window.location.hostname is "localhost"
      // So we can only test JSON-LD and DOM here

      addJsonLd({
        "@context": "http://schema.org/",
        "@type": "Product",
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
        },
      });

      const context = await buildPageContext();
      expect(context.currency).toBe("EUR");
      expect(context.currencySource).toBe("json-ld");
      expect(context.currencyConfidence).toBe("high");
    });

    it("uses DOM when JSON-LD not available", async () => {
      addMeta("product:price:currency", "GBP");

      const context = await buildPageContext();
      // Might be TLD or DOM depending on hostname
      expect(context.currency).toBe("GBP");
      expect(context.currencySource).toBe("dom");
      expect(context.currencyConfidence).toBe("low");
    });

    it("returns none when no currency sources available", async () => {
      const context = await buildPageContext();
      expect(context.currency).toBeNull();
      expect(context.currencySource).toBe("none");
      expect(context.currencyConfidence).toBe("none");
    });
  });

  describe("JSON-LD currency extraction", () => {
    it("extracts currency from Shopify-style JSON-LD", async () => {
      addJsonLd({
        "@context": "http://schema.org/",
        "@type": "Product",
        name: "Test Product",
        offers: {
          "@type": "Offer",
          price: "200.00",
          priceCurrency: "USD",
        },
      });

      const context = await buildPageContext();
      expect(context.currency).toBe("USD");
      expect(context.currencyConfidence).toBe("high");
    });

    it("extracts currency from WooCommerce-style @graph", async () => {
      addJsonLd({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            offers: {
              "@type": "Offer",
              priceCurrency: "DKK",
            },
          },
        ],
      });

      const context = await buildPageContext();
      expect(context.currency).toBe("DKK");
    });

    it("normalizes lowercase currency codes", async () => {
      addJsonLd({
        "@context": "http://schema.org/",
        "@type": "Offer",
        priceCurrency: "gbp",
      });

      const context = await buildPageContext();
      expect(context.currency).toBe("GBP");
    });
  });
});

describe("TLD_CURRENCY_MAP", () => {
  it("maps European TLDs correctly", () => {
    expect(TLD_CURRENCY_MAP["uk"]).toBe("GBP");
    expect(TLD_CURRENCY_MAP["de"]).toBe("EUR");
    expect(TLD_CURRENCY_MAP["fr"]).toBe("EUR");
    expect(TLD_CURRENCY_MAP["ch"]).toBe("CHF");
  });

  it("maps Nordic TLDs correctly", () => {
    expect(TLD_CURRENCY_MAP["se"]).toBe("SEK");
    expect(TLD_CURRENCY_MAP["no"]).toBe("NOK");
    expect(TLD_CURRENCY_MAP["dk"]).toBe("DKK");
    expect(TLD_CURRENCY_MAP["is"]).toBe("ISK");
  });

  it("maps Asia Pacific TLDs correctly", () => {
    expect(TLD_CURRENCY_MAP["jp"]).toBe("JPY");
    expect(TLD_CURRENCY_MAP["au"]).toBe("AUD");
    expect(TLD_CURRENCY_MAP["nz"]).toBe("NZD");
    expect(TLD_CURRENCY_MAP["in"]).toBe("INR");
  });

  it("maps Americas TLDs correctly", () => {
    expect(TLD_CURRENCY_MAP["us"]).toBe("USD");
    expect(TLD_CURRENCY_MAP["ca"]).toBe("CAD");
    expect(TLD_CURRENCY_MAP["mx"]).toBe("MXN");
    expect(TLD_CURRENCY_MAP["br"]).toBe("BRL");
  });

  it("maps Eastern European TLDs correctly", () => {
    expect(TLD_CURRENCY_MAP["pl"]).toBe("PLN");
    expect(TLD_CURRENCY_MAP["cz"]).toBe("CZK");
    expect(TLD_CURRENCY_MAP["hu"]).toBe("HUF");
    expect(TLD_CURRENCY_MAP["ua"]).toBe("UAH");
  });
});
