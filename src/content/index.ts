// Content script entry point
// Coordinates initialization, message handling, and price scanning

import type { Settings, ExchangeRates } from "../lib/types";
import type { PageContext } from "./context";
import { buildPageContext } from "./context";
import { isUrlExcluded } from "../lib/exclusion";

import { injectStyles } from "./utils/domUtils";
import { setupMutationObserver, disconnectMutationObserver } from "./utils/observers";
import { revertConvertedPrices } from "./utils/revert";
import { SmartScanner } from "./scanner";

console.log("Price Converter: Content script loaded");

let settings: Settings | null = null;
let exchangeRates: ExchangeRates | null = null;
let pageContext: PageContext | null = null;
let scanner: SmartScanner | null = null;
let isExcluded = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the content script
 */
async function init(): Promise<void> {
  console.log("Price Converter: Initializing on", window.location.href);

  try {
    // Build page context first (for currency detection and locale)
    pageContext = await buildPageContext();
    console.log("Price Converter: Page context", {
      locale: pageContext.locale,
      currency: pageContext.currency,
      currencySource: pageContext.currencySource,
    });

    const [settingsResponse, ratesResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }),
      chrome.runtime.sendMessage({ type: "GET_RATES" }),
    ]);

    settings = settingsResponse?.settings;
    exchangeRates = ratesResponse?.rates;

    console.log("Price Converter: Settings loaded", settings);
    console.log("Price Converter: Rates loaded", exchangeRates?.date);
    console.log(
      `Price Converter: ${Object.keys(exchangeRates?.rates || {}).length} currencies supported`,
    );

    // Check if current URL is excluded from conversion
    if (settings && isUrlExcluded(window.location.href, settings.exclusionList)) {
      isExcluded = true;
      console.log("Price Converter: URL is excluded from conversion");
      return;
    }

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
  if (!settings || !exchangeRates || !pageContext) return;

  injectStyles();

  // Create the smart scanner with dynamic patterns from exchange rates
  scanner = new SmartScanner({
    settings,
    exchangeRates,
    pageContext,
  });

  // Initial scan
  scanner.scan(document.body);

  // Watch for dynamic content
  setupMutationObserver((container: HTMLElement) => {
    scanner?.scan(container);
  });
}

/**
 * Stop the price conversion process
 */
function stopConversion(): void {
  scanner?.disconnect();
  scanner = null;
  revertConvertedPrices();
  disconnectMutationObserver();
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
        isExcluded,
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
  const previouslyExcluded = isExcluded;
  settings = newSettings;
  console.log("Price Converter: Settings updated", settings);

  // Re-check exclusion status (user may have added/removed current URL)
  isExcluded = isUrlExcluded(window.location.href, settings.exclusionList);

  if (isExcluded) {
    // URL is now excluded - stop conversion if running
    console.log("Price Converter: URL is now excluded");
    stopConversion();
    return;
  }

  if (previouslyExcluded && !isExcluded) {
    // URL was excluded but no longer is - can start conversion
    console.log("Price Converter: URL is no longer excluded");
  }

  if (settings.enabled && exchangeRates) {
    revertConvertedPrices();
    startConversion();
  } else {
    stopConversion();
  }
}

function handleRatesUpdate(newRates: ExchangeRates): void {
  exchangeRates = newRates;
  console.log("Price Converter: Rates updated", exchangeRates.date);

  if (settings?.enabled && pageContext) {
    // Reset scanner and rescan
    scanner?.reset();
    scanner?.updateOptions({ exchangeRates });
    scanner?.scan(document.body);
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
