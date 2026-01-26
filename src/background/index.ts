// Background service worker for Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details.reason);

  // Initialize default settings on first install
  if (details.reason === "install") {
    chrome.storage.sync.set({
      settings: {
        enabled: true,
        theme: "light",
        notifications: true,
      },
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message, "from:", sender);

  // Handle different message types
  switch (message.type) {
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

  // Return true to indicate async response
  return true;
});

// Listen for tab updates (example)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tabId, tab.url);
  }
});

export {};
