import { describe, it, expect } from "vitest";
import * as scanner from "./index";

describe("scanner index", () => {
  it("re-exports scanner helpers", () => {
    expect(scanner.SmartScanner).toBeDefined();
    expect(scanner.buildPatterns).toBeDefined();
    expect(scanner.detectPrices).toBeDefined();
    expect(scanner.extractVisibleText).toBeDefined();
    expect(scanner.replacePrices).toBeDefined();
    expect(scanner.SCANNER_INDEX_LOADED).toBe(true);
  });
});
