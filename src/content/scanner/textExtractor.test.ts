import { describe, it, expect, afterEach } from "vitest";
import {
  extractVisibleText,
  getTextNodes,
  getVisibleTextNodes,
  isElementVisible,
} from "./textExtractor";

const setOffsetParent = (
  element: HTMLElement,
  value: HTMLElement | null,
): void => {
  Object.defineProperty(element, "offsetParent", {
    value,
    configurable: true,
  });
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("extractVisibleText", () => {
  it("collects visible text and skips hidden content", () => {
    const container = document.createElement("div");

    const visible = document.createElement("div");
    setOffsetParent(visible, document.body);
    visible.textContent = "Price $10";

    const hidden = document.createElement("div");
    hidden.className = "sr-only";
    hidden.textContent = "Hidden $20";
    setOffsetParent(hidden, document.body);

    const invisible = document.createElement("div");
    invisible.style.visibility = "hidden";
    invisible.textContent = "Invisible";
    setOffsetParent(invisible, document.body);

    const script = document.createElement("script");
    script.textContent = "const x = 1";

    container.appendChild(visible);
    container.appendChild(hidden);
    container.appendChild(invisible);
    container.appendChild(script);
    document.body.appendChild(container);

    const text = extractVisibleText(container);

    expect(text).toBe("Price $10");
  });

  it("skips nodes without offsetParent and non-fixed positioning", () => {
    const container = document.createElement("div");
    const hidden = document.createElement("div");
    hidden.textContent = "Hidden";
    setOffsetParent(hidden, null);

    container.appendChild(hidden);
    document.body.appendChild(container);

    const text = extractVisibleText(container);

    expect(text).toBe("");
  });
});

describe("isElementVisible", () => {
  it("detects hidden elements", () => {
    const element = document.createElement("div");
    element.className = "sr-only";
    setOffsetParent(element, document.body);

    expect(isElementVisible(element)).toBe(false);
  });

  it("detects display none", () => {
    const element = document.createElement("div");
    element.style.display = "none";
    setOffsetParent(element, null);

    expect(isElementVisible(element)).toBe(false);
  });

  it("detects visibility hidden", () => {
    const element = document.createElement("div");
    element.style.visibility = "hidden";
    setOffsetParent(element, null);

    expect(isElementVisible(element)).toBe(false);
  });

  it("returns true for visible elements", () => {
    const element = document.createElement("div");
    setOffsetParent(element, document.body);

    expect(isElementVisible(element)).toBe(true);
  });
});

describe("getTextNodes", () => {
  it("returns non-empty text nodes outside excluded tags", () => {
    const container = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = "Hello";
    const script = document.createElement("script");
    script.textContent = "alert('no')";

    container.appendChild(span);
    container.appendChild(script);
    document.body.appendChild(container);

    const nodes = getTextNodes(container);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].textContent).toBe("Hello");
  });
});

describe("getVisibleTextNodes", () => {
  it("returns visible text nodes and skips hidden ones", () => {
    const container = document.createElement("div");

    const visible = document.createElement("span");
    visible.textContent = "Visible";
    setOffsetParent(visible, document.body);

    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = "Hidden";
    setOffsetParent(hidden, document.body);

    const fixed = document.createElement("span");
    fixed.style.position = "fixed";
    fixed.textContent = "Fixed";
    setOffsetParent(fixed, null);

    container.appendChild(visible);
    container.appendChild(hidden);
    container.appendChild(fixed);
    document.body.appendChild(container);

    const nodes = getVisibleTextNodes(container);

    expect(nodes.map((node) => node.textContent)).toEqual(["Visible", "Fixed"]);
  });

  it("skips nodes with display none or non-fixed positioning", () => {
    const container = document.createElement("div");

    const hidden = document.createElement("span");
    hidden.style.display = "none";
    hidden.textContent = "Hidden";
    setOffsetParent(hidden, null);

    const offscreen = document.createElement("span");
    offscreen.style.position = "static";
    offscreen.textContent = "Offscreen";
    setOffsetParent(offscreen, null);

    const visible = document.createElement("span");
    visible.textContent = "Visible";
    setOffsetParent(visible, document.body);

    container.appendChild(hidden);
    container.appendChild(offscreen);
    container.appendChild(visible);
    document.body.appendChild(container);

    const nodes = getVisibleTextNodes(container);

    expect(nodes.map((node) => node.textContent)).toEqual(["Visible"]);
  });

  it("skips excluded tags and visibility hidden nodes", () => {
    const container = document.createElement("div");

    const script = document.createElement("script");
    script.textContent = "alert('no')";

    const hidden = document.createElement("span");
    hidden.style.visibility = "hidden";
    hidden.textContent = "Hidden";
    setOffsetParent(hidden, document.body);

    const visible = document.createElement("span");
    visible.textContent = "Visible";
    setOffsetParent(visible, document.body);

    container.appendChild(script);
    container.appendChild(hidden);
    container.appendChild(visible);
    document.body.appendChild(container);

    const nodes = getVisibleTextNodes(container);

    expect(nodes.map((node) => node.textContent)).toEqual(["Visible"]);
  });

  it("rejects nodes without parents and empty text", () => {
    const originalTreeWalker = document.createTreeWalker;

    document.createTreeWalker = ((
      _root: Node,
      _whatToShow: number,
      filter?: NodeFilter,
    ) => {
      let done = false;
      return {
        nextNode: () => {
          if (done) return null;
          done = true;
          const node = document.createTextNode("   ");
          const acceptNode =
            typeof filter === "function" ? filter : filter?.acceptNode;
          const result = acceptNode
            ? acceptNode(node)
            : NodeFilter.FILTER_ACCEPT;
          return result === NodeFilter.FILTER_ACCEPT ? node : null;
        },
      } as TreeWalker;
    }) as typeof document.createTreeWalker;

    const nodes = getVisibleTextNodes(document.body as HTMLElement);

    expect(nodes).toHaveLength(0);

    document.createTreeWalker = originalTreeWalker;
  });
});
