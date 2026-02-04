// Content script entry point
// Coordinates initialization, message handling, and price scanning

import type { Settings, ExchangeRates } from "../lib/types";

import { injectStyles, isInViewport } from "./utils/domUtils";
import {
  setupMutationObserver,
  setupIntersectionObserver,
  disconnectMutationObserver,
  disconnectIntersectionObserver,
} from "./utils/observers";
import {
  processPriceContainers,
  convertPriceElement,
} from "./scanners/priceContainers";
import { processTextPrices } from "./scanners/textPrices";
import { revertConvertedPrices } from "./utils/revert";

console.log("Price Converter: Content script loaded");

let settings: Settings | null = null;
let exchangeRates: ExchangeRates | null = null;

// ============================================================================
// SCANNING
// ============================================================================

/**
 * Scan container for prices and convert them
 */
function scanAndConvertPrices(container: HTMLElement): void {
  if (!settings || !exchangeRates) return;

  // Step 1: Process e-commerce price containers
  processPriceContainers(container, settings, exchangeRates);

  // Step 2: Process inline text prices (only in viewport)
  if (isInViewport(container)) {
    processTextPrices(container, settings, exchangeRates);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the content script
 */
async function init(): Promise<void> {
  console.log("Price Converter: Initializing on", window.location.href);

  try {
    const [settingsResponse, ratesResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
      chrome.runtime.sendMessage({ type: "GET_RATES" }),
    ]);

    settings = settingsResponse?.settings;
    exchangeRates = ratesResponse?.rates;

    console.log("Price Converter: Settings loaded", settings);
    console.log("Price Converter: Rates loaded", exchangeRates?.date);

    if (settings?.enabled && exchangeRates) {
      startConversion();
    }
  } catch (error) {
    console.error("Price Converter: Failed to initialize", error);
  }
}

/**
 * Start the price conversion process
 */
function startConversion(): void {
  if (!settings || !exchangeRates) return;

  injectStyles();

  // Setup lazy loading for off-screen elements
  setupIntersectionObserver((element) => {
    if (settings && exchangeRates) {
      convertPriceElement(element, settings, exchangeRates);
    }
  });

  // Initial scan
  scanAndConvertPrices(document.body);

  // Watch for dynamic content
  setupMutationObserver(settings, exchangeRates, scanAndConvertPrices);
}

/**
 * Stop the price conversion process
 */
function stopConversion(): void {
  revertConvertedPrices();
  disconnectMutationObserver();
  disconnectIntersectionObserver();
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "SETTINGS_UPDATED":
      handleSettingsUpdate(message.payload as Settings);
      sendResponse({ success: true });
      break;

    case "RATES_UPDATED":
      handleRatesUpdate(message.payload as ExchangeRates);
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
      handleToggle();
      sendResponse({ enabled: settings?.enabled });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true;
});

function handleSettingsUpdate(newSettings: Settings): void {
  settings = newSettings;
  console.log("Price Converter: Settings updated", settings);

  if (settings.enabled) {
    revertConvertedPrices();
    startConversion();
  } else {
    stopConversion();
  }
}

function handleRatesUpdate(newRates: ExchangeRates): void {
  exchangeRates = newRates;
  console.log("Price Converter: Rates updated", exchangeRates.date);

  if (settings?.enabled) {
    revertConvertedPrices();
    scanAndConvertPrices(document.body);
  }
}

function handleToggle(): void {
  if (!settings) return;

  settings.enabled = !settings.enabled;

  if (settings.enabled && exchangeRates) {
    startConversion();
  } else {
    stopConversion();
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
