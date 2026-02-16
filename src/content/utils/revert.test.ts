import { describe, it, expect, afterEach } from "vitest";
import { revertConvertedPrices } from "./revert";
import { CONVERTED_ATTR, ORIGINAL_ATTR } from "./domUtils";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("revertConvertedPrices", () => {
  it("replaces converted elements with their original text", () => {
    const container = document.createElement("div");
    const converted = document.createElement("span");

    converted.setAttribute(CONVERTED_ATTR, "true");
    converted.setAttribute(ORIGINAL_ATTR, "$10");
    converted.textContent = "€9";

    container.appendChild(converted);
    document.body.appendChild(container);

    revertConvertedPrices();

    expect(container.textContent).toBe("$10");
    expect(container.querySelector(`[${CONVERTED_ATTR}]`)).toBeNull();
  });

  it("skips elements without original text", () => {
    const container = document.createElement("div");
    const converted = document.createElement("span");

    converted.setAttribute(CONVERTED_ATTR, "true");
    converted.textContent = "€9";

    container.appendChild(converted);
    document.body.appendChild(container);

    revertConvertedPrices();

    expect(container.textContent).toBe("€9");
    expect(container.querySelector(`[${CONVERTED_ATTR}]`)).not.toBeNull();
  });
});
