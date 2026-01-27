// Content script for price conversion
// Main entry point - coordinates scanning, conversion, and DOM updates

// @ts-ignore - No types available for findAndReplaceDOMText
import findAndReplaceDOMText from "findandreplacedomtext";
import { convertCurrency } from "../lib/exchangeRates";
import type { Settings, ExchangeRates } from "../lib/types";

import { ALL_PRICE_SELECTORS } from "./platforms";
import { PRICE_REGEX, parsePrice } from "./priceParser";
import { extractPriceText } from "./priceExtractor";
import { formatPrice } from "./formatter";

console.log("Price Converter: Content script loaded");

let settings: Settings | null = null;
let exchangeRates: ExchangeRates | null = null;
let observer: MutationObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

// Attribute to mark elements pending conversion
const PENDING_ATTR = "data-price-pending";

// Attribute used to mark converted elements
const CONVERTED_ATTR = "data-price-converted";
const ORIGINAL_ATTR = "data-original-price";

// Inject fade-out animation CSS
function injectStyles(): void {
  if (document.getElementById("price-converter-styles")) return;

  const style = document.createElement("style");
  style.id = "price-converter-styles";
  style.textContent = `
    @keyframes price-highlight-fade {
      0% { background-color: rgba(255, 235, 59, 0.5); }
      70% { background-color: rgba(255, 235, 59, 0.3); }
      100% { background-color: transparent; }
    }
    .price-highlight-fade {
      animation: price-highlight-fade 1s ease-out forwards;
      border-radius: 2px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);
}

// Apply fading highlight to an element
function applyFadingHighlight(element: HTMLElement): void {
  element.classList.add("price-highlight-fade");
}

async function init(): Promise<void> {
  console.log("Price Converter: Initializing on", window.location.href);

  try {
    const [settingsResponse, ratesResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
      chrome.runtime.sendMessage({ type: "GET_RATES" }),
    ]);

    // Background returns { settings } and { rates }
    settings = settingsResponse?.settings;
    exchangeRates = ratesResponse?.rates;

    console.log("Price Converter: Settings loaded", settings);
    console.log("Price Converter: Rates loaded", exchangeRates?.date);

    if (settings?.enabled && exchangeRates) {
      injectStyles();
      setupIntersectionObserver();
      scanAndConvertPrices(document.body);
      setupObserver();
    }
  } catch (error) {
    console.error("Price Converter: Failed to initialize", error);
  }
}

function setupObserver(): void {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    if (!settings?.enabled || !exchangeRates) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (!element.hasAttribute(CONVERTED_ATTR)) {
            requestAnimationFrame(() => {
              scanAndConvertPrices(element);
            });
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function setupIntersectionObserver(): void {
  if (intersectionObserver) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          intersectionObserver!.unobserve(element);
          element.removeAttribute(PENDING_ATTR);
          convertPriceElement(element);
        }
      }
    },
    {
      // Start converting slightly before element enters viewport
      rootMargin: "100px",
    },
  );
}

function observeForConversion(element: HTMLElement): void {
  if (!intersectionObserver) return;
  element.setAttribute(PENDING_ATTR, "true");
  intersectionObserver.observe(element);
}

function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom >= -100 &&
    rect.top <= window.innerHeight + 100 &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth
  );
}

function scanAndConvertPrices(container: HTMLElement): void {
  if (!settings || !exchangeRates) return;

  // Step 1: Process e-commerce price containers
  processPriceContainers(container);

  // Step 2: Use findAndReplaceDOMText for remaining text prices (only in viewport)
  if (isInViewport(container)) {
    processTextPrices(container);
  }
}

function processPriceContainers(container: HTMLElement): void {
  if (!settings || !exchangeRates) return;

  let priceElements: NodeListOf<Element>;
  try {
    priceElements = container.querySelectorAll(ALL_PRICE_SELECTORS);
  } catch (e) {
    console.error("Price Converter: Selector error", e);
    return;
  }

  const elementsToProcess: Element[] = [...priceElements];
  try {
    if (container.matches && container.matches(ALL_PRICE_SELECTORS)) {
      elementsToProcess.unshift(container);
    }
  } catch (e) {
    // matches() can throw on invalid selectors
  }

  for (const element of elementsToProcess) {
    if (element.hasAttribute(CONVERTED_ATTR)) continue;
    if (element.hasAttribute(PENDING_ATTR)) continue;

    // Skip elements that are inside already-converted elements
    if (element.closest(`[${CONVERTED_ATTR}]`)) continue;

    // Skip nested price elements (if another price element contains this one)
    const isNestedPrice = elementsToProcess.some(
      (other) => other !== element && other.contains(element),
    );
    if (isNestedPrice) continue;

    // Skip container elements that contain multiple price items
    // These are wrapper elements, not individual prices
    const childPriceElements = element.querySelectorAll(
      '.price-item, .money, [data-price], .woocommerce-Price-amount, .a-price, [class*="price-item"]',
    );
    if (childPriceElements.length > 1) {
      continue;
    }

    const htmlElement = element as HTMLElement;

    // If element is in viewport, convert immediately; otherwise observe
    if (isInViewport(htmlElement)) {
      convertPriceElement(htmlElement);
    } else {
      observeForConversion(htmlElement);
    }
  }
}

function convertPriceElement(element: HTMLElement): void {
  if (!settings || !exchangeRates) return;
  if (element.hasAttribute(CONVERTED_ATTR)) return;

  const priceText = extractPriceText(element);
  if (!priceText) return;

  // Skip if the extracted text contains multiple prices
  const priceMatches = priceText.match(
    /\$[\d,.]+|\€[\d,.]+|£[\d,.]+|[\d,.]+\s*(USD|EUR|GBP|SEK|NOK|DKK|kr)/gi,
  );
  if (priceMatches && priceMatches.length > 1) {
    return;
  }

  const parsed = parsePrice(priceText);
  if (!parsed) return;

  // Skip if same currency as target
  if (parsed.currency === settings.targetCurrency) return;

  // Convert the price
  const convertedAmount = convertCurrency(
    parsed.amount,
    parsed.currency,
    settings.targetCurrency,
    exchangeRates,
  );

  const formattedPrice = formatPrice(
    convertedAmount,
    settings.targetCurrency,
    settings.decimalPlaces,
    settings.numberFormat,
  );

  // Store original and mark as converted
  element.setAttribute(CONVERTED_ATTR, "true");
  element.setAttribute(ORIGINAL_ATTR, element.innerHTML);
  element.setAttribute("data-original-text", priceText);

  // Replace content
  if (settings.showOriginalPrice) {
    element.innerHTML = `<span class="converted-price">${formattedPrice}</span> <span class="original-price" style="font-size: 0.85em; opacity: 0.7;">(${priceText})</span>`;
  } else {
    element.textContent = formattedPrice;
  }

  // Apply fading highlight
  if (settings.highlightConverted) {
    applyFadingHighlight(element);
  }

  element.title = `Converted from ${priceText}`;
}

function processTextPrices(container: HTMLElement): void {
  if (!settings || !exchangeRates) return;

  try {
    findAndReplaceDOMText(container, {
      find: PRICE_REGEX,
      replace: function (portion: any, match: any) {
        if (portion.index > 0) return "";

        const fullMatch = match[0];

        // Skip matches that look like IDs, years, or other non-price numbers
        // (numbers without currency symbols that are 4+ digits without decimals)
        if (/^\d{4,}$/.test(fullMatch.trim())) {
          return portion.text;
        }

        const parsed = parsePrice(fullMatch);

        if (!parsed || parsed.currency === settings!.targetCurrency) {
          return portion.text;
        }

        const convertedAmount = convertCurrency(
          parsed.amount,
          parsed.currency,
          settings!.targetCurrency,
          exchangeRates!,
        );

        const formattedPrice = formatPrice(
          convertedAmount,
          settings!.targetCurrency,
          settings!.decimalPlaces,
          settings!.numberFormat,
        );

        const span = document.createElement("span");
        span.setAttribute(CONVERTED_ATTR, "true");
        span.setAttribute(ORIGINAL_ATTR, fullMatch);

        if (settings!.showOriginalPrice) {
          span.textContent = `${formattedPrice} (${fullMatch})`;
        } else {
          span.textContent = formattedPrice;
        }

        if (settings!.highlightConverted) {
          applyFadingHighlight(span);
        }

        span.title = `Converted from ${fullMatch}`;
        return span;
      },
      filterElements: function (element: Element): boolean {
        if (!element || !element.tagName) return false;

        const tagName = element.tagName.toLowerCase();
        if (
          tagName === "script" ||
          tagName === "style" ||
          tagName === "noscript" ||
          tagName === "textarea" ||
          tagName === "input" ||
          tagName === "select" ||
          tagName === "svg" ||
          tagName === "a" // Skip links - often contain IDs and non-price numbers
        ) {
          return false;
        }

        if (element.hasAttribute && element.hasAttribute(CONVERTED_ATTR)) {
          return false;
        }

        // Skip elements inside already-converted elements (prevents double-conversion)
        if (element.closest && element.closest(`[${CONVERTED_ATTR}]`)) {
          return false;
        }

        try {
          if (element.matches && element.matches(ALL_PRICE_SELECTORS)) {
            return false;
          }
        } catch (e) {
          // Ignore selector errors
        }

        const className = element.className || "";
        if (
          typeof className === "string" &&
          (className.includes("offscreen") ||
            className.includes("sr-only") ||
            className.includes("visually-hidden") ||
            className.includes("screen-reader"))
        ) {
          return false;
        }

        return true;
      },
    });
  } catch (error) {
    console.error("Price Converter: Error in text processing", error);
  }
}

function revertConvertedPrices(): void {
  const convertedElements = document.querySelectorAll(`[${CONVERTED_ATTR}]`);

  for (const element of convertedElements) {
    const originalContent = element.getAttribute(ORIGINAL_ATTR);
    if (originalContent) {
      if (element.hasAttribute("data-original-text")) {
        // E-commerce container - restore innerHTML
        (element as HTMLElement).innerHTML = originalContent;
        element.removeAttribute(CONVERTED_ATTR);
        element.removeAttribute(ORIGINAL_ATTR);
        element.removeAttribute("data-original-text");
        (element as HTMLElement).style.backgroundColor = "";
        (element as HTMLElement).style.borderRadius = "";
        (element as HTMLElement).style.padding = "";
        (element as HTMLElement).title = "";
      } else {
        // Text wrapper span - replace with text node
        const textNode = document.createTextNode(originalContent);
        element.parentNode?.replaceChild(textNode, element);
      }
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "SETTINGS_UPDATED":
      settings = message.payload as Settings;
      console.log("Price Converter: Settings updated", settings);

      if (settings.enabled) {
        revertConvertedPrices();
        scanAndConvertPrices(document.body);
        setupObserver();
      } else {
        revertConvertedPrices();
        observer?.disconnect();
      }
      sendResponse({ success: true });
      break;

    case "RATES_UPDATED":
      exchangeRates = message.payload as ExchangeRates;
      console.log("Price Converter: Rates updated", exchangeRates.date);

      if (settings?.enabled) {
        revertConvertedPrices();
        scanAndConvertPrices(document.body);
      }
      sendResponse({ success: true });
      break;

    case "GET_PAGE_INFO":
      sendResponse({
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
      });
      break;

    case "TOGGLE_ENABLED":
      if (settings) {
        settings.enabled = !settings.enabled;
        if (settings.enabled && exchangeRates) {
          scanAndConvertPrices(document.body);
          setupObserver();
        } else {
          revertConvertedPrices();
          observer?.disconnect();
        }
      }
      sendResponse({ enabled: settings?.enabled });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true;
});

// ============================================================================
// ENTRY POINT
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
