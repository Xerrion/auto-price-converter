import type { Settings, ExchangeRates } from "$lib/types";
import type { PageContext } from "../content/context";
import { buildPageContext } from "../content/context";
import { isUrlExcluded } from "$lib/exclusion";

import { injectStyles } from "../content/utils/domUtils";
import {
  setupMutationObserver,
  disconnectMutationObserver,
} from "../content/utils/observers";
import { revertConvertedPrices } from "../content/utils/revert";
import { SmartScanner } from "../content/scanner";

let settings: Settings | null = null;
let exchangeRates: ExchangeRates | null = null;
let pageContext: PageContext | null = null;
let scanner: SmartScanner | null = null;
let isExcluded = false;

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  async main() {
    console.log("Auto Price Converter: Content script loaded");
    await init();
    setupMessageListener();
  },
});

async function init(): Promise<void> {
  console.log("Auto Price Converter: Initializing on", window.location.href);

  try {
    pageContext = await buildPageContext();
    console.log("Auto Price Converter: Page context", {
      locale: pageContext.locale,
      currency: pageContext.currency,
      currencySource: pageContext.currencySource,
    });

    const [settingsResponse, ratesResponse] = await Promise.all([
      browser.runtime.sendMessage({ type: "GET_SETTINGS" }),
      browser.runtime.sendMessage({ type: "GET_RATES" }),
    ]);

    settings = settingsResponse?.settings;
    exchangeRates = ratesResponse?.rates;

    console.log("Auto Price Converter: Settings loaded", settings);
    console.log("Auto Price Converter: Rates loaded", exchangeRates?.date);
    console.log(
      `Auto Price Converter: ${
        Object.keys(exchangeRates?.rates || {}).length
      } currencies supported`,
    );

    if (
      settings &&
      isUrlExcluded(window.location.href, settings.exclusionList)
    ) {
      isExcluded = true;
      console.log("Auto Price Converter: URL is excluded from conversion");
      return;
    }

    if (settings?.enabled && exchangeRates) {
      startConversion();
    }
  } catch (error) {
    console.error("Auto Price Converter: Failed to initialize", error);
  }
}

function startConversion(): void {
  if (!settings || !exchangeRates || !pageContext) return;

  injectStyles();

  scanner = new SmartScanner({
    settings,
    exchangeRates,
    pageContext,
  });

  scanner.scan(document.body);

  setupMutationObserver((container: HTMLElement) => {
    scanner?.scan(container);
  });
}

function stopConversion(): void {
  scanner?.disconnect();
  scanner = null;
  revertConvertedPrices();
  disconnectMutationObserver();
}

function setupMessageListener(): void {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
}

function handleSettingsUpdate(newSettings: Settings): void {
  const previouslyExcluded = isExcluded;
  settings = newSettings;
  console.log("Price Converter: Settings updated", settings);

  isExcluded = isUrlExcluded(window.location.href, settings.exclusionList);

  if (isExcluded) {
    console.log("Price Converter: URL is now excluded");
    stopConversion();
    return;
  }

  if (previouslyExcluded && !isExcluded) {
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
