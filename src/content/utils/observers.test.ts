import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupMutationObserver,
  disconnectMutationObserver,
  setupIntersectionObserver,
  disconnectIntersectionObserver,
  observeForConversion,
} from "./observers";
import { CONVERTED_ATTR, PENDING_ATTR } from "./domUtils";

let mutationCallback: MutationCallback | null = null;
let intersectionCallback: IntersectionObserverCallback | null = null;
let mutationObserverInstance: MutationObserver | null = null;
let intersectionObserverInstance: IntersectionObserver | null = null;
let intersectionConstructorCalls = 0;

const originalMutationObserver = globalThis.MutationObserver;
const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

class MockMutationObserver {
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: MutationCallback) {
    mutationCallback = callback;
    mutationObserverInstance = this as unknown as MutationObserver;
  }
}

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
    intersectionObserverInstance = this as unknown as IntersectionObserver;
    intersectionConstructorCalls += 1;
  }
}

beforeEach(() => {
  mutationCallback = null;
  intersectionCallback = null;
  mutationObserverInstance = null;
  intersectionObserverInstance = null;
  intersectionConstructorCalls = 0;

  globalThis.MutationObserver =
    MockMutationObserver as unknown as typeof MutationObserver;
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  disconnectMutationObserver();
  disconnectIntersectionObserver();

  globalThis.MutationObserver = originalMutationObserver;
  globalThis.IntersectionObserver = originalIntersectionObserver;
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
});

describe("MutationObserver utilities", () => {
  it("batches added nodes and calls the scan callback", () => {
    const onNewContent = vi.fn();

    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    setupMutationObserver(onNewContent);

    const validNode = document.createElement("div");
    const convertedNode = document.createElement("div");
    convertedNode.setAttribute(CONVERTED_ATTR, "true");

    mutationCallback?.(
      [
        {
          addedNodes: [validNode, convertedNode],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    expect(onNewContent).toHaveBeenCalledTimes(1);
    expect(onNewContent.mock.calls[0]?.[0]).toBe(validNode);
  });

  it("ignores non-element nodes", () => {
    const onNewContent = vi.fn();

    window.requestAnimationFrame = vi.fn();

    setupMutationObserver(onNewContent);

    const textNode = document.createTextNode("text");

    mutationCallback?.(
      [
        {
          addedNodes: [textNode],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    expect(onNewContent).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("replaces existing observer and clears pending raf", () => {
    const onNewContent = vi.fn();

    window.requestAnimationFrame = vi.fn(() => 99);
    window.cancelAnimationFrame = vi.fn();

    setupMutationObserver(onNewContent);
    const previousObserver = mutationObserverInstance as unknown as MockMutationObserver;

    const node = document.createElement("div");
    mutationCallback?.(
      [
        {
          addedNodes: [node],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    setupMutationObserver(onNewContent);

    expect(previousObserver.disconnect).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(99);
  });

  it("disconnects observer and cancels pending animation frame", () => {
    const onNewContent = vi.fn();

    window.requestAnimationFrame = vi.fn(() => 42);
    window.cancelAnimationFrame = vi.fn();

    setupMutationObserver(onNewContent);

    const node = document.createElement("div");
    mutationCallback?.(
      [
        {
          addedNodes: [node],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    disconnectMutationObserver();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it("does not schedule multiple RAF callbacks", () => {
    const onNewContent = vi.fn();

    window.requestAnimationFrame = vi.fn(() => 101);

    setupMutationObserver(onNewContent);

    const node = document.createElement("div");
    mutationCallback?.(
      [
        {
          addedNodes: [node],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    mutationCallback?.(
      [
        {
          addedNodes: [document.createElement("div")],
        } as unknown as MutationRecord,
      ],
      mutationObserverInstance as MutationObserver,
    );

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});

describe("IntersectionObserver utilities", () => {
  it("queues elements and converts when visible", () => {
    const onVisible = vi.fn();
    const element = document.createElement("div");

    setupIntersectionObserver(onVisible);
    observeForConversion(element);

    expect(element.getAttribute(PENDING_ATTR)).toBe("true");
    expect(intersectionObserverInstance?.observe).toHaveBeenCalledWith(element);

    intersectionCallback?.(
      [
        {
          isIntersecting: true,
          target: element,
        } as unknown as IntersectionObserverEntry,
      ],
      intersectionObserverInstance as IntersectionObserver,
    );

    expect(intersectionObserverInstance?.unobserve).toHaveBeenCalledWith(
      element,
    );
    expect(element.hasAttribute(PENDING_ATTR)).toBe(false);
    expect(onVisible).toHaveBeenCalledWith(element);
  });

  it("ignores entries that are not intersecting", () => {
    const onVisible = vi.fn();
    const element = document.createElement("div");

    setupIntersectionObserver(onVisible);

    intersectionCallback?.(
      [
        {
          isIntersecting: false,
          target: element,
        } as unknown as IntersectionObserverEntry,
      ],
      intersectionObserverInstance as IntersectionObserver,
    );

    expect(onVisible).not.toHaveBeenCalled();
  });

  it("skips setup if observer already exists", () => {
    const onVisible = vi.fn();

    setupIntersectionObserver(onVisible);
    setupIntersectionObserver(onVisible);

    expect(intersectionConstructorCalls).toBe(1);
  });

  it("ignores observe calls before setup", () => {
    const element = document.createElement("div");
    observeForConversion(element);

    expect(element.hasAttribute(PENDING_ATTR)).toBe(false);
  });
});
