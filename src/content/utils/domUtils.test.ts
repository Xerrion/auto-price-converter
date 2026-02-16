import { describe, it, expect, afterEach, vi } from "vitest";

const cleanupStyles = (): void => {
  document
    .querySelectorAll("#price-converter-styles")
    .forEach((el) => el.remove());
};

afterEach(() => {
  cleanupStyles();
});

describe("domUtils", () => {
  it("injects styles only once", async () => {
    vi.resetModules();
    const { injectStyles } = await import("./domUtils");

    injectStyles();
    injectStyles();

    expect(document.querySelectorAll("#price-converter-styles")).toHaveLength(
      1,
    );
  });

  it("applies fading highlight class", async () => {
    const { applyFadingHighlight } = await import("./domUtils");
    const element = document.createElement("span");

    applyFadingHighlight(element);

    expect(element.classList.contains("price-highlight-fade")).toBe(true);
  });

  it("detects elements inside and outside the viewport", async () => {
    const { isInViewport } = await import("./domUtils");
    const element = document.createElement("div");

    Object.defineProperty(window, "innerWidth", {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 600,
      configurable: true,
    });

    element.getBoundingClientRect = () =>
      ({
        top: 10,
        bottom: 20,
        left: 10,
        right: 20,
        width: 10,
        height: 10,
        x: 10,
        y: 10,
        toJSON: () => "",
      } as DOMRect);

    expect(isInViewport(element)).toBe(true);

    element.getBoundingClientRect = () =>
      ({
        top: 800,
        bottom: 820,
        left: 10,
        right: 20,
        width: 10,
        height: 10,
        x: 10,
        y: 800,
        toJSON: () => "",
      } as DOMRect);

    expect(isInViewport(element)).toBe(false);
  });
});
