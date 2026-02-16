import { describe, it, expect } from "vitest";
import {
  LIKELY_PRICE_SELECTORS,
  EXCLUDED_TAGS,
  HIDDEN_CLASSES,
  PRICE_CLASS_PATTERNS,
  PRODUCT_TITLE_SELECTORS,
} from "./selectors";

describe("scanner selectors", () => {
  it("combines class patterns into a selector string", () => {
    expect(PRICE_CLASS_PATTERNS.length).toBeGreaterThan(0);
    expect(LIKELY_PRICE_SELECTORS).toContain(PRICE_CLASS_PATTERNS[0]);
  });

  it("tracks excluded tags and hidden classes", () => {
    expect(EXCLUDED_TAGS.has("script")).toBe(true);
    expect(HIDDEN_CLASSES).toContain("sr-only");
  });

  it("provides product title selectors", () => {
    expect(PRODUCT_TITLE_SELECTORS).toContain("product-name");
  });
});
