// Content script - runs in the context of web pages

console.log("Content script loaded");

// Example: Listen for messages from background or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_PAGE_INFO":
      sendResponse({
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
      });
      break;

    case "HIGHLIGHT_LINKS":
      highlightLinks();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true;
});

// Example function to demonstrate DOM manipulation
function highlightLinks(): void {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.style.backgroundColor = "yellow";
  });
}

// Example: Send a message to background script
async function pingBackground(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: "PING" });
    console.log("Background response:", response);
  } catch (error) {
    console.error("Error communicating with background:", error);
  }
}

// Initialize content script
function init(): void {
  console.log("Content script initialized on:", window.location.href);
  pingBackground();
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
