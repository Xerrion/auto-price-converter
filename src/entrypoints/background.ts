import type { ExchangeRates, Settings } from "$lib/types";
import { getExchangeRates } from "$lib/exchangeRates";
import { getSymbols, refreshSymbols } from "$lib/symbols";
import {
  getSettings,
  saveSettings,
  getCachedRates,
  DEFAULT_SETTINGS,
} from "$lib/storage";

let cachedRates: ExchangeRates | null = null;
let cachedSymbols: Record<string, string> | null = null;

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log("Extension installed:", details.reason);

    if (details.reason === "install") {
      await saveSettings(DEFAULT_SETTINGS);
    }

    await initializeRates();
    await initializeSymbols();
  });

  browser.runtime.onStartup.addListener(async () => {
    console.log("Extension started");
    await initializeRates();
    await initializeSymbols();
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message.type, "from:", sender.tab?.url);

    switch (message.type) {
      case "GET_RATES":
        handleGetRates(sendResponse);
        return true;

      case "GET_SETTINGS":
        handleGetSettings(sendResponse);
        return true;

      case "GET_SYMBOLS":
        handleGetSymbols(sendResponse);
        return true;

      case "SAVE_SETTINGS":
        handleSaveSettings(message.payload as Settings, sendResponse);
        return true;

      case "REFRESH_RATES":
        handleRefreshRates(sendResponse);
        return true;

      case "GET_TAB_INFO":
        if (sender.tab) {
          sendResponse({ tabId: sender.tab.id, url: sender.tab.url });
        }
        break;

      case "PING":
        sendResponse({ status: "pong" });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }

    return true;
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      console.log("Tab updated:", tabId, tab.url);
    }
  });
});

async function initializeRates(): Promise<void> {
  try {
    cachedRates = await getExchangeRates();
    console.log("Exchange rates initialized:", cachedRates.date);
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
  }
}

async function initializeSymbols(): Promise<void> {
  try {
    cachedSymbols = await getSymbols();
    console.log(
      "Currency symbols initialized:",
      Object.keys(cachedSymbols).length,
    );
  } catch (error) {
    console.error("Failed to fetch symbols:", error);
  }
}

async function handleGetRates(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    if (!cachedRates) {
      const stored = await getCachedRates();
      if (stored) {
        cachedRates = stored.rates;
        console.log("Loaded rates from storage cache:", cachedRates.date);
      } else {
        cachedRates = await getExchangeRates();
      }
    }
    sendResponse({ rates: cachedRates });
  } catch (error) {
    console.error("Failed to get rates:", error);
    sendResponse({ error: "Failed to get exchange rates" });
  }
}

async function handleGetSettings(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    const settings = await getSettings();
    sendResponse({ settings });
  } catch (error) {
    console.error("Failed to get settings:", error);
    sendResponse({ error: "Failed to get settings" });
  }
}

async function handleGetSymbols(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    if (!cachedSymbols || Object.keys(cachedSymbols).length === 0) {
      cachedSymbols = await getSymbols();
    }
    sendResponse({ symbols: cachedSymbols });
  } catch (error) {
    console.error("Failed to get symbols:", error);
    sendResponse({ error: "Failed to get currency symbols" });
  }
}

async function handleSaveSettings(
  settings: Settings,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    await saveSettings(settings);
    sendResponse({ success: true });

    const tabs = await browser.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      if (tab.id) {
        browser.tabs
          .sendMessage(tab.id, {
            type: "SETTINGS_UPDATED",
            payload: settings,
          })
          .catch(() => {
            // Ignore errors for tabs that don't have content script
          });
      }
    }
  } catch (error) {
    console.error("Failed to save settings:", error);
    sendResponse({ error: "Failed to save settings" });
  }
}

async function handleRefreshRates(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    cachedRates = await getExchangeRates();
    cachedSymbols = await refreshSymbols();
    sendResponse({ rates: cachedRates, symbols: cachedSymbols });

    const tabs = await browser.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      if (tab.id) {
        browser.tabs
          .sendMessage(tab.id, {
            type: "RATES_UPDATED",
            payload: cachedRates,
          })
          .catch(() => {
          });
      }
    }
  } catch (error) {
    console.error("Failed to refresh rates:", error);
    sendResponse({ error: "Failed to refresh exchange rates" });
  }
}
