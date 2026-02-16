import { describe, it, expect, afterEach, vi } from "vitest";
import type { ExchangeRates, Settings } from "$lib/types";
import type { PageContext } from "../context";
import { buildPatterns } from "./patterns";
import {
  replacePrices,
  isConverted,
  isInsideConverted,
  PROCESSING_ATTR,
} from "./replacer";
import { CONVERTED_ATTR, ORIGINAL_ATTR } from "../utils/domUtils";

const setOffsetParent = (
  element: HTMLElement,
  value: HTMLElement | null,
): void => {
  Object.defineProperty(element, "offsetParent", {
    value,
    configurable: true,
  });
};

const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
  enabled: true,
  targetCurrency: "EUR",
  showOriginalPrice: false,
  highlightConverted: true,
  decimalPlaces: 0,
  numberFormat: "en-US",
  theme: "system",
  exclusionList: [],
  ...overrides,
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("replacePrices", () => {
  const exchangeRates: ExchangeRates = {
    base: "EUR",
    date: "2024-01-01",
    rates: {
      EUR: 1,
      USD: 2,
    },
  };

  const pageContext: PageContext = {
    locale: "en-US",
    localeSource: "html-lang",
    currency: "USD",
    currencySource: "dom",
    currencyConfidence: "low",
  };

  it("replaces detected prices in text nodes", () => {
    const element = document.createElement("div");
    element.textContent = "Price $10";
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(element.getAttribute(CONVERTED_ATTR)).toBe("true");
    expect(element.getAttribute(ORIGINAL_ATTR)).toContain("Price $10");
    expect(element.textContent).toContain("5 €");
    expect(element.classList.contains("price-highlight-fade")).toBe(true);
    expect(element.hasAttribute(PROCESSING_ATTR)).toBe(false);
  });

  it("handles split price patterns via screen-reader text", () => {
    const element = document.createElement("div");
    const sr = document.createElement("span");
    sr.className = "a-offscreen";
    sr.textContent = "$10";
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.textContent = "$10";

    element.appendChild(sr);
    element.appendChild(visual);
    setOffsetParent(element, document.body);
    setOffsetParent(visual, document.body);

    const settings = createSettings({ showOriginalPrice: true });
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(visual.textContent).toContain("(");
    expect(element.getAttribute(CONVERTED_ATTR)).toBe("true");
  });

  it("handles split price when text nodes are skipped", async () => {
    vi.resetModules();
    vi.doMock("./textExtractor", () => ({
      getVisibleTextNodes: () => [],
    }));

    const { replacePrices } = await import("./replacer");

    const element = document.createElement("div");
    const sr = document.createElement("span");
    sr.className = "a-offscreen";
    sr.textContent = "$10";
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.textContent = "$10";

    element.appendChild(sr);
    element.appendChild(visual);

    const settings = createSettings({ showOriginalPrice: true });
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(element.getAttribute(CONVERTED_ATTR)).toBe("true");
  });

  it("skips elements already marked as converted", () => {
    const element = document.createElement("div");
    element.textContent = "Price $10";
    element.setAttribute(CONVERTED_ATTR, "true");
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
  });

  it("skips fallback conversion for long mixed content", () => {
    const element = document.createElement("div");
    element.textContent = `${"content ".repeat(20)}$`;
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
  });

  it("preserves em dash range connector", () => {
    const element = document.createElement("div");
    element.textContent = "$10—$20";
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(element.textContent).toContain(" — ");
  });

  it("returns false when conversion fails for missing target rate", () => {
    const element = document.createElement("div");
    element.textContent = "$10";
    setOffsetParent(element, document.body);

    const settings = createSettings({ targetCurrency: "XYZ" });
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
    expect(element.textContent).toBe("$10");
  });

  it("skips split-price fallback when ratio is too low", () => {
    const element = document.createElement("div");
    const hidden = document.createElement("span");
    hidden.className = "sr-only";
    hidden.textContent = `${"documentation ".repeat(5)}$1`;

    element.appendChild(hidden);
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
  });

  it("handles screen-reader text without a visual target", () => {
    const element = document.createElement("div");
    const sr = document.createElement("span");
    sr.className = "a-offscreen";
    sr.textContent = "$10";
    element.appendChild(sr);
    element.appendChild(document.createTextNode(`${"content ".repeat(20)}$`));
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
  });

  it("applies highlight when fallback conversion succeeds", async () => {
    vi.resetModules();
    vi.doMock("./textExtractor", () => ({
      getVisibleTextNodes: () => [],
    }));
    vi.doMock("./priceDetector", () => ({
      containsCurrencyIndicators: () => true,
      detectPrices: () => [
        {
          text: "$10",
          startIndex: 0,
          endIndex: 3,
          isRange: false,
          prices: [{ amount: 10, currency: "USD" }],
        },
      ],
    }));

    const { replacePrices } = await import("./replacer");

    const element = document.createElement("div");
    element.textContent = "$10";
    setOffsetParent(element, document.body);

    const settings = createSettings({ highlightConverted: true });
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(element.classList.contains("price-highlight-fade")).toBe(true);
  });

  it("skips replacement when detected text mismatches", async () => {
    vi.resetModules();
    vi.doMock("./textExtractor", () => ({
      getVisibleTextNodes: (element: HTMLElement) => [element.firstChild as Text],
    }));
    vi.doMock("./priceDetector", () => ({
      containsCurrencyIndicators: () => true,
      detectPrices: () => [
        {
          text: "$10",
          startIndex: 2,
          endIndex: 5,
          isRange: false,
          prices: [{ amount: 10, currency: "USD" }],
        },
      ],
    }));

    const { replacePrices } = await import("./replacer");

    const element = document.createElement("div");
    element.textContent = `${"content ".repeat(20)}Price $10`;
    setOffsetParent(element, document.body);

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(false);
    expect(element.textContent).toContain("Price $10");
  });

  it("replaces when match is inside text and preserves prefix/suffix", async () => {
    vi.resetModules();
    vi.doMock("./textExtractor", () => ({
      getVisibleTextNodes: (element: HTMLElement) => [element.firstChild as Text],
    }));
    vi.doMock("./priceDetector", () => ({
      containsCurrencyIndicators: () => true,
      detectPrices: () => [
        {
          text: "$10",
          startIndex: 6,
          endIndex: 9,
          isRange: false,
          prices: [{ amount: 10, currency: "USD" }],
        },
      ],
    }));

    const { replacePrices } = await import("./replacer");

    const element = document.createElement("div");
    element.textContent = "Price $10!";

    const settings = createSettings();
    const patterns = buildPatterns(exchangeRates);

    const replaced = replacePrices(element, {
      settings,
      exchangeRates,
      patterns,
      pageContext,
    });

    expect(replaced).toBe(true);
    expect(element.textContent).toContain("Price");
    expect(element.textContent).toContain("!");
  });
});

describe("conversion markers", () => {
  it("detects converted elements", () => {
    const element = document.createElement("div");
    element.setAttribute(CONVERTED_ATTR, "true");

    expect(isConverted(element)).toBe(true);
  });

  it("detects elements inside converted containers", () => {
    const container = document.createElement("div");
    container.setAttribute(CONVERTED_ATTR, "true");
    const child = document.createElement("span");
    container.appendChild(child);
    document.body.appendChild(container);

    expect(isInsideConverted(child)).toBe(true);
  });
});
