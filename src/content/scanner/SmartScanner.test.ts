import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ExchangeRates, Settings } from "$lib/types";
import type { PageContext } from "../context";
import { CONVERTED_ATTR } from "../utils/domUtils";

vi.mock("./replacer", () => ({
  replacePrices: vi.fn(),
  isConverted: vi.fn(() => false),
  isInsideConverted: vi.fn(() => false),
}));

type IdleCallback = (deadline: {
  didTimeout: boolean;
  timeRemaining: () => number;
}) => void;

describe("SmartScanner", () => {
  const exchangeRates: ExchangeRates = {
    base: "EUR",
    date: "2024-01-01",
    rates: {
      EUR: 1,
      USD: 1.2,
    },
  };

  const settings: Settings = {
    enabled: true,
    targetCurrency: "EUR",
    showOriginalPrice: false,
    highlightConverted: false,
    decimalPlaces: 0,
    numberFormat: "en-US",
    theme: "system",
    exclusionList: [],
  };

  const pageContext: PageContext = {
    locale: "en-US",
    localeSource: "html-lang",
    currency: "USD",
    currencySource: "dom",
    currencyConfidence: "low",
  };

  const setBoundingRect = (element: HTMLElement, top = 0): void => {
    element.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + 10,
        left: 0,
        right: 10,
        width: 10,
        height: 10,
        x: 0,
        y: top,
        toJSON: () => "",
      } as DOMRect);
  };

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("scans elements matched by selectors", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 1;
    });

    const cancelIdleCallback = vi.fn();
    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;
    (
      window as unknown as { cancelIdleCallback?: typeof cancelIdleCallback }
    ).cancelIdleCallback = cancelIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const container = document.createElement("div");
    setBoundingRect(container, 0);

    const priceElement = document.createElement("div");
    priceElement.className = "product-price";
    priceElement.textContent = "$10";
    setBoundingRect(priceElement, 0);

    container.appendChild(priceElement);
    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(replacePrices).toHaveBeenCalled();
  });

  it("processes container when it matches selectors", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 7;
    });

    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const container = document.createElement("div");
    container.className = "price";
    container.textContent = "$10";
    setBoundingRect(container, 0);
    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(replacePrices).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ settings }),
    );
  });

  it("handles selector errors gracefully", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 2;
    });

    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const container = document.createElement("div");
    setBoundingRect(container, 0);
    const querySpy = vi
      .spyOn(container, "querySelectorAll")
      .mockImplementation(() => {
        throw new Error("bad selector");
      });

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(querySpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("uses requestIdleCallback polyfill when missing", async () => {
    const originalRequestIdle = window.requestIdleCallback;
    const originalCancelIdle = window.cancelIdleCallback;

    delete (window as { requestIdleCallback?: typeof window.requestIdleCallback })
      .requestIdleCallback;
    delete (window as { cancelIdleCallback?: typeof window.cancelIdleCallback })
      .cancelIdleCallback;

    const setTimeoutSpy = vi
      .spyOn(window, "setTimeout")
      .mockImplementation((handler: TimerHandler) => {
        if (typeof handler === "function") {
          handler();
        }
        return 123 as unknown as ReturnType<typeof setTimeout>;
      });

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const container = document.createElement("div");
    setBoundingRect(container, 0);
    const priceElement = document.createElement("span");
    priceElement.textContent = "$10";
    container.appendChild(priceElement);
    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(setTimeoutSpy).toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
    window.requestIdleCallback = originalRequestIdle;
    window.cancelIdleCallback = originalCancelIdle;
  });

  it("uses cancelIdleCallback polyfill when missing", async () => {
    const originalRequestIdle = window.requestIdleCallback;
    const originalCancelIdle = window.cancelIdleCallback;

    delete (window as { requestIdleCallback?: typeof window.requestIdleCallback })
      .requestIdleCallback;
    delete (window as { cancelIdleCallback?: typeof window.cancelIdleCallback })
      .cancelIdleCallback;

    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    (scanner as unknown as { idleCallbackId: number | null }).idleCallbackId =
      55;

    scanner.disconnect();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(55);

    clearTimeoutSpy.mockRestore();
    window.requestIdleCallback = originalRequestIdle;
    window.cancelIdleCallback = originalCancelIdle;
  });

  it("processes pending elements during idle time", async () => {
    let idleCallback: IdleCallback | null = null;
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      idleCallback = cb;
      return 3;
    });

    const cancelIdleCallback = vi.fn();
    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;
    (
      window as unknown as { cancelIdleCallback?: typeof cancelIdleCallback }
    ).cancelIdleCallback = cancelIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const container = document.createElement("div");
    setBoundingRect(container, 800);

    const priceElement = document.createElement("span");
    priceElement.textContent = "$12";
    setBoundingRect(priceElement, 800);

    container.appendChild(priceElement);
    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(requestIdleCallback).toHaveBeenCalled();

    const triggerIdle = idleCallback as IdleCallback | null;
    if (triggerIdle) {
      triggerIdle({ didTimeout: false, timeRemaining: () => 10 });
    }

    expect(replacePrices).toHaveBeenCalled();
  });

  it("prunes scans without currency indicators or depth", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 8;
    });

    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const element = document.createElement("div");
    element.textContent = "no prices here";
    setBoundingRect(element, 0);

    (scanner as unknown as { scanWithPruning: (el: HTMLElement, depth: number) => void }).scanWithPruning(
      element,
      0,
    );
    (scanner as unknown as { scanWithPruning: (el: HTMLElement, depth: number) => void }).scanWithPruning(
      element,
      1,
    );

    expect(replacePrices).not.toHaveBeenCalled();
  });

  it("processes leaf elements during pruning", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 9;
    });

    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const element = document.createElement("div");
    element.textContent = "$10";
    setBoundingRect(element, 0);

    (scanner as unknown as { scanWithPruning: (el: HTMLElement, depth: number) => void }).scanWithPruning(
      element,
      1,
    );

    expect(replacePrices).toHaveBeenCalled();
  });

  it("updates patterns when exchange rates change", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 4;
    });

    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const beforeSize = (
      scanner as unknown as { patterns: { isoCodes: Set<string> } }
    ).patterns.isoCodes.size;

    scanner.updateOptions({
      exchangeRates: {
        base: "EUR",
        date: "2024-02-01",
        rates: {
          EUR: 1,
          USD: 1.2,
          GBP: 0.9,
        },
      },
    });

    const afterSize = (
      scanner as unknown as { patterns: { isoCodes: Set<string> } }
    ).patterns.isoCodes.size;

    expect(afterSize).toBeGreaterThan(beforeSize);
  });

  it("handles shouldProcess and leaf guards", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 10;
    });

    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });

    const script = document.createElement("script");
    const shouldProcess = (scanner as unknown as { shouldProcess: (el: HTMLElement) => boolean }).shouldProcess(
      script as unknown as HTMLElement,
    );

    const convertedParent = document.createElement("div");
    convertedParent.setAttribute(CONVERTED_ATTR, "true");
    const child = document.createElement("span");
    convertedParent.appendChild(child);

    const shouldProcessChild = (scanner as unknown as { shouldProcess: (el: HTMLElement) => boolean }).shouldProcess(
      child,
    );

    const longElement = document.createElement("div");
    longElement.textContent = "x".repeat(201);

    const leafLong = (scanner as unknown as { isLeafPriceElement: (el: HTMLElement) => boolean }).isLeafPriceElement(
      longElement,
    );

    const parentWithChild = document.createElement("div");
    const priceChild = document.createElement("span");
    priceChild.className = "price";
    parentWithChild.appendChild(priceChild);

    const leafWithChild = (scanner as unknown as { isLeafPriceElement: (el: HTMLElement) => boolean }).isLeafPriceElement(
      parentWithChild,
    );

    const brokenSelector = document.createElement("div");
    brokenSelector.querySelectorAll = () => {
      throw new Error("bad selector");
    };

    const leafBroken = (scanner as unknown as { isLeafPriceElement: (el: HTMLElement) => boolean }).isLeafPriceElement(
      brokenSelector,
    );

    expect(shouldProcess).toBe(false);
    expect(shouldProcessChild).toBe(false);
    expect(leafLong).toBe(false);
    expect(leafWithChild).toBe(false);
    expect(leafBroken).toBe(true);
  });

  it("collects pending elements and schedules idle chunks", async () => {
    const requestIdleCallback = vi.fn(() => 11);
    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const container = document.createElement("div");

    const valid = document.createElement("span");
    valid.textContent = "$10";
    const converted = document.createElement("span");
    converted.textContent = "$12";
    converted.setAttribute(CONVERTED_ATTR, "true");
    const processed = document.createElement("span");
    processed.textContent = "$14";

    container.appendChild(valid);
    container.appendChild(converted);
    container.appendChild(processed);
    document.body.appendChild(container);

    (scanner as unknown as { processedElements: WeakSet<Element> }).processedElements.add(processed);
    (scanner as unknown as { collectPendingElements: (el: HTMLElement) => void }).collectPendingElements(
      container,
    );

    const pendingElements = (scanner as unknown as { pendingElements: Set<HTMLElement> }).pendingElements;

    expect(pendingElements.has(valid)).toBe(true);
    expect(pendingElements.has(converted)).toBe(false);
    expect(pendingElements.has(processed)).toBe(false);
  });

  it("skips excluded tags when collecting pending elements", async () => {
    const requestIdleCallback = vi.fn(() => 14);
    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const container = document.createElement("div");
    const script = document.createElement("script");
    script.textContent = "$10";
    container.appendChild(script);

    (scanner as unknown as { collectPendingElements: (el: HTMLElement) => void }).collectPendingElements(
      container,
    );

    const pendingElements = (scanner as unknown as { pendingElements: Set<HTMLElement> }).pendingElements;

    expect(pendingElements.size).toBe(0);
  });

  it("does not schedule idle callback twice", async () => {
    const requestIdleCallback = vi.fn(() => 13);
    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const container = document.createElement("div");
    const priceElement = document.createElement("span");
    priceElement.textContent = "$10";
    container.appendChild(priceElement);

    (scanner as unknown as { pendingElements: Set<HTMLElement> }).pendingElements.add(
      priceElement,
    );
    (scanner as unknown as { scheduleDeepScan: (el: HTMLElement) => void }).scheduleDeepScan(
      container,
    );
    (scanner as unknown as { scheduleDeepScan: (el: HTMLElement) => void }).scheduleDeepScan(
      container,
    );

    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
  });

  it("schedules another idle chunk when work remains", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 12;
    });
    (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    const pending = (scanner as unknown as { pendingElements: Set<HTMLElement> }).pendingElements;
    pending.add(document.createElement("span"));

    (scanner as unknown as { processIdleChunk: (deadline: { timeRemaining: () => number }) => void }).processIdleChunk(
      { timeRemaining: () => 0 },
    );

    expect(requestIdleCallback).toHaveBeenCalled();
  });

  it("resets and disconnects idle callbacks", async () => {
    let idleCallback: IdleCallback | null = null;
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      idleCallback = cb;
      return 5;
    });

    const cancelIdleCallback = vi.fn();
    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;
    (
      window as unknown as { cancelIdleCallback?: typeof cancelIdleCallback }
    ).cancelIdleCallback = cancelIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");

    const container = document.createElement("div");
    setBoundingRect(container, 800);

    const priceElement = document.createElement("span");
    priceElement.textContent = "$12";
    setBoundingRect(priceElement, 800);

    container.appendChild(priceElement);
    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(requestIdleCallback).toHaveBeenCalled();

    scanner.reset();
    scanner.disconnect();

    expect(cancelIdleCallback).toHaveBeenCalledWith(5);

    const triggerIdle = idleCallback as IdleCallback | null;
    if (triggerIdle) {
      triggerIdle({ didTimeout: false, timeRemaining: () => 10 });
    }
  });

  it("skips already converted containers", async () => {
    const requestIdleCallback = vi.fn((cb: IdleCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 10 });
      return 6;
    });

    (
      window as unknown as { requestIdleCallback?: typeof requestIdleCallback }
    ).requestIdleCallback = requestIdleCallback;

    vi.resetModules();
    const { SmartScanner } = await import("./SmartScanner");
    const { replacePrices } = await import("./replacer");

    const container = document.createElement("div");
    container.setAttribute(CONVERTED_ATTR, "true");
    setBoundingRect(container, 0);

    document.body.appendChild(container);

    const scanner = new SmartScanner({ settings, exchangeRates, pageContext });
    scanner.scan(container);

    expect(replacePrices).not.toHaveBeenCalled();
  });
});
