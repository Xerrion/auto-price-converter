import { describe, it, expect, afterEach } from "vitest";
import { extractStructuredData } from "./structuredData";

describe("extractStructuredData", () => {
  // Helper to add JSON-LD script to the document
  function addJsonLd(data: object): HTMLScriptElement {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return script;
  }

  // Clean up after each test
  afterEach(() => {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    scripts.forEach((s) => s.remove());
  });

  describe("returns null when no JSON-LD", () => {
    it("returns null pageCurrency when no scripts", async () => {
      const result = await extractStructuredData();
      expect(result.pageCurrency).toBeNull();
    });
  });

  describe("Shopify pattern", () => {
    it("extracts currency from single Offer object", async () => {
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

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("USD");
    });
  });

  describe("Magento pattern", () => {
    it("extracts currency from offers array", async () => {
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Copenhagen Bestik",
        offers: [
          {
            "@type": "Offer",
            priceCurrency: "DKK",
            price: 450,
          },
        ],
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("DKK");
    });

    it("handles multiple scripts on same page", async () => {
      // BreadcrumbList (no currency)
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [],
      });

      // Product with currency
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        offers: [
          {
            "@type": "Offer",
            priceCurrency: "DKK",
            price: 450,
          },
        ],
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("DKK");
    });
  });

  describe("WooCommerce pattern", () => {
    it("extracts currency from @graph structure", async () => {
      addJsonLd({
        "@context": "https://schema.org/",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [],
          },
          {
            "@type": "Product",
            name: "Ambassador pyjamas",
            offers: [
              {
                "@type": "Offer",
                price: "999.00",
                priceCurrency: "DKK",
              },
            ],
          },
        ],
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("DKK");
    });

    it("handles nested priceSpecification", async () => {
      addJsonLd({
        "@context": "https://schema.org/",
        "@type": "Product",
        offers: [
          {
            "@type": "Offer",
            price: "999.00",
            priceSpecification: {
              price: "999.00",
              priceCurrency: "DKK",
            },
            priceCurrency: "DKK",
          },
        ],
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("DKK");
    });
  });

  describe("edge cases", () => {
    it("handles malformed JSON gracefully", async () => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = "{ invalid json }";
      document.head.appendChild(script);

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBeNull();
    });

    it("handles empty script content", async () => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = "";
      document.head.appendChild(script);

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBeNull();
    });

    it("returns most common currency when multiple present", async () => {
      // Add multiple products with different currencies
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        offers: { "@type": "Offer", priceCurrency: "EUR", price: 100 },
      });

      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        offers: { "@type": "Offer", priceCurrency: "EUR", price: 200 },
      });

      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        offers: { "@type": "Offer", priceCurrency: "USD", price: 150 },
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("EUR"); // EUR appears twice
    });

    it("normalizes currency codes to uppercase", async () => {
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        offers: { "@type": "Offer", priceCurrency: "usd", price: 100 },
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("USD");
    });
  });

  describe("real-world examples", () => {
    it("handles 1st.shop Shopify structure", async () => {
      addJsonLd({
        "@context": "http://schema.org/",
        "@id": "/products/test#product",
        "@type": "Product",
        brand: { "@type": "Brand", name: "1st" },
        name: "WESN x 1ST Magic Puzzle Box",
        offers: {
          "@id": "/products/test?variant=123#offer",
          "@type": "Offer",
          availability: "http://schema.org/OutOfStock",
          price: "200.00",
          priceCurrency: "USD",
          url: "https://www.1st.shop/products/test?variant=123",
        },
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("USD");
    });

    it("handles orderly.shop Magento structure", async () => {
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Copenhagen Bestik Guld fra Georg Jensen",
        offers: [
          {
            "@type": "Offer",
            priceCurrency: "DKK",
            price: 450,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/UsedCondition",
          },
        ],
      });

      const result = await extractStructuredData();
      expect(result.pageCurrency).toBe("DKK");
    });
  });
});
